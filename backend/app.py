import os
import gradio as gr
import torch

try:
    import spaces
    has_spaces = True
except Exception:
    has_spaces = False

if has_spaces:
    @spaces.GPU
    def run_engine_check():
        cuda_status = torch.cuda.is_available()
        return f"NeuroAssist ZeroGPU AI Engine Active | PyTorch: {torch.__version__} | Device: {'CUDA' if cuda_status else 'CPU'}"
else:
    def run_engine_check():
        return f"NeuroAssist Enterprise AI Engine Active | PyTorch: {torch.__version__} | Device: CPU"

from routes import auth_routes, patient_routes, scan_routes, admin_routes
from database import init_db
from fastapi.staticfiles import StaticFiles

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

# 2. Attach routes directly to demo.app
demo.app.include_router(auth_routes.router)
demo.app.include_router(patient_routes.router)
demo.app.include_router(scan_routes.router)
demo.app.include_router(admin_routes.router)

@demo.app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "NeuroAssist AI Backend", "version": "3.0.0"}

for d in ["uploads/mri_scans", "uploads/gradcam", "uploads/reports"]:
    os.makedirs(d, exist_ok=True)
demo.app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@demo.app.on_event("startup")
async def startup_db():
    try:
        await init_db()
    except Exception:
        pass

# 3. Launch single Gradio server instance
if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    demo.launch(server_name="0.0.0.0", server_port=port)
