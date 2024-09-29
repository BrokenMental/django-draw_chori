from django.urls import path
from . import views

urlpatterns = [
    path('draw/', views.draw_view, name='draw'),
]