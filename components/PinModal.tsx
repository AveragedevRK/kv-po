import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAccess } from '../context/AccessContext';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose }) => {
  const [pin, setPin] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { validatePin } = useAccess();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin.trim()) {
      setError('Please enter a PIN code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const result = await validatePin(pin.trim());
      
      if (result) {
        setSuccess(`Access granted: ${result} mode`);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError('Invalid PIN code');
        setPin('');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-modal-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/30">
                <Lock size={18} className="text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Request Edit Access</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={18} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter your PIN code to request edit access.
            </p>

            <div className="mb-4">
              <input
                ref={inputRef}
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN code"
                disabled={isValidating || !!success}
                className="w-full px-4 py-3 text-center text-lg font-mono tracking-widest rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 dark:text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-500 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-400">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isValidating || !!success}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Validating...
                </>
              ) : success ? (
                <>
                  <ShieldCheck size={16} />
                  Access Granted
                </>
              ) : (
                'Submit'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-modal-in {
          animation: modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
};

export default PinModal;
