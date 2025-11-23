'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const styles = {
    success: {
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      text: 'text-cyan-400',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-400',
      icon: XCircle,
    },
  };

  const style = styles[toast.type];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${style.bg} backdrop-blur-xl border rounded-xl p-4 shadow-2xl min-w-[320px] max-w-md`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.text} flex-shrink-0 mt-0.5`} />
        <p className={`flex-1 ${style.text} text-sm font-medium`}>
          {toast.message}
        </p>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
