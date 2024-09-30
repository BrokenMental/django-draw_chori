from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
from .forms import ImageUploadForm
from .models import ReferenceImage
from .utils import compare_images  # 이미지 비교 함수가 있는 모듈

# 비밀번호 보호 설정
PASSWORD = "1234"

def password_view(request):
    if request.method == 'POST':
        input_password = request.POST.get('password')
        if input_password == PASSWORD:
            request.session['password_verified'] = True
            return redirect('upload_image')
        else:
            return HttpResponse('비밀번호가 틀렸습니다.', status=401)
    return render(request, 'game/password.html')

def select_image_view(request):
    images = ReferenceImage.objects.all()  # 업로드된 모든 이미지 가져오기
    if request.method == 'POST':
        selected_image_id = request.POST.get('selected_image')  # 선택된 이미지 ID
        selected_image = ReferenceImage.objects.get(id=selected_image_id)
        user_image = request.FILES.get('user_image')  # 사용자가 업로드한 그림 파일

        # 이미지 비교 함수 호출
        similarity = compare_images(selected_image.image.path, user_image)

        return render(request, 'game/compare_result.html', {'similarity': similarity})

    return render(request, 'game/select_image.html', {'images': images})

def compare_view(request, image_id):
    uploaded_image = get_object_or_404(ReferenceImage, id=image_id)
    reference_image = ReferenceImage.objects.get(title='reference')  # 레퍼런스 이미지 가져오기

    # 이미지 비교
    diff_count = compare_images(uploaded_image.image.path, reference_image.image.path)

    return render(request, 'game/compare_result.html', {'diff_count': diff_count})

def upload_image_view(request):
    if not request.session.get('password_verified'):
        return redirect('password_page')

    if request.method == 'POST':
        form = ImageUploadForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()  # 폼이 유효하면 이미지를 저장
            return redirect('select_image')  # 성공 시 select_image 페이지로 리디렉션
    else:
        form = ImageUploadForm()

    return render(request, 'game/upload_image.html', {'form': form})

def draw_view(request):
    return render(request, 'game/draw.html')