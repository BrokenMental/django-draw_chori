from django.urls import path
from . import views

urlpatterns = [
    path('draw/', views.draw_view, name='draw'),
    path('upload/', views.upload_image_view, name='upload_image'),
    path('password/', views.password_view, name='password_page'),
    path('select-image/', views.select_image_view, name='select_image'),
]