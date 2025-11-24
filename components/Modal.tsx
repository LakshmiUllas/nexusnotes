import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-[#2c241b] bg-opacity-40 transition-opacity backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded bg-surface text-left shadow-2xl border border-vintage-border transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-[#fcfbf8] px-4 pb-4 pt-5 sm:p-8 sm:pb-6 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <div className="flex justify-between items-center mb-6 border-b border-vintage-border pb-4">
              <h3 className="text-xl font-serif font-bold leading-6 text-ink">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-md bg-transparent text-secondary hover:text-ink focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-2">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};