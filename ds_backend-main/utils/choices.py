from sre_constants import REPEAT
from django.utils.translation import gettext_lazy as _

TIMEZONE_LIST = (
    ("Pacific/Kwajalein", "(GMT -12:00) Eniwetok, Kwajalein"),
    ("Pacific/Samoa", "(GMT -11:00) Midway Island, Samoa"),
    ("Pacific/Honolulu", "(GMT -10:00) Hawaii"),
    ("America/Anchorage", "(GMT -9:00) Alaska"),
    ("America/Los_Angeles", "(GMT -8:00) Pacific Time (US, Canada)"),
    ("America/Denver", "(GMT -7:00) Mountain Time (US, Canada)"),
    ("America/Chicago", "(GMT -6:00) Central Time (US, Canada), Mexico City"),
    ("America/New_York", "(GMT -5:00) Eastern Time (US, Canada), Bogota, Lima"),
    ("America/Glace_Bay", "(GMT -4:00) Atlantic Time (Canada), Caracas, La Paz"),
    ("America/St_Johns", "(GMT -3:30) Newfoundland"),
    ("America/Buenos_Aires", "(GMT -3:00) Brazil, Buenos Aires, Georgetown"),
    ("America/Noronha", "(GMT -2:00) Mid-Atlantic"),
    ("Atlantic/Azores", "(GMT -1:00 hour) Azores, Cape Verde Islands"),
    ("Europe/London", "(GMT) Western Europe Time, Dublin, London, Lisbon, Casablanca"),
    ("Europe/Madrid", "(GMT +1:00 hour) Brussels, Copenhagen, Madrid, Paris"),
    ("Europe/Minsk", "(GMT +2:00) Kaliningrad, South Africa"),
    ("Europe/Moscow", "(GMT +3:00) İstanbul, Ankara, Riyadh, Moscow"),
    ("Asia/Tehran", "(GMT +3:30) Tehran"),
    ("Asia/Dubai", "(GMT +4:00) Abu Dhabi, Dubai, Baku, Tbilisi"),
    ("Asia/Kabul", "(GMT +4:30) Kabul"),
    ("Asia/Tashkent", "(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent"),
    ("Asia/Kolkata", "(GMT +5:30) Bombay, Chennai, Mumbai, New Delhi"),
    ("Asia/Katmandu", "(GMT +5:45) Kathmandu"),
    ("Asia/Almaty", "(GMT +6:00) Astana, Almaty, Dhaka, Colombo"),
    ("Asia/Bangkok", "(GMT +7:00) Bangkok, Hanoi, Jakarta"),
    ("Asia/Singapore", "(GMT +8:00) Beijing, Perth, Singapore, Hong Kong"),
    ("Asia/Tokyo", "(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk"),
    ("Australia/Darwin", "(GMT +9:30) Adelaide, Darwin"),
    ("Australia/Melbourne", "(GMT +10:00) Eastern Australia, Guam, Vladivostok"),
    ("Pacific/Ponape", "(GMT +11:00) Magadan, Solomon Islands, New Caledonia"),
    ("Pacific/Auckland", "(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka")
)


WEEK_LIST = (
    (1, _("Monday")),
    (2, _("Tuesday")),
    (3, _("Wednesday")),
    (4, _("Thursday")),
    (5, _("Friday")),
    (6, _("Saturday")),
    (7, _("Sunday"))
    )

REPEAT_LIST = (
    ('Daily' , _('Daily')),
    ('Weekly' , _('Weekly')),
    ('Monthly' , _('Monthly')),
    ('Yearly' , _('Yearly')),
)