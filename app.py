import os
import requests
from gtts import gTTS
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify

from image import *
from processing import *
from recognition import recognition

app = Flask(__name__)
model = recognition()

load_dotenv()
DEEPL_KEY = os.getenv("DEEPL_KEY")
DEEPL_API = "https://api-free.deepl.com"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/ko")
def indexKorean():
    return render_template("index-korean.html")


@app.route("/webcam")
def render_webcam():
    return render_template("webcam.html")


@app.route("/saved")
def render_saved():
    return render_template("saved.html")


# API Routes
@app.route("/api/webcam", methods=["POST"])
def webcamAPI():
    language = request.args.get("lang")
    img = imageToCV2(base64ToImage(request.data))
    try:
        result = model.process_frame(img, language)
        if result is not None:
            # saveImage(result["frame"], "test.jpg")
            if result["label"] is not None:
                return jsonify(
                    {"success": True, "label": result["label"], "pos": result["pos"]}
                )
            elif result["pos"] is not None:
                return jsonify({"success": True, "label": None, "pos": result["pos"]})
    except Exception as e:
        pass

    return jsonify({"success": False})


@app.route("/api/translate")
def translateAPI():
    text = request.args.get("text")
    language = request.args.get("lang")

    req = requests.post(
        f"{DEEPL_API}/v2/translate",
        headers={"Authorization": f"DeepL-Auth-Key {DEEPL_KEY}"},
        data={
            "text": text,
            "target_lang": language,
        },
    )

    print(req.json())

    if req.status_code == 200:
        translated = req.json()["translations"][0]["text"]
        return jsonify({"success": True, "translation": translated})

    return jsonify({"success": False})


@app.route("/api/tts")
def ttsAPI():
    text = request.args.get("text")
    lang = request.args.get("lang")

    tts = gTTS(text=text, lang=lang.lower())
    tts.save("tts.mp3")

    os.system("mpg123 tts.mp3")

    return "OK"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
