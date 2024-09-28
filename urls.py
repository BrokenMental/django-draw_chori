from django.urls import path
from . import views

urlpatterns = [
    path('submit-drawing/', views.submit_drawing, name='submit_drawing'),
]