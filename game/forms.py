from django import forms
from .models import ReferenceImage

class ImageUploadForm(forms.ModelForm):
    class Meta:
        model = ReferenceImage
        fields = ['title', 'image']