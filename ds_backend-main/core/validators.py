import subprocess
import json
import os
from django.core.exceptions import ValidationError


# Samsung QM43R (2019) supported video specs
VIDEO_MAX_BITRATE_KBPS = 8000
VIDEO_MAX_FPS = 30
VIDEO_ALLOWED_CODECS = ['h264']


def validate_video_file(file_obj):
    """
    Validate uploaded video files against Samsung display hardware limits.
    Uses ffprobe to inspect codec, bitrate, and frame rate.
    Returns None on success, raises ValidationError with details on failure.
    """
    # Write to a temp file so ffprobe can read it
    tmp_path = '/tmp/_video_validate_' + str(os.getpid())
    try:
        with open(tmp_path, 'wb') as f:
            for chunk in file_obj.chunks():
                f.write(chunk)
        # Reset file pointer so Django can still save it later
        file_obj.seek(0)

        result = subprocess.run(
            [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_streams',
                '-show_format',
                tmp_path,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            raise ValidationError('Could not read video file. Please upload a valid MP4 video.')

        probe = json.loads(result.stdout)
        streams = probe.get('streams', [])
        video_stream = None
        for s in streams:
            if s.get('codec_type') == 'video':
                video_stream = s
                break

        if not video_stream:
            raise ValidationError('No video stream found in the uploaded file.')

        errors = []

        # 1. Codec check
        codec = video_stream.get('codec_name', '').lower()
        if codec not in VIDEO_ALLOWED_CODECS:
            errors.append(
                'Video codec "%s" is not supported. Please use H.264 (MP4).' % codec
            )

        # 2. Bitrate check (try stream bitrate first, then format-level)
        bitrate_str = video_stream.get('bit_rate')
        if not bitrate_str:
            bitrate_str = probe.get('format', {}).get('bit_rate')
        if bitrate_str:
            try:
                bitrate_kbps = int(bitrate_str) / 1000
                if bitrate_kbps > VIDEO_MAX_BITRATE_KBPS:
                    errors.append(
                        'Video bitrate is %.0f kbps, maximum allowed is %d kbps. '
                        'Please re-encode with a lower bitrate.' % (bitrate_kbps, VIDEO_MAX_BITRATE_KBPS)
                    )
            except (ValueError, TypeError):
                pass

        # 3. Frame rate check
        fps_str = video_stream.get('r_frame_rate', '')
        if fps_str and '/' in fps_str:
            try:
                num, den = fps_str.split('/')
                fps = float(num) / float(den)
                if fps > VIDEO_MAX_FPS + 0.5:  # small tolerance
                    errors.append(
                        'Video frame rate is %.1f fps, maximum allowed is %d fps. '
                        'Please re-encode at %d fps or lower.' % (fps, VIDEO_MAX_FPS, VIDEO_MAX_FPS)
                    )
            except (ValueError, ZeroDivisionError):
                pass

        if errors:
            raise ValidationError(errors)

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
