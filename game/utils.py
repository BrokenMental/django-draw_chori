from PIL import Image, ImageChops

def compare_images(image1_path, image2_path):
    image1 = Image.open(image1_path)
    image2 = Image.open(image2_path)

    # 이미지 크기 동일하게 맞추기
    if image1.size != image2.size:
        image2 = image2.resize(image1.size)

    # 이미지 차이 계산
    diff = ImageChops.difference(image1, image2)

    # 차이가 있는 픽셀 계산
    diff_count = sum(diff.getdata())

    return diff_count