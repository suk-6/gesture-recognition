import logging as log
import sys
from time import perf_counter
import json
import os
import os.path as osp
from pathlib import Path
import multiprocessing
from multiprocessing import Process, Value, Array

import cv2
import numpy as np

from utils.common import load_core
from utils.person_detector import PersonDetector
from utils.tracker import Tracker
from utils.action_recognizer import ActionRecognizer

DETECTOR_OUTPUT_SHAPE = -1, 5
TRACKER_SCORE_THRESHOLD = 0.4
TRACKER_IOU_THRESHOLD = 0.3
ACTION_IMAGE_SCALE = 256
OBJECT_IDS = [ord(str(n)) for n in range(10)]

# Custom Paths
openvinoPath = osp.join(os.getcwd(), "openvino")


def load_class_map(file_path):
    """Returns class names map."""

    if file_path is not None and os.path.exists(file_path):
        with open(file_path, "r") as input_stream:
            data = json.load(input_stream)
            class_map = dict(enumerate(data))
    else:
        class_map = None

    return class_map


class recognition:
    def __init__(self):
        self.main()

    def main(self):
        classMapPath = osp.join(
            openvinoPath, "data", "dataset_classes", "msasl100.json"
        )
        self.class_map = load_class_map(classMapPath)
        if self.class_map is None:
            raise RuntimeError("Can't read {}".format(classMapPath))

        core = load_core()

        personDetectModel = "person-detection-asl-0001"
        person_detector = PersonDetector(
            osp.join(
                openvinoPath,
                "intel",
                personDetectModel,
                "FP16",
                f"{personDetectModel}.xml",
            ),
            "CPU",
            core,
            num_requests=2,
            output_shape=DETECTOR_OUTPUT_SHAPE,
        )

        actionRecognitionModel = "asl-recognition-0004"
        self.action_recognizer = ActionRecognizer(
            osp.join(
                openvinoPath,
                "intel",
                actionRecognitionModel,
                "FP16",
                f"{actionRecognitionModel}.xml",
            ),
            "CPU",
            core,
            num_requests=2,
            img_scale=ACTION_IMAGE_SCALE,
            num_classes=len(self.class_map),
        )

        self.person_tracker = Tracker(
            person_detector, TRACKER_SCORE_THRESHOLD, TRACKER_IOU_THRESHOLD
        )

        batchSize = self.action_recognizer.input_length
        batchShape = [batchSize] + [700, 580, 3]
        batchBufferSize = int(np.prod(batchShape))
        slowBath = Array("B", batchBufferSize, lock=True)
        buffer = np.frombuffer(slowBath.get_obj(), dtype=np.uint8)
        self.batch = np.copy(buffer.reshape(batchShape))

    def process_frame(self, frame):
        active_object_id = -1
        tracker_labels_map = {}

        detections, tracker_labels_map = self.person_tracker.add_frame(
            frame, len(OBJECT_IDS), tracker_labels_map
        )
        if detections is None:
            active_object_id = -1

        if len(detections) == 1:
            active_object_id = 0

        if active_object_id >= 0:
            cur_det = [det for det in detections if det.id == active_object_id]
            if len(cur_det) != 1:
                active_object_id = -1
                return None

            if detections is not None:
                for det in detections:
                    roi_color = (
                        (0, 255, 0) if active_object_id == det.id else (128, 128, 128)
                    )
                    border_width = 2 if active_object_id == det.id else 1
                    person_roi = det.roi[0]
                    cv2.rectangle(
                        frame,
                        (person_roi[0], person_roi[1]),
                        (person_roi[2], person_roi[3]),
                        roi_color,
                        border_width,
                    )
                    cv2.putText(
                        frame,
                        str(det.id),
                        (person_roi[0] + 10, person_roi[1] + 20),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        roi_color,
                        2,
                    )

            recognizer_result = self.action_recognizer(
                self.batch, cur_det[0].roi.reshape(-1)
            )

            action_class_label = None
            if recognizer_result is not None:
                action_class_id = np.argmax(recognizer_result)
                action_class_label = (
                    self.class_map[action_class_id]
                    if self.class_map is not None
                    else action_class_id
                )

                # action_class_score = np.max(recognizer_result)
                # if action_class_score > 0.7:  # action_threshold
        return frame, action_class_label
