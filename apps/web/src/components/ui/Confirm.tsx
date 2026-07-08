'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver({ resolve });
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolver?.resolve(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver?.resolve(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel}></div>
          <div className="relative bg-surface rounded-2xl border border-border text-left overflow-hidden shadow-2xl sm:max-w-sm sm:w-full w-full animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5">
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {options.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {options.message}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-surface-hover/30">
              <button
                onClick={handleCancel}
                className="inline-flex justify-center rounded-xl border border-border px-4 py-2 bg-transparent text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none"
              >
                {options.cancelText || 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={`inline-flex justify-center rounded-xl border border-transparent px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface transition-colors ${
                  options.isDanger
                    ? 'bg-[#EF4444] text-white hover:bg-[#EF4444]/90 focus:ring-[#EF4444]'
                    : 'bg-accent text-bg hover:bg-accent/90 focus:ring-accent'
                }`}
              >
                {options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}
