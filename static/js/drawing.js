document.addEventListener('DOMContentLoaded', function() {
    const drawingCanvas = document.getElementById('drawing-canvas');
    const ctx = drawingCanvas.getContext('2d');
    const backgroundCanvas = document.getElementById('background-canvas');
    const bgCtx = backgroundCanvas.getContext('2d');

    let isDrawing = false;
    let hasLifted = false;
    let lastX = 0;
    let lastY = 0;

    function setCanvasSize() {
        const container = document.getElementById('drawing-container');
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        drawingCanvas.width = width;
        drawingCanvas.height = height;
        backgroundCanvas.width = width;
        backgroundCanvas.height = height;

        // 캔버스 초기화 시 흰색 배경 설정
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // 기본 그리기 설정
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        isDrawing = true;
        const pos = getMousePos(drawingCanvas, e);
        lastX = pos.x;
        lastY = pos.y;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    }

    function draw(e) {
        if (!isDrawing) return;

        const pos = getMousePos(drawingCanvas, e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        lastX = pos.x;
        lastY = pos.y;
    }

    function stopDrawing() {
        if (isDrawing && !hasLifted) {
            isDrawing = false;
            hasLifted = true;
            compareDrawing();
        }
        isDrawing = false;
    }

    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);

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
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
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

    // 예시 이미지 로드 및 표시 함수 수정
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

                // 배경을 흰색으로 설정
                bgCtx.fillStyle = 'white';
                bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

                // 이미지를 더 흐리게 표시
                bgCtx.globalAlpha = 0.2;  // 0.3에서 0.2로 변경
                bgCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
            }
        }
    }

    loadTemplateImage();
});