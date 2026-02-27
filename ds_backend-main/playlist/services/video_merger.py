"""
Video Merger Service — Composites all slides of a playlist into a single MP4
using FFmpeg. Each slide becomes a video segment at the display resolution
with its items (images, videos, text) positioned correctly, then all segments
are concatenated into one looping-ready video.

Requirements:
    - FFmpeg must be installed (already present in the Docker image).
    - MEDIA_ROOT must be writable.
"""

import hashlib
import json
import logging
import os
import shutil
import subprocess
import tempfile
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)

MERGED_VIDEO_DIR = os.path.join(settings.MEDIA_ROOT, "merged_videos")


def _ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def _playlist_content_hash(playlist_id, slides_data, width, height):
    """Deterministic hash of the playlist content so we can cache the output."""
    raw = json.dumps({
        "pid": playlist_id,
        "w": width,
        "h": height,
        "slides": slides_data,
    }, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _download_to_tmp(url, tmp_dir):
    """Download a remote URL to a temp file and return the local path."""
    filename = os.path.basename(url).split("?")[0] or "media_file"
    local_path = os.path.join(tmp_dir, filename)

    # Avoid name collisions
    counter = 0
    base, ext = os.path.splitext(local_path)
    while os.path.exists(local_path):
        counter += 1
        local_path = f"{base}_{counter}{ext}"

    if url.startswith("http://") or url.startswith("https://"):
        urllib.request.urlretrieve(url, local_path)
    elif os.path.isfile(url):
        shutil.copy2(url, local_path)
    else:
        # Try as relative to MEDIA_ROOT
        media_path = os.path.join(settings.MEDIA_ROOT, url.lstrip("/"))
        if os.path.isfile(media_path):
            shutil.copy2(media_path, local_path)
        else:
            logger.warning("Cannot resolve media file: %s", url)
            return None
    return local_path


def _strip_html_tags(html_text):
    """Very basic HTML tag stripper for rendering text via FFmpeg."""
    import re
    text = re.sub(r"<[^>]+>", "", html_text or "")
    text = text.replace("&nbsp;", " ").replace("&amp;", "&")
    text = text.replace("&lt;", "<").replace("&gt;", ">")
    return text.strip()


def _build_slide_segment(slide_data, canvas_w, canvas_h, tmp_dir, segment_index):
    """
    Build a single slide's video segment.
    Returns the path to the segment MP4 file, or None on failure.
    """
    duration = max(slide_data.get("duration", 5), 1)
    bg_color = slide_data.get("bg_color", "#000000") or "#000000"
    # Normalize hex color for FFmpeg (remove # prefix → 0x prefix)
    ff_bg = bg_color.replace("#", "0x") if bg_color.startswith("#") else "0x000000"

    items = slide_data.get("items", [])
    segment_path = os.path.join(tmp_dir, f"segment_{segment_index:04d}.mp4")

    # Separate items by type
    video_items = [it for it in items if it.get("type_content") == "video"]
    image_items = [it for it in items if it.get("type_content") == "image"]
    text_items = [it for it in items if it.get("type_content") in ("text", "globaltext")]

    # ── Case 1: Slide has a video item ────────────────────────────────
    if video_items:
        item = video_items[0]  # Use first video
        attr = item.get("attr", {})
        location = attr.get("location", "")
        local_video = _download_to_tmp(location, tmp_dir) if location else None

        if local_video:
            # Build filter: scale video to canvas, pad with bg, then overlay text
            filter_parts = []
            # Input 0 = video, Input 1 = color background
            filter_parts.append(
                f"color=c={ff_bg}:s={canvas_w}x{canvas_h}:d={duration}:r=30[bg]"
            )
            filter_parts.append(
                f"[0:v]scale={canvas_w}:{canvas_h}:force_original_aspect_ratio=decrease,"
                f"pad={canvas_w}:{canvas_h}:(ow-iw)/2:(oh-ih)/2:color={ff_bg}[vid]"
            )
            filter_parts.append("[bg][vid]overlay=0:0:shortest=1[base]")

            current_label = "base"
            current_label = _add_text_overlays(
                filter_parts, text_items, current_label, canvas_w, canvas_h
            )

            filter_complex = ";".join(filter_parts)

            cmd = [
                "ffmpeg", "-y",
                "-i", local_video,
                "-filter_complex", filter_complex,
                "-map", f"[{current_label}]",
                "-t", str(duration),
                "-c:v", "libx264", "-preset", "fast",
                "-pix_fmt", "yuv420p",
                "-an",  # no audio for digital signage
                "-r", "30",
                segment_path,
            ]
        else:
            # Video file not found — fall back to static bg
            cmd = _build_static_segment_cmd(
                ff_bg, canvas_w, canvas_h, duration, text_items,
                image_items, tmp_dir, segment_path
            )

    # ── Case 2: Image-only (or image + text) slide ───────────────────
    elif image_items:
        cmd = _build_static_segment_cmd(
            ff_bg, canvas_w, canvas_h, duration, text_items,
            image_items, tmp_dir, segment_path
        )

    # ── Case 3: Text-only slide ──────────────────────────────────────
    else:
        cmd = _build_static_segment_cmd(
            ff_bg, canvas_w, canvas_h, duration, text_items,
            [], tmp_dir, segment_path
        )

    logger.info("FFmpeg segment %d cmd: %s", segment_index, " ".join(cmd))
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            logger.error("FFmpeg segment %d failed: %s", segment_index, result.stderr[-500:])
            return None
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg segment %d timed out", segment_index)
        return None

    return segment_path if os.path.isfile(segment_path) else None


def _build_static_segment_cmd(ff_bg, canvas_w, canvas_h, duration,
                               text_items, image_items, tmp_dir, output_path):
    """Build an FFmpeg command for a static (non-video) slide."""
    # Input 0 is always the lavfi color background.
    # Image inputs start at index 1.
    image_inputs = []
    filter_parts = []

    # [0:v] is the lavfi color canvas — rename it to [bg] for clarity
    filter_parts.append(f"[0:v]copy[bg]")
    current_label = "bg"

    # Overlay images (inputs start at index 1)
    img_input_idx = 1
    for idx, item in enumerate(image_items):
        attr = item.get("attr", {})
        location = attr.get("location", "")
        local_img = _download_to_tmp(location, tmp_dir) if location else None
        if not local_img:
            continue

        image_inputs.extend(["-i", local_img])

        top = item.get("top", 0)
        left = item.get("left", 0)
        width = item.get("width", canvas_w)
        height = item.get("height", canvas_h)
        out_label = f"img{idx}"

        filter_parts.append(
            f"[{img_input_idx}:v]scale={width}:{height}[scaled_img{idx}]"
        )
        filter_parts.append(
            f"[{current_label}][scaled_img{idx}]overlay={left}:{top}[{out_label}]"
        )
        current_label = out_label
        img_input_idx += 1

    # Add text overlays
    current_label = _add_text_overlays(
        filter_parts, text_items, current_label, canvas_w, canvas_h
    )

    filter_complex = ";".join(filter_parts)

    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", f"color=c={ff_bg}:s={canvas_w}x{canvas_h}:d={duration}:r=30",
    ]
    cmd.extend(image_inputs)
    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", f"[{current_label}]",
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast",
        "-pix_fmt", "yuv420p",
        "-an",
        "-r", "30",
        output_path,
    ])
    return cmd


