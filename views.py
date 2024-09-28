import base64
from django.http import JsonResponse
from PIL import Image
from io import BytesIO
import numpy as np


def submit_drawing(request):
    if request.method == 'POST':
        data = request.json()
        image_data = data['image_data'].split(',')[1]
        image = Image.open(BytesIO(base64.b64decode(image_data)))

        # 이미지 저장 (원하는 경로에 저장)
        image.save('user_drawing.png')

        # 레퍼런스 이미지와 비교 (간단한 예시)
        reference_image = Image.open('reference_image.png')
        similarity = compare_images(image, reference_image)

        return JsonResponse({'similarity': similarity})


def compare_images(image1, image2):
    # 두 이미지를 배열로 변환
    img1 = np.array(image1.resize((500, 500)))
    img2 = np.array(image2.resize((500, 500)))

    # 두 이미지의 차이 계산
    diff = np.mean(np.abs(img1 - img2))
    similarity = 100 - diff / 255 * 100
    return similarity