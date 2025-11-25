"use client";

import { X } from "lucide-react";
import { ReactNode } from "react";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  description?: string;
  size?: "md" | "lg";
  children: ReactNode;
}

const Modal = ({ title, open, onClose, description, size = "md", children }: ModalProps) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div
        className={`modal-panel ${size === "lg" ? "max-w-3xl" : "max-w-2xl"}`}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-transparent p-1 text-slate-500 hover:border-slate-200 hover:text-slate-900 dark:hover:border-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
