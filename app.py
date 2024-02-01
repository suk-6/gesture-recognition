from flask import Flask, render_template, request, redirect, url_for, jsonify
from image import *
from processing import *
from recognition import recognition

app = Flask(__name__)
model = recognition()


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
            elif result["pos"] is None:
                return jsonify({"success": True, "label": None, "pos": result["pos"]})
    except Exception as e:
        pass

    return jsonify({"success": False})


# @app.route('/api/analyze', methods=['POST'])
# def analyze():


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
