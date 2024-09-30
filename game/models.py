from django.db import models

# Create your models here.
from django.db import models

class ReferenceImage(models.Model):
    title = models.CharField(max_length=100)  # 이미지 제목 필드
    image = models.ImageField(upload_to='reference_images/')  # 이미지를 업로드할 경로 설정

    def __str__(self):
        return self.title