# DUMMY/app.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse
import os

app = FastAPI()

# Path to your dummy segmented image
DUMMY_IMAGE_PATH = os.path.join(os.path.dirname(__file__), "static", "segmented.jpg")

@app.post("/segment")
async def segment(
    image: UploadFile = File(...),
    prompt: str = Form(...)
):
    # Ignore uploaded image & prompt
    # Always return the same dummy segmented image
    return FileResponse(
        DUMMY_IMAGE_PATH,
        media_type="image/jpeg",
        filename="segmented.jpg"
    )

# Optional: Health check
@app.get("/")
def root():
    return {"status": "Dummy LISA running"}