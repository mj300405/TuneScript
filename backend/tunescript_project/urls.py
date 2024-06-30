from django.contrib import admin
from django.urls import path
from graphene_file_upload.django import FileUploadGraphQLView
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.csrf import csrf_exempt
from tunescript_app.schema import schema
from tunescript_app.views import WebhookView, sse_stream

urlpatterns = [
    path('admin/', admin.site.urls),
    path('graphql/', csrf_exempt(FileUploadGraphQLView.as_view(graphiql=True, schema=schema))),
    path('webhook/', WebhookView.as_view(), name='webhook'),
    path('sse-stream/<int:transcription_id>/', sse_stream, name='sse_stream'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)