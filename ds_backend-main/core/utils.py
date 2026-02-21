widget_types = [
    {"name": "video", "label": "Video",
     "attr": {"is_loop": "boolean", "is_mute": "boolean", "location": "path","duration":"string"}},
    {"name": "image", "label": "Image", "attr": {"location": "path"}},
    {"name": "text", "label": "Text",
     "attr": {"fonts": "fonts", "is_scrolling": "boolean", "speed": "integer", "frame_bg_color": "color","location": "path",
     "textarea": "textarea","direction":"string","color":"color","font_size":"integer"}},
    {"name": "globaltext", "label": "Global text",
     "attr": {"textarea": "textarea", "is_scrolling": 'boolean', "speed": "integer", "frame_bg_color": "color",
              "fonts": "string","location":"path","direction":"string","color":"color","font_size":"integer"}},
    {"name": "site", "label": "Web Site", "attr": {"url": "string", "authorization": "string","location": "path"}},
    {"name": "table", "label": "Table", "attr": {"font_size": "integer", "color": "string", "backgroundColor": "string","fontStyle": "string","textAlign": "string", "fontFamily": "string"}}
]
