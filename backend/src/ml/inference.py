import io
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image
from torchvision import transforms

MODEL_DIR = Path(__file__).resolve().parent / "model"
ONNX_PATH = MODEL_DIR / "food_vision_efficientnet_b0.onnx"
CLASS_NAMES_PATH = MODEL_DIR / "class_names.json"

IMG_SIZE = 224
CONFIDENCE_THRESHOLD = 0.55

with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
    CLASS_NAMES = json.load(f)

_session = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])

_eval_transforms = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def _softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - np.max(x))
    return e / e.sum()


def classify_image(image_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = _eval_transforms(image).unsqueeze(0).numpy()

    outputs = _session.run(None, {"input": tensor})
    logits = outputs[0][0]
    probabilities = _softmax(logits)

    top_class_id = int(np.argmax(probabilities))
    confidence = float(probabilities[top_class_id])

    return {
        "predicted_class": CLASS_NAMES[top_class_id],
        "confidence": round(confidence, 4),
        "low_confidence_warning": confidence < CONFIDENCE_THRESHOLD,
    }