import os
import gradio as gr
import torch
import uvicorn

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

from main import app as fastapi_app

# 1. Define Gradio Interface with @spaces.GPU trigger
with gr.Blocks(title="NeuroAssist API") as demo:
    gr.Markdown("# 🧠 NeuroAssist Enterprise AI Diagnostic Platform")
    gr.Markdown("Enterprise AI Screening & Clinical Decision Support Service is active.")

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

# 2. Mount Gradio onto the Master FastAPI app at /gradio
# This ensures that ALL /api/* and /docs routes are handled by FastAPI first
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

# 3. Launch single uvicorn server on port 7860
if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
