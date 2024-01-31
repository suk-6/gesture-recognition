let videoElement = null;
let sendInterval = null;
let size = { width: 580, height: 700 };

window.onload = () => {
    startCamera();
    settingCanvas();
};

window.onbeforeunload = () => {
    stopCamera();
}

const settingCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
}

const startCamera = () => {
    let constraints = { audio: false, video: { width: size.width, height: size.height } };

    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            videoElement = document.querySelector('video');
            videoElement.srcObject = stream;
            videoElement.onloadedmetadata = (e) => {
                videoElement.play();
            };

            sendInterval = setInterval(sendFrame, 1000);
        })
        .catch((err) => { console.log(err.name + ": " + err.message); });
}

const stopCamera = () => {
    let stream = videoElement.srcObject;
    let tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    videoElement.srcObject = null;

    clearInterval(sendInterval);
    sendInterval = null;
};

const sendFrame = () => {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, size.width, size.height);

    let base64Canvas = canvas.toDataURL("image/jpeg").split(';base64,')[1];
    fetch('/api/webcam', {
        method: 'POST',
        body: base64Canvas
    }).then((response) => {
        return response.json();
    }).then((data) => {
        if (data.success) {
            let textbox = document.getElementById('textbox');
            textbox.textContent = textbox.textContent + ' ' + data.label;
        }
    }).catch((err) => {
        console.log("err: ", err)
    });
}
