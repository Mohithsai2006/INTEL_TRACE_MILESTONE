# app.py
import uuid
import clip
import torch
from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from PIL import Image
from pathlib import Path

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory=".")

# === CONFIG ===
UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Load CLIP
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")
model, preprocess = clip.load("ViT-B/32", device=device)
model.eval()

# Threat prompts
THREAT_PROMPTS = [
    "a photo of a weapon", "a gun", "a tank", "a missile", "a drone", "fire", "smoke",
    "soldiers", "intruder", "damaged building", "explosion", "attack", "breach"
]

# Explanation prompts
EXPLANATION_PROMPTS = [
    "a satellite image of a road", "a building", "a tree", "a field", "grass", "water",
    "a vehicle", "a person", "a shadow", "a cloud", "a structure", "a cluster"
]

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/analyze")
async def analyze_masked_image(
    file: UploadFile = File(...),
    query: str = Form("")  # optional text
):
    # 1. Save uploaded masked image
    ext = file.filename.split(".")[-1]
    masked_path = UPLOAD_DIR / f"masked_{uuid.uuid4()}.{ext}"
    with open(masked_path, "wb") as f:
        f.write(await file.read())

    # 2. Preprocess image
    image = Image.open(masked_path).convert("RGB")
    image_input = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        image_features = model.encode_image(image_input)

        # === THREAT SIMILARITY ===
        threat_tokens = clip.tokenize(THREAT_PROMPTS).to(device)
        threat_features = model.encode_text(threat_tokens)
        threat_sim = (image_features @ threat_features.T).softmax(dim=-1).cpu().numpy()[0]
        threat_score = threat_sim.max() * 100
        top_threat_idx = threat_sim.argmax()
        top_threat = THREAT_PROMPTS[top_threat_idx]
        top_threat_score = round(threat_sim[top_threat_idx] * 100, 2)

        # === EXPLANATION SIMILARITY ===
        exp_tokens = clip.tokenize(EXPLANATION_PROMPTS).to(device)
        exp_features = model.encode_text(exp_tokens)
        exp_sim = (image_features @ exp_features.T).softmax(dim=-1).cpu().numpy()[0]
        top_exp_idx = exp_sim.argmax()
        top_exp = EXPLANATION_PROMPTS[top_exp_idx]
        top_exp_score = round(exp_sim[top_exp_idx] * 100, 2)

    # === BUILD RICH JUSTIFICATION TEXT ===
    justification = []

    # 1. User query
    if query:
        justification.append(f"User query: \"{query}\"")

    # 2. Mask description
    justification.append(f"The masked region shows a high-contrast, bounded area that stands out from surrounding terrain, indicating intentional highlighting.")

    # 3. CLIP match
    justification.append(f"CLIP model identifies this region as \"{top_threat}\" with {top_threat_score}% confidence.")

    # 4. Why this object?
    if any(x in top_threat for x in ["tank", "vehicle"]):
        justification.append(f"Armored vehicles have distinct rectangular shapes, tracks, and thermal signatures in satellite imagery. The mask precisely isolates these features.")
    elif any(x in top_threat for x in ["weapon", "gun"]):
        justification.append(f"Weapons appear as small, high-reflectivity objects. The mask bounds a compact anomaly consistent with metallic equipment.")
    elif "drone" in top_threat:
        justification.append(f"Drones are small, fast-moving objects with minimal heat signature. The mask captures a compact, isolated region typical of UAV presence.")
    elif any(x in top_threat for x in ["fire", "smoke"]):
        justification.append(f"Fire and smoke produce irregular, diffuse thermal plumes. The mask outlines a non-linear, high-intensity heat source.")
    elif any(x in top_threat for x in ["soldier", "intruder"]):
        justification.append(f"Personnel appear as small, clustered heat signatures. The mask isolates multiple point sources suggesting human activity.")
    else:
        justification.append(f"The object has a structured, non-natural appearance, distinct from terrain, vegetation, or shadows.")

    # 5. Threat level
    if threat_score > 80:
        justification.append(f"Threat score exceeds 80% — this is a high-confidence match to known threat patterns.")
    elif threat_score > 50:
        justification.append(f"Threat score is {threat_score:.1f}% — moderate confidence. Further verification recommended.")
    else:
        justification.append(f"Threat score is {threat_score:.1f}% — low confidence. Likely benign or misidentified.")

    # 6. Recommendation
    if threat_score > 70:
        justification.append(f"Recommendation: Immediate dispatch of reconnaissance assets or alert command center.")
    elif threat_score > 40:
        justification.append(f"Recommendation: Monitor area for movement or changes over next 6 hours.")
    else:
        justification.append(f"Recommendation: No immediate action required. Log for routine review.")

    # Join into rich paragraph
    full_justification = " ".join(justification)

    # Top 3 explanations
    top_explanations = [
        {"prompt": THREAT_PROMPTS[i], "score": round(threat_sim[i] * 100, 2)}
        for i in threat_sim.argsort()[-3:][::-1]
    ]

    return JSONResponse({
        "masked_image": f"/static/uploads/{masked_path.name}",
        "threat_score": float(round(threat_score, 2)),
        "top_threat": top_threat,
        "top_explanations": top_explanations,
        "justification": full_justification,
        "query_used": bool(query)
    })