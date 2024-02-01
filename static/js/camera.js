let videoElement = null;
let sendInterval = null;
let viewInterval = null;
let size = { width: 580, height: 700 };
let language = window.location.search.split('=')[1];
let pos = null;

window.onload = () => {
    settingCanvas();
    startCamera();
};

window.onbeforeunload = () => {
    stopCamera();
}

const settingCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.style.display = 'none';
    canvas.id = 'send';
    document.body.appendChild(canvas);

    const output = document.createElement('canvas');
    const viewElement = document.getElementById('viewElement');
    output.width = size.width;
    output.height = size.height;
    output.id = 'output';
    viewElement.appendChild(output);
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

            sendInterval = setInterval(sendFrame, 100);
            viewInterval = setInterval(viewCamera, 1);
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
    const canvas = document.querySelector('#send');
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, size.width, size.height);

    let base64Canvas = canvas.toDataURL("image/jpeg").split(';base64,')[1];
    fetch(`/api/webcam?lang=${language}`, {
        method: 'POST',
        body: base64Canvas
    }).then((response) => {
        return response.json();
    }).then((data) => {
        if (data.pos !== undefined) pos = data.pos;
        if (data.success) appendResult(data.label);

    }).catch((err) => {
        console.log("err: ", err)
    });
}

const appendResult = (label) => {
    let textbox = document.getElementById('textbox');
    textbox.textContent = textbox.textContent + ' ' + label;
}

const drawBoundingBox = () => {
    const output = document.querySelector('#output');
    const context = output.getContext('2d');

    context.beginPath();
    context.lineWidth = "4";
    context.strokeStyle = "red";
    context.rect(pos[0], pos[1], pos[2], pos[3]);
    context.stroke();
}

const viewCamera = () => {
    const output = document.querySelector('#output');
    const context = output.getContext('2d');

    context.drawImage(videoElement, 0, 0, size.width, size.height);
    if (pos !== null) { drawBoundingBox() };
}
