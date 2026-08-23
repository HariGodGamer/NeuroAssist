import os
import gradio as gr
import torch
import uvicorn
from fastapi.responses import RedirectResponse

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

from main import app as fastapi_app

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

# 2. Mount Gradio onto the standard FastAPI application
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

@fastapi_app.get("/", include_in_schema=False)
async def root_redirect():
    return RedirectResponse(url="/ui")

# 3. Keep server running continuously on port 7860
if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
