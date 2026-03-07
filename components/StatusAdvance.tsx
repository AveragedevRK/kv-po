import React, { useState } from 'react';
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { POStatus, PO_STATUS_ORDER } from '../types';

interface StatusAdvanceProps {
  currentStatus: POStatus;
  onAdvance: () => Promise<void>;
}

const StatusAdvance: React.FC<StatusAdvanceProps> = ({ currentStatus, onAdvance }) => {
  const [isAdvancing, setIsAdvancing] = useState(false);

  const currentIndex = PO_STATUS_ORDER.indexOf(currentStatus);
  const isAtFinalStatus = currentIndex >= PO_STATUS_ORDER.length - 1;
  const nextStatus = !isAtFinalStatus ? PO_STATUS_ORDER[currentIndex + 1] : null;

  const handleAdvance = async () => {
    if (isAtFinalStatus || isAdvancing) return;
    
    setIsAdvancing(true);
    try {
      await onAdvance();
    } finally {
      setIsAdvancing(false);
    }
  };

  // Status badge color mapping
  const getStatusColor = (status: POStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'Awaiting Payment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Created':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Approved':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Partially Processed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Processed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Current Status Badge */}
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(currentStatus)}`}>
        {isAtFinalStatus && <CheckCircle size={12} className="mr-1.5" />}
        {currentStatus}
      </span>

      {/* Advance Button */}
      {!isAtFinalStatus && (
        <button
          onClick={handleAdvance}
          disabled={isAdvancing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors duration-200
            bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100 
            dark:bg-brand-900/30 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/50
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdvancing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <span>Advance to {nextStatus}</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default StatusAdvance;
