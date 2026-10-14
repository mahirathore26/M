import React from 'react';
import { Check } from 'lucide-react';

const CATEGORY_META = {
  VEHICLE_TYPE: {
    label: 'Vehicle Dimension',
    hint: 'Determines rate card & payload capacity',
  },
  BODY_TYPE: {
    label: 'Body Construction',
    hint: 'Cargo enclosure type',
  },
  FEATURE: {
    label: 'Protection & Temperature',
    hint: 'Transit protection specifications',
  },
  FREIGHT_TYPE: {
    label: 'Cargo Handling',
    hint: 'Handling & perishability profile',
  },
};

export default function CapabilityMultiSelect({
  capabilities = [],
  selectedIds = [],
  onChange,
  disabled = false,
}) {
  const toggleCapability = (id) => {
    if (disabled) return;
    const numId = Number(id);
    if (selectedIds.includes(numId)) {
      onChange(selectedIds.filter((item) => item !== numId));
    } else {
      onChange([...selectedIds, numId]);
    }
  };

  // Group capabilities by category
  const grouped = capabilities.reduce((acc, cap) => {
    const cat = cap.category || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cap);
    return acc;
  }, {});

  const categoryKeys = ['VEHICLE_TYPE', 'BODY_TYPE', 'FEATURE', 'FREIGHT_TYPE'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Select all mandatory cargo and equipment requirements:
        </span>
        {selectedIds.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-[#2764D9] hover:underline font-bold cursor-pointer"
          >
            Clear all ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categoryKeys.map((catKey) => {
          const items = grouped[catKey] || [];
          if (items.length === 0) return null;
          const meta = CATEGORY_META[catKey] || { label: catKey, hint: '' };

          return (
            <div
              key={catKey}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-2.5"
            >
              <div className="flex items-baseline justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-xs font-bold text-[#10183D]">{meta.label}</span>
                <span className="text-[11px] text-slate-500">{meta.hint}</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {items.map((cap) => {
                  const isSelected = selectedIds.includes(Number(cap.capability_id));
                  return (
                    <button
                      key={cap.capability_id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleCapability(cap.capability_id)}
                      className={`inline-flex items-center space-x-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#10183D] text-white border-[#10183D] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={cap.description || cap.name}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[10px] ${
                          isSelected ? 'bg-[#2764D9] border-[#2764D9] text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span>{cap.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
