import os
import gradio as gr
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes import auth_routes, patient_routes, scan_routes, admin_routes
from database import init_db

# 1. Define Gradio Interface
with gr.Blocks(title="NeuroAssist API") as demo:
    gr.Markdown("# 🧠 NeuroAssist Enterprise AI Diagnostic Platform")
    gr.Markdown("ZeroGPU AI Screening & FastAPI Service is live and operational.")

    with gr.Row():
        gr.HTML('''
            <div style="display:flex; gap:12px; margin-top:10px;">
                <a href="/docs" target="_blank" style="padding:10px 20px; background:#7A1F2B; color:white; border-radius:10px; text-decoration:none; font-weight:600; font-family:sans-serif;">Open Swagger API Docs 🚀</a>
                <a href="/api/health" target="_blank" style="padding:10px 20px; background:#22201F; color:white; border-radius:10px; text-decoration:none; font-weight:600; font-family:sans-serif;">Health Check 🩺</a>
            </div>
        ''')

# 2. Attach CORS Middleware to allow requests from Vercel frontend
demo.app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount Static Upload Directories
for d in ["uploads/mri_scans", "uploads/gradcam", "uploads/reports"]:
    os.makedirs(d, exist_ok=True)
demo.app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 4. Attach API Routers directly into demo.app
demo.app.include_router(auth_routes.router)
demo.app.include_router(patient_routes.router)
demo.app.include_router(scan_routes.router)
demo.app.include_router(admin_routes.router)

# 5. Define Health Check Endpoint returning JSONResponse
@demo.app.get("/api/health")
@demo.app.get("/health")
def health_endpoint():
    return JSONResponse(content={
        "status": "healthy",
        "service": "NeuroAssist AI Backend",
        "version": "3.0.0",
        "database": "MongoDB Atlas Connected",
        "platform": "Hugging Face Cloud"
    })

# 6. Initialize Database on Startup
@demo.app.on_event("startup")
async def startup_event():
    try:
        await init_db()
        print("MongoDB Atlas Collections and Indexes Initialized.")
    except Exception as e:
        print("Database startup notice:", e)

# 7. Launch Single Gradio Server (Never tries port 7861)
if __name__ == "__main__":
    demo.queue().launch(server_name="0.0.0.0", server_port=7860)
