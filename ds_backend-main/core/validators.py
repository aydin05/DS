import subprocess
import json
import logging
import os
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile, SimpleUploadedFile

logger = logging.getLogger(__name__)

# Samsung display supported video specs
VIDEO_MAX_BITRATE_KBPS = 8000
VIDEO_MAX_FPS = 30
VIDEO_ALLOWED_CODECS = ['h264']


def _probe_video(path):
    """Run ffprobe on a file and return (video_stream_dict, format_dict) or raise."""
    result = subprocess.run(
        [
            'ffprobe', '-v', 'quiet',
            '-print_format', 'json',
            '-show_streams', '-show_format',
            path,
        ],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        raise ValidationError('Could not read video file. Please upload a valid MP4 video.')

    probe = json.loads(result.stdout)
    video_stream = next(
        (s for s in probe.get('streams', []) if s.get('codec_type') == 'video'),
        None,
    )
    if not video_stream:
        raise ValidationError('No video stream found in the uploaded file.')
    return video_stream, probe.get('format', {})


def _needs_transcode(video_stream, fmt):
    """Return True if the video doesn't match Samsung display specs."""
    codec = video_stream.get('codec_name', '').lower()
    if codec not in VIDEO_ALLOWED_CODECS:
        return True

    bitrate_str = video_stream.get('bit_rate') or fmt.get('bit_rate')
    if bitrate_str:
        try:
            if int(bitrate_str) / 1000 > VIDEO_MAX_BITRATE_KBPS:
                return True
        except (ValueError, TypeError):
            pass

    fps_str = video_stream.get('r_frame_rate', '')
    if fps_str and '/' in fps_str:
        try:
            num, den = fps_str.split('/')
            if float(num) / float(den) > VIDEO_MAX_FPS + 0.5:
                return True
        except (ValueError, ZeroDivisionError):
            pass

    return False


def transcode_video_if_needed(file_obj):
    """
    Inspect the uploaded video. If it doesn't match Samsung display specs
    (H.264, ≤8000 kbps, ≤30 fps), re-encode it with ffmpeg automatically.
    Returns the original file_obj if already compliant, or a new
    SimpleUploadedFile with the transcoded content.
    """
    import tempfile
    fd_in, tmp_in = tempfile.mkstemp(prefix='_vid_in_', dir='/tmp')
    fd_out, tmp_out = tempfile.mkstemp(prefix='_vid_out_', suffix='.mp4', dir='/tmp')
    os.close(fd_out)
    try:
        with os.fdopen(fd_in, 'wb') as f:
            for chunk in file_obj.chunks():
                f.write(chunk)
        file_obj.seek(0)

        video_stream, fmt = _probe_video(tmp_in)

        if not _needs_transcode(video_stream, fmt):
            logger.info('Video already compliant, no transcode needed.')
            return file_obj

        logger.info('Video needs transcode — re-encoding to H.264 / 8000 kbps / 30 fps …')

        cmd = [
            'ffmpeg', '-y', '-i', tmp_in,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '18',
            '-maxrate', f'{VIDEO_MAX_BITRATE_KBPS}k',
            '-bufsize', f'{VIDEO_MAX_BITRATE_KBPS * 2}k',
            '-r', str(VIDEO_MAX_FPS),
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '128k',
            '-movflags', '+faststart',
            tmp_out,
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if proc.returncode != 0:
            logger.error('ffmpeg failed: %s', proc.stderr[-500:] if proc.stderr else '')
            raise ValidationError(
                'Video transcoding failed. Please upload a valid video file.'
            )

        with open(tmp_out, 'rb') as f:
            transcoded_bytes = f.read()

        original_name = getattr(file_obj, 'name', 'video.mp4')
        if not original_name.lower().endswith('.mp4'):
            original_name = os.path.splitext(original_name)[0] + '.mp4'

        new_file = SimpleUploadedFile(
            name=original_name,
            content=transcoded_bytes,
            content_type='video/mp4',
        )
        logger.info(
            'Transcode complete: %d KB → %d KB',
            file_obj.size // 1024,
            len(transcoded_bytes) // 1024,
        )
        return new_file

    finally:
        for p in (tmp_in, tmp_out):
            if os.path.exists(p):
                os.remove(p)
