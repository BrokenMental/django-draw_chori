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
        if (window.templateImageUrl) {
            const img = new Image();
            img.src = window.templateImageUrl;
            img.onload = function() {
                const scale = Math.min(
                    backgroundCanvas.width / img.width,
                    backgroundCanvas.height / img.height
                );
                const x = (backgroundCanvas.width - img.width * scale) / 2;
                const y = (backgroundCanvas.height - img.height * scale) / 2;

                bgCtx.globalAlpha = 0.3;
                bgCtx.drawImage(img, x, y, img.width * scale, img.height * scale);

                bgCtx.globalAlpha = 1;
                bgCtx.strokeStyle = '#ddd';
                bgCtx.lineWidth = 2;
                bgCtx.strokeRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
            }
            img.onerror = function() {
                console.error('이미지 로드 실패:', window.templateImageUrl);
            }
        }
    }

    let isDrawing = false;
    let hasLifted = false;
    let startX, startY;

    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);

    function startDrawing(e) {
        isDrawing = true;
        const rect = drawingCanvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function draw(e) {
        if (!isDrawing) return;

        const rect = drawingCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    }

    function stopDrawing() {
        if (isDrawing && !hasLifted) {
            isDrawing = false;
            hasLifted = true;
            compareDrawing();
        }
        isDrawing = false;
    }

    function compareDrawing() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = '분석 중...';
        document.body.appendChild(loadingDiv);

        const drawingData = drawingCanvas.toDataURL();
        console.log("Drawing data length:", drawingData.length);  // 디버깅용

        fetch('/save_drawing/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: `drawing_data=${encodeURIComponent(drawingData)}`
        })
        .then(response => {
            console.log("Response status:", response.status);  // 디버깅용
            return response.json();
        })
        .then(data => {
            console.log("Similarity data:", data);  // 디버깅용
            document.getElementById('similarity').textContent = data.similarity;
            document.getElementById('popup').style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        })
        .finally(() => {
            document.body.removeChild(loadingDiv);
        });
    }

    document.getElementById('clear-btn').addEventListener('click', function() {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        hasLifted = false;
        document.getElementById('popup').style.display = 'none';
    });

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