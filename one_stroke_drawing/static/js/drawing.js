document.addEventListener('DOMContentLoaded', function() {
    const drawingCanvas = document.getElementById('drawing-canvas');
    const ctx = drawingCanvas.getContext('2d');
    const backgroundCanvas = document.getElementById('background-canvas');
    const bgCtx = backgroundCanvas.getContext('2d');

    // 캔버스 크기 설정
    function setCanvasSize() {
        const container = document.getElementById('drawing-container');
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        drawingCanvas.width = width;
        drawingCanvas.height = height;
        backgroundCanvas.width = width;
        backgroundCanvas.height = height;
    }

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // 예시 이미지 로드 및 표시
    function loadTemplateImage() {
        const img = new Image();
        img.src = '{{ template.image.url }}';
        img.onload = function() {
            // 이미지를 캔버스 크기에 맞게 조정하여 그리기
            const scale = Math.min(
                backgroundCanvas.width / img.width,
                backgroundCanvas.height / img.height
            );
            const x = (backgroundCanvas.width - img.width * scale) / 2;
            const y = (backgroundCanvas.height - img.height * scale) / 2;

            bgCtx.globalAlpha = 0.3;  // 투명도 설정
            bgCtx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // 캔버스 테두리 표시
            bgCtx.globalAlpha = 1;
            bgCtx.strokeStyle = '#ddd';
            bgCtx.lineWidth = 2;
            bgCtx.strokeRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
        }
    }

    let isDrawing = false;
    let hasLifted = false;

    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);

    function startDrawing(e) {
        isDrawing = true;
        const rect = drawingCanvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);

        // 그리기 스타일 설정
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function draw(e) {
        if (!isDrawing) return;

        const rect = drawingCanvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    }

    function stopDrawing() {
        if (isDrawing && !hasLifted) {
            isDrawing = false;
            hasLifted = true;
            showPopup();
        }
        isDrawing = false;
    }

    function showPopup() {
        // 팝업 표시 로직
        const drawingData = drawingCanvas.toDataURL();

        fetch('/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: `drawing_data=${encodeURIComponent(drawingData)}`
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('similarity').textContent = data.similarity;
            document.getElementById('popup').style.display = 'block';
        });
    }

    // 다시하기 버튼
    document.getElementById('clear-btn').addEventListener('click', function() {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        hasLifted = false;
    });

    // CSRF 토큰 가져오기
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    loadTemplateImage();
});