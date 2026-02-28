def get_playlist_id_for_display(display):
    """Resolve the playlist ID for a display by checking the assignment chain.

    Returns the playlist ID (int) or None if no playlist is assigned.
    Safely handles None at every level to prevent AttributeError.
    """
    if display.playlist_id:
        return display.playlist_id

    dg = display.display_group
    if dg:
        if dg.playlist_id:
            return dg.playlist_id
        if dg.schedule and dg.schedule.default_playlist_id:
            return dg.schedule.default_playlist_id

    if display.schedule and display.schedule.default_playlist_id:
        return display.schedule.default_playlist_id

    return None
