import cv2
import base64
import numpy as np
from PIL import Image
from io import BytesIO


def base64ToImage(base64Image):
    return Image.open(BytesIO(base64.b64decode(base64Image)))


def imageToBase64(pilImage):
    buffered = BytesIO()
    pilImage.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def imageToCV2(pilImage):
    return cv2.cvtColor(np.array(pilImage), cv2.COLOR_RGB2BGR)


def cv2ToImage(cv2Image):
    return Image.fromarray(cv2.cvtColor(cv2Image, cv2.COLOR_BGR2RGB))


def saveImage(image, path):
    cv2.imwrite(path, image)