def _add_text_overlays(filter_parts, text_items, current_label, canvas_w, canvas_h):
    """Append drawtext filters for text items. Returns the final label."""
    for idx, item in enumerate(text_items):
        attr = item.get("attr", {})
        raw_text = attr.get("textarea", "")
        text = _strip_html_tags(raw_text)
        if not text:
            continue

        top = item.get("top", 0)
        left = item.get("left", 0)
        font_size = attr.get("font_size", 24)
        color = (attr.get("color", "#FFFFFF") or "#FFFFFF").replace("#", "0x")
        bg_color = attr.get("frame_bg_color", "")
        is_scrolling = attr.get("is_scrolling", False)

        # Escape special chars for FFmpeg drawtext
        text = text.replace("'", "\u2019").replace(":", "\\:").replace("\\", "\\\\")

        out_label = f"txt{idx}"

        if is_scrolling:
            direction = attr.get("direction", "left")
            speed = attr.get("speed", 3)
            if direction == "left":
                x_expr = f"w-mod(t*{speed}*30\\,w+tw)"
            elif direction == "right":
                x_expr = f"-tw+mod(t*{speed}*30\\,w+tw)"
            else:
                x_expr = str(left)

            filter_parts.append(
                f"[{current_label}]drawtext=text='{text}':"
                f"fontsize={font_size}:fontcolor={color}:"
                f"x={x_expr}:y={top}[{out_label}]"
            )
        else:
            box_parts = ""
            if bg_color and bg_color != "transparent":
                ff_box_color = bg_color.replace("#", "0x")
                box_parts = f":box=1:boxcolor={ff_box_color}@0.8:boxborderw=5"

            filter_parts.append(
                f"[{current_label}]drawtext=text='{text}':"
                f"fontsize={font_size}:fontcolor={color}:"
                f"x={left}:y={top}{box_parts}[{out_label}]"
            )
        current_label = out_label

    return current_label


