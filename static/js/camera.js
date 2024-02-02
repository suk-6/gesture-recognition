let videoElement = null;
let sendInterval = null;
let viewInterval = null;
let size = { width: 580, height: 700 };
let language = window.location.search.split('=')[1];
let pos = null;

window.onload = () => {
    settingCanvas();
    startCamera();
    showASL();
    document.getElementById('languageSetting').addEventListener('change', translate);
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
            viewInterval = setInterval(viewCamera, 10);
        })
    // .catch((err) => { console.log(err.name + ": " + err.message); });
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
        if (data.success && data.label !== null) appendResult(data.label);

    }).catch((err) => {
        console.log("err: ", err)
    });
}

const appendResult = (label) => {
    let textbox = document.getElementById('original');
    if (textbox.textContent.split(' ').slice(-1)[0] === label) return;

    textbox.textContent = textbox.textContent + ' ' + label;

    translate();
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

const translate = () => {
    let text = document.getElementById('original').textContent;
    if (text === '') return;

    let selected = document.getElementById('languageSetting');
    let language = selected.options[selected.selectedIndex].value;
    if (language === 'EN') {
        let textbox = document.getElementById('translated');
        textbox.textContent = text;
        return;
    };

    fetch(`/api/translate?text=${text}&lang=${language}`, {
        method: 'GET'
    }).then((response) => {
        return response.json();
    }).then((data) => {
        let textbox = document.getElementById('translated');
        textbox.textContent = data.translation;
    }).catch((err) => {
        console.log("err: ", err)
    });
}

const showASL = () => {
    aslList = ["hello", "nice", "teacher", "eat", "no", "happy", "like",
        "orange", "want", "deaf", "school", "sister", "finish", "white",
        "bird", "what", "tired", "friend", "sit", "mother", "yes",
        "student", "learn", "spring", "good", "fish", "again", "sad",
        "table", "need", "where", "father", "milk", "cousin", "brother",
        "paper", "forget", "nothing", "book", "girl", "fine", "black",
        "boy", "lost", "family", "hearing", "bored", "please", "water",
        "computer", "help", "doctor", "yellow", "write", "hungry",
        "but", "drink", "bathroom", "man", "how", "understand", "red",
        "beautiful", "sick", "blue", "green", "english", "name", "you",
        "who", "same", "nurse", "day", "now", "brown", "thanks", "hurt",
        "here", "grandmother", "pencil", "walk", "bad", "read", "when",
        "dance", "play", "sign", "go", "big", "sorry", "work", "draw",
        "grandfather", "woman", "right", "france", "pink", "know",
        "live", "night"];

    let aslTableBody = document.getElementById('aslTableBody');
    aslList.forEach((word) => {
        let tr = document.createElement('tr');
        let td = document.createElement('td');

        tr.className = 'bg-white border-b dark:bg-gray-800 dark:border-gray-700';
        td.className = 'px-6 py-4 text-xl';

        tr.onclick = () => appendResult(word);

        td.textContent = word;
        tr.appendChild(td);
        aslTableBody.appendChild(tr);
    });
}

const tts = () => {
    let text = document.getElementById('translated').textContent;
    if (text === '') return;

    let selected = document.getElementById('languageSetting');
    let language = selected.options[selected.selectedIndex].value;

    fetch(`/api/tts?text=${text}&lang=${language}`, {
        method: 'GET'
    })
};