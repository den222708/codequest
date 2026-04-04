import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const iconMap = {
    danger: { icon: 'warning', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-500' },
    warning: { icon: 'warning', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-500' },
    info: { icon: 'info', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-500' },
  };

  const btnMap = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    info: 'bg-primary hover:bg-primary-dark text-white',
  };

  const { icon, bg, text } = iconMap[variant];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-6">
        <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <span className={`material-symbols-outlined text-2xl ${text}`}>{icon}</span>
        </div>
        <h3 id="confirm-title" className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">
          {title}
        </h3>
        <p id="confirm-message" className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${btnMap[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
