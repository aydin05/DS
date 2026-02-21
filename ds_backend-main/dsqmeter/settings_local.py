from dsqmeter.settings import *

# Skip migrations for project apps - remote DB already has all tables
MIGRATION_MODULES = {
    'account': None,
    'branch': None,
    'core': None,
    'display': None,
    'playlist': None,
}
