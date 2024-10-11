from django.urls import path
from . import views

urlpatterns = [
    path('', views.draw_view, name='draw'),
    path('save_drawing/', views.save_drawing, name='save_drawing'),
]