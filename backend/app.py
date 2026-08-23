import os
import gradio as gr
import torch
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
        cuda_status = torch.cuda.is_available()
        return f"ZeroGPU Inference Pipeline Ready (CUDA: {cuda_status})"
else:
    def run_gpu_check():
        return "CPU Pipeline Active"

from routes import auth_routes, patient_routes, scan_routes, admin_routes
from database import init_db

# 1. Build Gradio UI with ZeroGPU action
with gr.Blocks(title="NeuroAssist API") as demo:
    gr.Markdown("# 🧠 NeuroAssist Enterprise AI Diagnostic Platform")
    gr.Markdown("ZeroGPU AI Screening & FastAPI Service is active.")
    
    with gr.Row():
        test_btn = gr.Button("⚡ Verify ZeroGPU Engine", variant="primary")
        status_box = gr.Textbox(label="GPU Engine Status", value="Ready")
    
    test_btn.click(fn=run_gpu_check, inputs=[], outputs=[status_box])

    with gr.Row():
        gr.HTML('''
            <div style="display:flex; gap:12px; margin-top:10px;">
                <a href="/docs" target="_blank" style="padding:10px 20px; background:#7A1F2B; color:white; border-radius:10px; text-decoration:none; font-weight:600; font-family:sans-serif;">Open Swagger API Docs 🚀</a>
                <a href="/api/health" target="_blank" style="padding:10px 20px; background:#22201F; color:white; border-radius:10px; text-decoration:none; font-weight:600; font-family:sans-serif;">Health Check 🩺</a>
            </div>
        ''')

# 2. Attach FastAPI routes, middleware and database init directly to Gradio's internal FastAPI app
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

demo.app.include_router(auth_routes.router)
demo.app.include_router(patient_routes.router)
demo.app.include_router(scan_routes.router)
demo.app.include_router(admin_routes.router)

@demo.app.on_event("startup")
async def startup_event():
    await init_db()

# 3. Launch native Gradio server
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
