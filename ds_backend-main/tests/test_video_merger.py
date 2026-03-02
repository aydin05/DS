"""
Tests for the video merger service and merge integration.
"""
from unittest.mock import patch, MagicMock
from django.test import TestCase

from playlist.services.video_merger import (
    _playlist_content_hash,
    _strip_html_tags,
    merge_playlist_slides,
    MAX_SLIDES,
)


class PlaylistContentHashTests(TestCase):
    """Tests for the _playlist_content_hash function."""

    def test_same_input_same_hash(self):
        slides = [{"name": "S1", "duration": 5}]
        h1 = _playlist_content_hash(1, slides, 1920, 1080)
        h2 = _playlist_content_hash(1, slides, 1920, 1080)
        self.assertEqual(h1, h2)

    def test_different_playlist_id_different_hash(self):
        slides = [{"name": "S1", "duration": 5}]
        h1 = _playlist_content_hash(1, slides, 1920, 1080)
        h2 = _playlist_content_hash(2, slides, 1920, 1080)
        self.assertNotEqual(h1, h2)

    def test_different_resolution_different_hash(self):
        slides = [{"name": "S1", "duration": 5}]
        h1 = _playlist_content_hash(1, slides, 1920, 1080)
        h2 = _playlist_content_hash(1, slides, 1280, 720)
        self.assertNotEqual(h1, h2)

    def test_different_slides_different_hash(self):
        h1 = _playlist_content_hash(1, [{"name": "S1"}], 1920, 1080)
        h2 = _playlist_content_hash(1, [{"name": "S2"}], 1920, 1080)
        self.assertNotEqual(h1, h2)

    def test_hash_length(self):
        h = _playlist_content_hash(1, [], 1920, 1080)
        self.assertEqual(len(h), 16)


class StripHtmlTagsTests(TestCase):
    """Tests for the _strip_html_tags function."""

    def test_strips_tags(self):
        self.assertEqual(_strip_html_tags("<b>Hello</b>"), "Hello")

    def test_strips_nested_tags(self):
        self.assertEqual(_strip_html_tags("<div><p>Text</p></div>"), "Text")

    def test_handles_entities(self):
        self.assertEqual(_strip_html_tags("&amp; &lt; &gt;"), "& < >")

    def test_handles_nbsp(self):
        self.assertEqual(_strip_html_tags("Hello&nbsp;World"), "Hello World")

    def test_handles_none(self):
        self.assertEqual(_strip_html_tags(None), "")

    def test_handles_empty(self):
        self.assertEqual(_strip_html_tags(""), "")

    def test_strips_and_trims(self):
        self.assertEqual(_strip_html_tags("  <p> text </p>  "), "text")


class MergePlaylistSlidesTests(TestCase):
    """Tests for the merge_playlist_slides entry point."""

    def _make_playlist_mock(self, pk=1):
        playlist = MagicMock()
        playlist.id = pk
        playlist.pk = pk
        return playlist

    def test_empty_slides_returns_none(self):
        result = merge_playlist_slides(self._make_playlist_mock(), [], 1920, 1080)
        self.assertIsNone(result)

    def test_slides_over_max_are_truncated(self):
        """Slides exceeding MAX_SLIDES should be truncated, not cause an error."""
        slides = [{"name": f"S{i}", "duration": 1, "items": []} for i in range(MAX_SLIDES + 10)]
        playlist = self._make_playlist_mock()
        with patch('playlist.services.video_merger.check_ffmpeg_available', return_value=False):
            result = merge_playlist_slides(playlist, slides, 1920, 1080)
        # FFmpeg not available, so returns error, but should NOT fail due to slide count
        self.assertIsNotNone(result)
        self.assertIn("error", result)
        self.assertIn("FFmpeg", result["error"])

    @patch('playlist.services.video_merger.check_ffmpeg_available', return_value=False)
    def test_no_ffmpeg_returns_error(self, _mock):
        slides = [{"name": "S1", "duration": 5, "items": []}]
        result = merge_playlist_slides(self._make_playlist_mock(), slides, 1920, 1080)
        self.assertIsNotNone(result)
        self.assertEqual(result["path"], None)
        self.assertIn("FFmpeg", result["error"])

    @patch('playlist.services.video_merger.check_ffmpeg_available', return_value=True)
    @patch('playlist.services.video_merger._build_slide_segment', return_value=None)
    def test_all_segments_fail_returns_error(self, _seg_mock, _ff_mock):
        slides = [{"name": "S1", "duration": 5, "items": []}]
        result = merge_playlist_slides(self._make_playlist_mock(), slides, 1920, 1080)
        self.assertIsNotNone(result)
        self.assertEqual(result["path"], None)
        self.assertIn("All slide segments failed", result["error"])


class ConcatCommandTests(TestCase):
    """Verify that the concat step uses stream copy instead of re-encoding."""

    @patch('playlist.services.video_merger.check_ffmpeg_available', return_value=True)
    @patch('playlist.services.video_merger.shutil')
    @patch('playlist.services.video_merger.subprocess')
    def test_concat_uses_copy_codec(self, mock_subprocess, mock_shutil, _ff_mock):
        """The concat command must use -c copy, not re-encode."""
        from playlist.services.video_merger import merge_playlist_slides
        import tempfile
        import os

        # Mock _build_slide_segment to return fake segment paths
        with patch('playlist.services.video_merger._build_slide_segment') as seg_mock:
            seg_mock.side_effect = lambda s, w, h, tmp, i: os.path.join(tmp, f"seg_{i}.mp4")

            # Mock subprocess.run for concat step
            mock_result = MagicMock()
            mock_result.returncode = 0
            mock_subprocess.run.return_value = mock_result

            # Need segments to exist for the concat path
            with patch('os.path.isfile', return_value=True):
                slides = [
                    {"name": "S1", "duration": 5, "items": []},
                    {"name": "S2", "duration": 5, "items": []},
                ]
                playlist = MagicMock()
                playlist.id = 1
                result = merge_playlist_slides(playlist, slides, 1920, 1080, force=True)

            # Find the concat call (the one with "-f", "concat")
            concat_call = None
            for call in mock_subprocess.run.call_args_list:
                cmd = call[0][0] if call[0] else call[1].get('cmd', [])
                if isinstance(cmd, list) and "-f" in cmd and "concat" in cmd:
                    concat_call = cmd
                    break

            if concat_call:
                self.assertIn("-c", concat_call)
                self.assertIn("copy", concat_call)
                self.assertNotIn("libx264", concat_call)
