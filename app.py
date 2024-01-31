from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/webcam")
def render_webcam():
    return render_template("webcam.html")


@app.route("/saved")
def render_saved():
    return render_template("saved.html")


# @app.route('/api/analyze', methods=['POST'])
# def analyze():


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
