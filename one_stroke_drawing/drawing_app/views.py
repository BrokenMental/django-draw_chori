from django.shortcuts import render
from django.http import JsonResponse
from .models import DrawingTemplate
import base64
from PIL import Image
import io
import numpy as np
import cv2


def draw_view(request):
    active_template = DrawingTemplate.objects.filter(is_active=True).first()
    context = {'template': active_template}
    return render(request, 'drawing_app/draw.html', context)


def save_drawing(request):
    if request.method == 'POST':
        drawing_data = request.POST.get('drawing_data')
        similarity = calculate_similarity(drawing_data)
        return JsonResponse({'similarity': f'{similarity:.1f}'})
    return JsonResponse({'error': 'Invalid request'}, status=400)


def calculate_similarity(drawing_data):
    try:
        # 활성화된 템플릿 이미지 가져오기
        template = DrawingTemplate.objects.filter(is_active=True).first()
        print(template.image.path)
        if not template:
            print("No active template found")
            return 0

        # Canvas 데이터를 이미지로 변환
        try:
            format, imgstr = drawing_data.split(';base64,')
            drawing_image = Image.open(io.BytesIO(base64.b64decode(imgstr)))
            print(f"Drawing image size: {drawing_image.size}")
        except Exception as e:
            print(f"Error processing drawing data: {str(e)}")
            return 0

        # 템플릿 이미지 로드
        try:
            template_path = template.image.path
            template_image = Image.open(template_path)
            print(f"Template image size: {template_image.size}")
        except Exception as e:
            print(f"Error loading template image: {str(e)}")
            return 0

        # 이미지 전처리
        drawing_gray = drawing_image.convert('L')
        template_gray = template_image.convert('L').resize(drawing_gray.size)

        # numpy 배열로 변환
        drawing_array = np.array(drawing_gray)
        template_array = np.array(template_gray)

        print(f"Drawing array shape: {drawing_array.shape}")
        print(f"Template array shape: {template_array.shape}")

        # 이미지 이진화
        _, drawing_binary = cv2.threshold(drawing_array, cv2.RETR_LIST, 255, cv2.THRESH_BINARY)
        _, template_binary = cv2.threshold(template_array, cv2.RETR_LIST, 255, cv2.THRESH_BINARY)

        # 윤곽선 추출
        drawing_contours, _ = cv2.findContours(drawing_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        template_contours, _ = cv2.findContours(template_binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        print(f"Number of drawing contours: {len(drawing_contours)}")
        print(f"Number of template contours: {len(template_contours)}")

        if not drawing_contours or not template_contours:
            print("No contours found in one or both images")
            return 0

        # 윤곽선 매칭
        similarity = cv2.matchShapes(drawing_contours[0], template_contours[0], cv2.CONTOURS_MATCH_I1, 0.0)
        print(f"Contour similarity: {similarity}")

        # 픽셀 유사도 계산
        pixel_similarity = np.mean(drawing_binary == template_binary)
        print(f"Pixel similarity: {pixel_similarity}")

        # 최종 유사도 계산 (0-100 범위)
        final_similarity = pixel_similarity * 100 # (pixel_similarity * 0.7 + (1 - similarity) * 0.3) * 100
        print(f"Final similarity: {final_similarity}")

        return min(max(final_similarity, 0), 100)  # 0-100 범위로 제한

    except Exception as e:
        print(f"Error calculating similarity: {str(e)}")
        import traceback
        traceback.print_exc()
        return 0