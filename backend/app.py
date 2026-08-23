import os
import gradio as gr
import uvicorn
import torch

try:
    import spaces
    has_spaces = True
except Exception:
    has_spaces = False

if has_spaces:
    @spaces.GPU(duration=120)
    def gpu_predict(input_trigger="status"):
        cuda_ok = torch.cuda.is_available()
        return f"NeuroAssist ZeroGPU Pipeline Active | CUDA: {cuda_ok}"
else:
    def gpu_predict(input_trigger="status"):
        return "NeuroAssist Pipeline Active (CPU Mode)"

from main import app as fastapi_app

with gr.Blocks(title="NeuroAssist API") as demo:
    gr.Markdown("# 🧠 NeuroAssist Enterprise AI Diagnostic Platform")
    gr.Markdown("FastAPI backend & ZeroGPU inference service is live and operational.")

    with gr.Row():
        test_btn = gr.Button("⚡ Verify ZeroGPU Engine", variant="primary")
        status_box = gr.Textbox(label="GPU Engine Status", value="Ready")
    
    test_btn.click(fn=gpu_predict, inputs=test_btn, outputs=status_box)

    with gr.Row():
        gr.HTML('''
            <div style="display:flex; gap:12px; margin-top:10px;">
                <a href="/docs" target="_blank" style="padding:10px 20px; background:#7A1F2B; color:white; border-radius:10px; text-decoration:none; font-weight:600; font-family:sans-serif;">Open Swagger API Docs 🚀</a>
                <a href="/api/health" target="_blank" style="padding:10px 20px; background:#22201F; color:white; border-radius:10px; text-decoration:none; font-weight:600; font-family:sans-serif;">Health Check 🩺</a>
            </div>
        ''')

# Mount FastAPI app onto Gradio root
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
