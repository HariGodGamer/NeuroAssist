import os
import gradio as gr
import torch
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

def run_engine_check():
    cuda_status = torch.cuda.is_available()
    return f"NeuroAssist Enterprise AI Engine Active | PyTorch: {torch.__version__} | Device: {'CUDA' if cuda_status else 'CPU'}"

from routes import auth_routes, patient_routes, scan_routes, admin_routes
from database import init_db

# 1. Build Gradio UI
with gr.Blocks(title="NeuroAssist API") as demo:
    gr.Markdown("# 🧠 NeuroAssist Enterprise AI Diagnostic Platform")
    gr.Markdown("Enterprise AI Screening & Clinical Decision Support Service is active.")
    
    with gr.Row():
        test_btn = gr.Button("⚡ Verify AI Diagnostics Engine", variant="primary")
        status_box = gr.Textbox(label="AI Engine Status", value="Ready")
    
    test_btn.click(fn=run_engine_check, inputs=[], outputs=[status_box])

    with gr.Row():
        gr.HTML('''
            <div style="display:flex; gap:12px; margin-top:10px;">
                <a href="/docs" target="_blank" style="padding:10px 20px; background:#7A1F2B; color:white; border-radius:10px; text-decoration:none; font-weight:600; font-family:sans-serif;">Open Swagger API Docs 🚀</a>
                <a href="/api/health" target="_blank" style="padding:10px 20px; background:#22201F; color:white; border-radius:10px; text-decoration:none; font-weight:600; font-family:sans-serif;">Health Check 🩺</a>
            </div>
        ''')

# 2. Attach CORS and static uploads
demo.app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for d in ["uploads/mri_scans", "uploads/gradcam", "uploads/reports"]:
    os.makedirs(d, exist_ok=True)

demo.app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 3. Include API routes
demo.app.include_router(auth_routes.router)
demo.app.include_router(patient_routes.router)
demo.app.include_router(scan_routes.router)
demo.app.include_router(admin_routes.router)

# 4. Health check & Swagger Docs endpoints
@demo.app.get("/api/health")
async def health_endpoint():
    return {
        "status": "healthy",
        "service": "NeuroAssist AI Backend",
        "version": "3.0.0",
        "platform": "Hugging Face Cloud"
    }

@demo.app.get("/openapi.json", include_in_schema=False)
async def custom_openapi():
    return get_openapi(
        title="NeuroAssist API",
        version="3.0.0",
        description="Enterprise AI Healthcare Platform — Neurological Screening & MRI Intelligence",
        routes=demo.app.routes,
    )

@demo.app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(openapi_url="/openapi.json", title="NeuroAssist API Docs")

@demo.app.on_event("startup")
async def startup_event():
    await init_db()

# 5. Launch native Gradio server
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
