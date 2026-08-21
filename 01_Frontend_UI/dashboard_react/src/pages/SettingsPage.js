import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  FiSliders, 
  FiCpu, 
  FiCheckCircle, 
  FiShield, 
  FiDatabase, 
  FiMail, 
  FiServer,
  FiFileText
} from 'react-icons/fi';
import { LuBrain } from 'react-icons/lu';

export default function SettingsPage() {
  const { state, dispatch } = useApp();

  const [settings, setSettings] = useState(state.settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <DashboardLayout
      title="System Configurations & Diagnostic Thresholds"
      subtitle="Calibrate AI confidence cutoffs, model weights, DICOM PACS connectivity, and reporting templates."
    >
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        
        {/* Diagnostic Sensitivity Thresholds */}
        <div className="clinical-card p-6 space-y-5 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2DA]">
            <div className="flex items-center gap-2">
              <FiSliders className="w-4 h-4 text-[#7A1F2B]" />
              <h3 className="text-base font-serif font-bold text-[#22201F]">
                Clinical Alert & Classification Thresholds
              </h3>
            </div>
            <span className="text-xs text-[#7A756F]">Calibrated to OASIS/ADNI cohorts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* MCI Cutoff Slider */}
            <div className="p-4 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#22201F]">MCI Probability Cutoff</span>
                <span className="font-mono font-bold text-xs text-[#B87326] bg-white px-2 py-0.5 rounded border border-[#E8E2DA]">
                  {settings.mciThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="70"
                value={settings.mciThreshold}
                onChange={(e) => handleChange('mciThreshold', parseInt(e.target.value))}
                className="w-full accent-[#7A1F2B] cursor-pointer"
              />
              <p className="text-[11px] text-[#7A756F]">
                Threshold required to classify borderline scans as Mild Cognitive Impairment.
              </p>
            </div>

            {/* AD Alert Level Slider */}
            <div className="p-4 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#22201F]">Urgent AD Flag Cutoff</span>
                <span className="font-mono font-bold text-xs text-[#7A1F2B] bg-white px-2 py-0.5 rounded border border-[#E8E2DA]">
                  {settings.adAlertThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                value={settings.adAlertThreshold}
                onChange={(e) => handleChange('adAlertThreshold', parseInt(e.target.value))}
                className="w-full accent-[#7A1F2B] cursor-pointer"
              />
              <p className="text-[11px] text-[#7A756F]">
                Automatically triggers priority triage flags when AD risk index exceeds this value.
              </p>
            </div>

          </div>

          {/* Grad-CAM Sensitivity */}
          <div className="p-4 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#22201F]">Grad-CAM Attention Spatial Resolution</span>
              <span className="font-mono font-bold text-xs text-[#5B7C99] bg-white px-2 py-0.5 rounded border border-[#E8E2DA]">
                {Math.round(settings.gradcamSensitivity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={settings.gradcamSensitivity}
              onChange={(e) => handleChange('gradcamSensitivity', parseFloat(e.target.value))}
              className="w-full accent-[#7A1F2B] cursor-pointer"
            />
            <p className="text-[11px] text-[#7A756F]">
              Controls gradient sensitivity threshold for 3D ResNet layer-4 backpropagation heatmaps.
            </p>
          </div>
        </div>

        {/* AI Model Backbone Architecture */}
        <div className="clinical-card p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2DA]">
            <div className="flex items-center gap-2">
              <LuBrain className="w-4 h-4 text-[#7A1F2B]" />
              <h3 className="text-base font-serif font-bold text-[#22201F]">
                Deep Learning Model Backbone
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#4A7C59] bg-[#EDF5F0] px-2.5 py-0.5 rounded-full border border-[#CFE3D5]">
              Active & Validated
            </span>
          </div>

          <div className="space-y-3">
            <label className="p-4 rounded-xl border border-[#7A1F2B] bg-[#F8EAED] flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="model"
                checked={settings.activeModel === 'medicalnet-resnet10'}
                onChange={() => handleChange('activeModel', 'medicalnet-resnet10')}
                className="mt-1 accent-[#7A1F2B]"
              />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between font-bold text-[#7A1F2B]">
                  <span>MedicalNet 3D ResNet-10 (Transfer Learning)</span>
                  <span className="font-mono">87.0% Accuracy / 0.9231 AUC</span>
                </div>
                <p className="text-[#5A5550] mt-1">
                  Backbone pre-trained across 23 diverse 3D medical imaging datasets with trainable classification head. Recommended for clinical diagnostic accuracy.
                </p>
              </div>
            </label>

            <label className="p-4 rounded-xl border border-[#E8E2DA] bg-[#FAF6F3] flex items-start gap-3 opacity-70 cursor-not-allowed">
              <input
                type="radio"
                name="model"
                disabled
                checked={settings.activeModel === 'scratch-cnn'}
                className="mt-1"
              />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between font-semibold text-[#7A756F]">
                  <span>Baseline 3D CNN (Trained from Scratch)</span>
                  <span className="font-mono">50.0% Baseline</span>
                </div>
                <p className="text-[#A39E98] mt-1">
                  Non-transfer learned baseline (Slide 5 reference). Deprecated for clinical usage.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Institutional & Reporting Profile */}
        <div className="clinical-card p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2DA]">
            <div className="flex items-center gap-2">
              <FiServer className="w-4 h-4 text-[#7A1F2B]" />
              <h3 className="text-base font-serif font-bold text-[#22201F]">
                Institutional Profile & PACS Settings
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A756F] mb-1.5">
                Hospital / Institute Name
              </label>
              <input
                type="text"
                value={settings.clinicName}
                onChange={(e) => handleChange('clinicName', e.target.value)}
                className="clinical-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A756F] mb-1.5">
                Attending Neurologist Name
              </label>
              <input
                type="text"
                value={settings.physicianName}
                onChange={(e) => handleChange('physicianName', e.target.value)}
                className="clinical-input"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[#7A756F] border-t border-[#F0EBE5]">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-pdf"
                checked={settings.autoGeneratePdf}
                onChange={(e) => handleChange('autoGeneratePdf', e.target.checked)}
                className="accent-[#7A1F2B] rounded"
              />
              <label htmlFor="auto-pdf" className="cursor-pointer">
                Automatically generate downloadable PDF summary upon physician approval
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="btn-maroon text-xs shadow-clinical-sm px-6 py-3"
          >
            <FiCheckCircle className="w-4 h-4" />
            <span>Save Configuration Changes</span>
          </button>

          {savedSuccess && (
            <span className="text-xs font-semibold text-[#4A7C59] animate-fade-in">
              ✓ System parameters updated successfully.
            </span>
          )}
        </div>

      </form>
    </DashboardLayout>
  );
}
