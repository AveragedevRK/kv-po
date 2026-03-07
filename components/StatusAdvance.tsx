import React from 'react';
import { CheckCircle } from 'lucide-react';
import { POStatus, PO_STATUS_ORDER } from '../types';

interface StatusBadgeProps {
  status: POStatus;
}

// Status badge color mapping
export const getStatusColor = (status: POStatus) => {
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

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const isAtFinalStatus = PO_STATUS_ORDER.indexOf(status) >= PO_STATUS_ORDER.length - 1;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
      {isAtFinalStatus && <CheckCircle size={10} className="mr-1" />}
      {status}
    </span>
  );
};

export default StatusBadge;
