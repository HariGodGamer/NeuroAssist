# UI/UX Specifications and Feature Reality Document: NeuroAssist 🧠

This document serves as the guide for the visual layout, user interactions, and technical implementation details of the **NeuroAssist UI/UX Dashboard**. It details every page, describes interactive elements, and maps out the distinction between **production-implemented logic (Real)** and **high-fidelity demonstration simulations (Simulated)**.

---

## 1. UI/UX Design Philosophy & Themes

NeuroAssist is designed to feel like a premium, hospital-grade software console. It avoids the look of a typical minimum viable product by adopting a high-contrast dark theme, sleek glowing indicators, and smooth micro-interactions.

- **Theme:** Ultra-sleek clinical dark mode.
- **Primary Colors:** Neon Cyan (primary/interactive), Accent Purple (secondary), Dark Slate `#050d1a` (page background), Glass-card `#0a192f` with subtle border opacity.
- **Typography:** Modern sans-serif (Inter/Outfit) for clear readability under stress.
- **Micro-Animations:** Hover scaling, glowing active tabs, and slide-in panel transitions using `Framer Motion`.

---

## 2. Feature Reality Checklist (Real vs. Simulated)

To ensure high performance, speed, and cost-effectiveness on lightweight deployment servers (e.g., Render/Railway free tiers), NeuroAssist uses a hybrid approach. The deep learning models were trained on real ADNI MRI data, while the web server runs a fast, deterministic emulation layer.

| Component / Feature | Status | How It Works Under The Hood |
| :--- | :--- | :--- |
| **Deep Learning Code (Task 2-4)** | **Real** | Python files in `02_Deep_Learning_Models/` train a 3D ResNet-10 (MedicalNet) on raw ADNI MRI scans. Evaluated accuracy (87% binary, 72.41% multi-class) is real. |
| **MRI Preprocessing Engine** | **Real** | Python scripts executing 7-stage transforms (N4 correction, skull-strip, MNI registration) exist and can run locally using `SimpleITK` and `ANTsPy`. |
| **Web Server ML Inference** | **Simulated** | To prevent server Out-Of-Memory (OOM) crashes on Render, the backend computes the uploaded MRI file's **MD5 Hash**. This hash seeds a deterministic generator. Uploading the same file always yields identical predictions, risk percentages, and region attention scores. |
| **Explainable AI (Grad-CAM)** | **Simulated** | `gradcam_engine.py` generates synthetic brain volume slices with Gaussian attention blobs placed at actual anatomical positions (e.g., Hippocampus). It blends these with a JET colormap to simulate real neural network focus maps. |
| **Interactive 3D Brain Viewer** | **Simulated** | Three.js displays a 3D brain mesh. Regional atrophy scores correspond to the simulated regional volumes determined by the file-hash prediction. |
| **User Authentication** | **Real** | Full JWT (JSON Web Tokens) authentication with password hashing, database validation, role-based controls (Doctor vs Admin), and path guards. |
| **Patient / Scan Database** | **Real** | SQL database (SQLite/PostgreSQL via SQLAlchemy) stores patient profiles, uploaded scan records, clinical statuses, and custom doctor review notes. |
| **Hospital Chatbot (NeuroBot)** | **Simulated** | Client-side rule engine with pre-configured clinical queries, dataset details, and troubleshooting topics for rapid responses. |
| **Emergency SOS Protocol** | **Simulated** | Triggers visual alarms, logs pages, and simulates emergency coordinator outreach logs. |

---

## 3. Page Directory & UI Layout Breakdowns

### 3.1 Intro Splash Screen
- **UX Goal:** Hook the user with high-fidelity visuals.
- **Features:** 
  - Pulsing 3D brain wireframe.
  - Gradual text typewriter animations introducing the system.
  - Automatic slide transition to `/login` upon completion.

### 3.2 Secure Login Page (`/login`)
- **UX Goal:** Clinical access entry.
- **Features:**
  - Glassmorphic card login form.
  - Real-time form validation showing password strength and input status.
  - Smooth shake-animations on incorrect inputs.

### 3.3 Dashboard Home (`/dashboard`)
- **UX Goal:** Immediate triage awareness.
- **Components:**
  - **Quick Stats Bar:** Summary metrics (Active Scans, Pending Reviews, Urgent Flags).
  - **Patient List Overview:** A scrollable table of recently analyzed patients.
  - **Distribution Chart (IDV):** A Recharts ring chart showing the split of CN vs. MCI vs. AD among current scans.
  - **Activity Timeline:** Feed of recent scan uploads, reviews, or login events.

### 3.4 Scan Upload & Pipeline Monitor (`/dashboard/scan`)
- **UX Goal:** Guide the clinician through complex image preprocessing steps.
- **Components:**
  - **Patient Selector:** Searchable dropdown linking the upload to an existing patient record in the database.
  - **Drag-and-Drop Area:** Validates file formats (`.nii.gz`, `.nii`, `.zip`).
  - **Pipeline Progress Bar:** Shows visual pulses for each stage:
    `Format Standardisation ➔ N4 Bias Correction ➔ Denoising ➔ Skull Stripping ➔ MNI Registration ➔ Normalisation ➔ Output Resampling`
  - **Analysis Trigger:** Initiates the API call, transitioning the screen to the detail view once inference finishes.

### 3.5 Interactive Scan Detail & XAI Panel (`/dashboard/scan/:scanId`)
This is the main analysis page.
- **Layout:** Two-column split layout.
  - **Left Column: 3D Visualization & Slices**
    - **BrainViewer tab:** A Three.js canvas. Hovering over a region (e.g., Temporal Lobe) highlights it and displays its volume metric.
    - **Slices tab:** Axial, Coronal, and Sagittal slice windows. Includes a scrollbar to simulate scanning through the brain, showing colorized attention heatmaps overlaying the grayscale structure.
  - **Right Column: Diagnosis, Biomarkers, and Actions**
    - **Risk Scale Gauge:** A glowing arc showing overall disease risk (0-100%).
    - **Prediction Indicators:** Shows probabilities for CN, MCI, and AD.
    - **Biomarker Risk Cards:** Horizontal gauges displaying Hippocampal Atrophy, Amyloid Plaque Load, and Ventricle Enlargement.
    - **Doctor Action Console:** Allows doctors to update status to "Accepted" or override the diagnosis with custom notes saved directly to the database.

### 3.6 Patient Directory & Profile (`/dashboard/patients`)
- **UX Goal:** Track individual patient histories.
- **Components:**
  - **Search & Filter Bar:** Filter by age, gender, and cognitive status.
  - **Patient Profile Page (`/dashboard/patients/:patientId`):**
    - Demographic summary card (Age, Gender, Patient ID Code).
    - Longitudinal Risk Chart (IDV): A line graph mapping the patient's risk scores across chronological scan uploads to track disease progression.
    - List of historical scans linked to this patient.

### 3.7 Interactive Data Visualizations (IDV) Details
- **Charts Engine:** Built using `Recharts`.
- **Colors:** Cyan for CN (Normal), Yellow for MCI (Early Warning), Pink/Red for AD (Urgent Risk).
- **Tooltips:** Hovering over charts displays precise coordinate metrics with micro-shadow wrappers.

---

## 4. Technical UI/UX Implementation Details

- **Responsive Design:** Core panels automatically rearrange on smaller screens. The sidebar collapses into a hamburger overlay menu on tablet and mobile viewports.
- **State Management:** React Context API handles authentication state, global alerts, settings configuration, and active patient profiles.
- **Component Lazy Loading:** Large page elements are loaded using `React.lazy` and `Suspense`, displaying a spinning loader to keep the UI responsive.
