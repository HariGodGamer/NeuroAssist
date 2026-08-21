import React from 'react';
import ClinicalNavbar from './ClinicalNavbar';
import ClinicalSidebar from './ClinicalSidebar';

export default function DashboardLayout({ children, title, subtitle, action }) {
  return (
    <div className="min-h-screen bg-[#FAF6F3] flex flex-col font-sans text-[#22201F]">
      <ClinicalNavbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <ClinicalSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {/* Header Banner if provided */}
          {(title || action) && (
            <div className="mb-6 pb-4 border-b border-[#E8E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#22201F] tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-[#7A756F] mt-1 font-normal">
                    {subtitle}
                  </p>
                )}
              </div>
              {action && <div>{action}</div>}
            </div>
          )}

          {/* Main Route Content */}
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
