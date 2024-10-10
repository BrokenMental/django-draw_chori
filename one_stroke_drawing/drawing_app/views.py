from django.shortcuts import render
from django.http import JsonResponse
from .models import DrawingTemplate

def draw_view(request):
    active_template = DrawingTemplate.objects.filter(is_active=True).first()
    return render(request, 'drawing_app/draw.html', {'template': active_template})

def save_drawing(request):
    if request.method == 'POST':
        # 여기에 그림 저장 및 유사도 계산 로직 구현
        similarity = calculate_similarity(request.POST.get('drawing_data'))
        return JsonResponse({'similarity': similarity})

def calculate_similarity(drawing_data):
    # 이미지 유사도 계산 로직 구현
    # 실제 구현에는 컴퓨터 비전 라이브러리 사용 필요
    return 85  # 예시 값