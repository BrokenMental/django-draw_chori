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
        if not template:
            print("No active template found")
            return 0

        # Canvas 데이터를 이미지로 변환
        try:
            format, imgstr = drawing_data.split(';base64,')
            drawing_data = base64.b64decode(imgstr)
            drawing_image = Image.open(io.BytesIO(drawing_data))
            print(f"Drawing image mode: {drawing_image.mode}")
        except Exception as e:
            print(f"Error processing drawing data: {str(e)}")
            return 0

        # 템플릿 이미지 로드
        try:
            template_image = Image.open(template.image.path)
            print(f"Template image mode: {template_image.mode}")
        except Exception as e:
            print(f"Error loading template image: {str(e)}")
            return 0

        # 이미지 크기 통일
        target_size = (600, 400)
        drawing_image = drawing_image.resize(target_size)
        template_image = template_image.resize(target_size)

        # numpy 배열로 변환 및 BGR 형식으로 변경
        drawing_array = np.array(drawing_image)
        template_array = np.array(template_image)

        # drawing_array를 그레이스케일로 변환
        if len(drawing_array.shape) == 3:  # RGB 또는 RGBA
            drawing_gray = cv2.cvtColor(drawing_array, cv2.COLOR_RGB2GRAY)
        else:  # 이미 그레이스케일
            drawing_gray = drawing_array

        # template_array 처리
        if len(template_array.shape) == 3:  # RGB 또는 RGBA
            if template_array.shape[2] == 4:  # RGBA
                template_array = cv2.cvtColor(template_array, cv2.COLOR_RGBA2BGR)
            template_blue = template_array[:, :, 0]  # BGR에서 Blue 채널
        else:  # 이미 그레이스케일
            template_blue = template_array

        # 이진화
        _, drawing_binary = cv2.threshold(drawing_gray, 127, 255, cv2.THRESH_BINARY_INV)
        _, template_binary = cv2.threshold(template_blue, 127, 255, cv2.THRESH_BINARY)

        # 노이즈 제거 및 선 굵기 일치
        kernel = np.ones((5, 5), np.uint8)
        drawing_processed = cv2.dilate(drawing_binary, kernel, iterations=1)
        template_processed = cv2.dilate(template_binary, kernel, iterations=1)

        # 디버깅을 위한 이미지 저장
        cv2.imwrite('debug_drawing.png', drawing_processed)
        cv2.imwrite('debug_template.png', template_processed)

        # IoU (Intersection over Union) 계산
        intersection = np.logical_and(drawing_processed, template_processed)
        union = np.logical_or(drawing_processed, template_processed)
        iou_score = np.sum(intersection) / np.sum(union) if np.sum(union) > 0 else 0

        # 템플릿 매칭
        result = cv2.matchTemplate(drawing_processed, template_processed, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, _ = cv2.minMaxLoc(result)

        # 최종 유사도 계산 (0-100 범위)
        final_similarity = ((iou_score * 0.6) + (max_val * 0.4)) * 100

        print(f"IoU score: {iou_score}")
        print(f"Template matching score: {max_val}")
        print(f"Final similarity: {final_similarity}")

        return min(max(final_similarity, 0), 100)

    except Exception as e:
        print(f"Error calculating similarity: {str(e)}")
        import traceback
        traceback.print_exc()
        return 0