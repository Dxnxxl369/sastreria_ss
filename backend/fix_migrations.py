import django
from django.db.migrations.autodetector import MigrationAutodetector
from django.db.migrations.loader import MigrationLoader
from django.db.migrations.questioner import MigrationQuestioner
from django.core.management import call_command
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sastreria_project.settings')
django.setup()

class AlwaysYesQuestioner(MigrationQuestioner):
    def ask_rename(self, model_name, old_name, new_name, field):
        return True
    def ask_rename_model(self, old_name, new_name):
        return True
    def _boolean_input(self, question, default=None):
        return True

loader = MigrationLoader(None, ignore_no_migrations=True)
autodetector = MigrationAutodetector(
    loader.project_state(),
    MigrationAutodetector(loader.project_state(), None).parse_apps(None),
    AlwaysYesQuestioner(),
)

call_command('makemigrations', interactive=False)
call_command('migrate', interactive=False)