def merge_playlist_slides(playlist, slides_data, width, height, force=False):
    """
    Main entry point. Generates a merged MP4 for the given playlist.

    Args:
        playlist: Playlist model instance
        slides_data: Serialized slides list (from PlaylistDetailSerializer)
        width: Canvas width (from display type)
        height: Canvas height (from display type)
        force: If True, regenerate even if cached version exists

    Returns:
        Relative path to the merged video (under MEDIA_ROOT), or None on failure.
    """
    if not slides_data:
        logger.warning("No slides to merge for playlist %s", playlist.id)
        return None

    _ensure_dir(MERGED_VIDEO_DIR)
    content_hash = _playlist_content_hash(playlist.id, slides_data, width, height)
    output_filename = f"playlist_{playlist.id}_{content_hash}.mp4"
    output_path = os.path.join(MERGED_VIDEO_DIR, output_filename)
    relative_path = os.path.join("merged_videos", output_filename)

    # Return cached if exists and not forcing
    if not force and os.path.isfile(output_path):
        logger.info("Returning cached merged video: %s", relative_path)
        return relative_path

    logger.info("Starting merge for playlist %s (%dx%d, %d slides)",
                playlist.id, width, height, len(slides_data))

    tmp_dir = tempfile.mkdtemp(prefix="ds_merge_")
    try:
        segment_paths = []
        for i, slide in enumerate(slides_data):
            seg = _build_slide_segment(slide, width, height, tmp_dir, i)
            if seg:
                segment_paths.append(seg)
            else:
                logger.warning("Skipping slide %d — segment build failed", i)

        if not segment_paths:
            logger.error("No segments produced for playlist %s", playlist.id)
            return None

        # If only one segment, just copy it
        if len(segment_paths) == 1:
            shutil.copy2(segment_paths[0], output_path)
            logger.info("Single segment, copied directly.")
            return relative_path

        # Concatenate all segments using FFmpeg concat demuxer
        concat_list_path = os.path.join(tmp_dir, "concat_list.txt")
        with open(concat_list_path, "w") as f:
            for seg in segment_paths:
                f.write(f"file '{seg}'\n")

        concat_cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", concat_list_path,
            "-c:v", "libx264", "-preset", "fast",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-an",
            output_path,
        ]

        logger.info("FFmpeg concat cmd: %s", " ".join(concat_cmd))
        result = subprocess.run(concat_cmd, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            logger.error("FFmpeg concat failed: %s", result.stderr[-500:])
            return None

        logger.info("Merged video created: %s", relative_path)
        return relative_path

    except Exception as e:
        logger.exception("Error merging playlist %s: %s", playlist.id, str(e))
        return None
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
