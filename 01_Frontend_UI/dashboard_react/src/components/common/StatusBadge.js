import React from 'react';

/**
 * StatusBadge — Desaturated, hospital-grade condition pills.
 * CN: Soft sage green | MCI: Soft amber | AD: Muted clinical maroon
 */
export default function StatusBadge({ status, size = 'sm', showDot = true }) {
  const norm = (status || '').toUpperCase();

  const isSmall = size === 'sm';
  const sizeClasses = isSmall
    ? 'px-2.5 py-0.5 text-xs font-semibold'
    : 'px-3.5 py-1 text-sm font-semibold';

  if (norm === 'CN' || norm.includes('NORMAL')) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#EDF5F0] text-[#2E523A] border border-[#CFE3D5] ${sizeClasses}`}>
        {showDot && <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />}
        <span>CN · Cognitively Normal</span>
      </span>
    );
  }

  if (norm === 'MCI' || norm.includes('IMPAIRMENT')) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#FAF3E8] text-[#8A5A14] border border-[#F0DEC2] ${sizeClasses}`}>
        {showDot && <span className="w-1.5 h-1.5 rounded-full bg-[#B87326]" />}
        <span>MCI · Mild Impairment</span>
      </span>
    );
  }

  if (norm === 'AD' || norm.includes('ALZHEIMER')) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#F8EAED] text-[#7A1F2B] border border-[#ECC8CF] ${sizeClasses}`}>
        {showDot && <span className="w-1.5 h-1.5 rounded-full bg-[#7A1F2B]" />}
        <span>AD · Alzheimer's Disease</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#F4F7FA] text-[#5B7C99] border border-[#CFDEEB] ${sizeClasses}`}>
      {showDot && <span className="w-1.5 h-1.5 rounded-full bg-[#5B7C99]" />}
      <span>{status || 'Unknown'}</span>
    </span>
  );
}
