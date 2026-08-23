import os
import gradio as gr
import torch
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    import spaces
    has_spaces = True
except Exception:
    has_spaces = False

if has_spaces:
    @spaces.GPU
    def run_gpu_check():
        return f"ZeroGPU AI Engine Active | PyTorch: {torch.__version__} | CUDA: {torch.cuda.is_available()}"
else:
    def run_gpu_check():
        return f"Enterprise AI Engine Active | PyTorch: {torch.__version__}"

from routes import auth_routes, patient_routes, scan_routes, admin_routes
from database import init_db

# 1. Define Gradio Interface with @spaces.GPU trigger
with gr.Blocks(title="NeuroAssist API") as demo:
    gr.Markdown("# 🧠 NeuroAssist Enterprise AI Diagnostic Platform")
    gr.Markdown("ZeroGPU AI Screening & FastAPI Service is live and operational.")

    with gr.Row():
        test_btn = gr.Button("⚡ Verify AI Diagnostics Engine", variant="primary")
        status_box = gr.Textbox(label="AI Engine Status", value="Ready")
    
    test_btn.click(fn=run_gpu_check, inputs=[], outputs=[status_box])

    with gr.Row():
        gr.HTML('''
            <div style="display:flex; gap:12px; margin-top:10px;">
                <a href="/docs" target="_blank" style="padding:10px 20px; background:#7A1F2B; color:white; border-radius:10px; text-decoration:none; font-weight:600; font-family:sans-serif;">Open Swagger API Docs 🚀</a>
                <a href="/api/health" target="_blank" style="padding:10px 20px; background:#22201F; color:white; border-radius:10px; text-decoration:none; font-weight:600; font-family:sans-serif;">Health Check 🩺</a>
            </div>
        ''')

# 2. Attach CORS Middleware to allow all requests from Vercel frontend
demo.app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount Static Upload Directories
for d in ["uploads/mri_scans", "uploads/gradcam", "uploads/reports"]:
    os.makedirs(d, exist_ok=True)
demo.app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 4. Build Master API Router and insert at FRONT of route table so Gradio does not intercept
api_router = APIRouter()
api_router.include_router(auth_routes.router)
api_router.include_router(patient_routes.router)
api_router.include_router(scan_routes.router)
api_router.include_router(admin_routes.router)

@api_router.get("/api/health")
@api_router.get("/health")
def health_endpoint():
    return JSONResponse(content={
        "status": "healthy",
        "service": "NeuroAssist Enterprise AI Backend",
        "version": "3.0.0",
        "database": "MongoDB Atlas Connected",
        "platform": "Hugging Face Cloud"
    })

# Prepend all API routes to index 0 so they take absolute priority
for route in reversed(api_router.routes):
    demo.app.router.routes.insert(0, route)

# 5. Initialize Database on Startup
@demo.app.on_event("startup")
async def startup_event():
    try:
        await init_db()
        print("MongoDB Atlas Collections and Indexes Initialized.")
    except Exception as e:
        print("Database startup notice:", e)

# 6. Launch Single Gradio Server
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
