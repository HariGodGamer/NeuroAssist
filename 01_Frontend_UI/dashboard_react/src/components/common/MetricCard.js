import React from 'react';

/**
 * MetricCard — Editorial metric tile with hairline border and subtle elevation.
 */
export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'neutral', // 'sage' | 'amber' | 'maroon' | 'slate' | 'neutral'
  trend,
  className = '',
}) {
  const getBadgeClasses = () => {
    switch (badgeType) {
      case 'sage':
        return 'bg-[#EDF5F0] text-[#2E523A] border-[#CFE3D5]';
      case 'amber':
        return 'bg-[#FAF3E8] text-[#8A5A14] border-[#F0DEC2]';
      case 'maroon':
        return 'bg-[#F8EAED] text-[#7A1F2B] border-[#ECC8CF]';
      case 'slate':
        return 'bg-[#F4F7FA] text-[#5B7C99] border-[#CFDEEB]';
      default:
        return 'bg-[#F7F1EC] text-[#7A756F] border-[#E8E2DA]';
    }
  };

  return (
    <div className={`clinical-card-hover p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#7A756F]">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[#FAF6F3] border border-[#E8E2DA] flex items-center justify-center text-[#7A1F2B]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-2xl sm:text-3xl font-serif font-bold text-[#22201F] tracking-tight">
          {value}
        </span>
        {badgeText && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeClasses()}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-[#7A756F] font-normal leading-relaxed">
          {subtitle}
        </p>
      )}

      {trend && (
        <div className="mt-2 pt-2 border-t border-[#F0EBE5] text-[11px] text-[#A39E98] flex items-center justify-between">
          <span>{trend.label}</span>
          <span className="font-medium text-[#22201F]">{trend.value}</span>
        </div>
      )}
    </div>
  );
}
