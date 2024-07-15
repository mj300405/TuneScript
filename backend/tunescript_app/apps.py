from django.apps import AppConfig


class TunescriptAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tunescript_app'

    def ready(self):
        import tunescript_app.signals