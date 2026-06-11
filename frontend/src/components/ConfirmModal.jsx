import React from 'react';

export default function ConfirmModal({ open, title, description, onConfirm, onCancel, confirmLabel = 'Confirm' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="bg-ink-900 border border-white/10 rounded-lg p-4 z-10 w-[90%] max-w-sm">
        <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
        <p className="text-white/60 text-sm mb-4">{description}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 rounded-lg bg-white/[0.04] text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-2 rounded-lg bg-red-600 text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
