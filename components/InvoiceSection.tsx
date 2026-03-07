import React, { useState, useRef } from 'react';
import { FileText, Upload, Download, Loader2, X, File } from 'lucide-react';
import { uploadInvoice } from '../lib/loadPurchaseOrder';

interface InvoiceSectionProps {
  poId: string;
  itemId: string;
  invoices: string[];
  onInvoiceUploaded: () => void;
}

const InvoiceSection: React.FC<InvoiceSectionProps> = ({ poId, itemId, invoices, onInvoiceUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload all selected files
      for (const file of Array.from(files)) {
        await uploadInvoice(poId, itemId, file);
      }
      onInvoiceUploaded();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileName = (url: string) => {
    try {
      // Extract filename from Firebase Storage URL
      const decodedUrl = decodeURIComponent(url);
      const parts = decodedUrl.split('/');
      const fileNameWithParams = parts[parts.length - 1];
      const fileName = fileNameWithParams.split('?')[0];
      return fileName || 'Invoice';
    } catch {
      return 'Invoice';
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FileText size={16} />
          Invoices
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {invoices.length} file{invoices.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Upload Area */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          id="invoice-upload"
        />
        <label
          htmlFor="invoice-upload"
          className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
            ${isUploading 
              ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20' 
              : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-brand-600 dark:hover:bg-gray-800'
            }
          `}
        >
          {isUploading ? (
            <>
              <Loader2 size={24} className="text-brand-500 animate-spin mb-2" />
              <span className="text-sm text-brand-600 dark:text-brand-400">Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={24} className="text-gray-400 dark:text-gray-500 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload invoices</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, Images, Documents</span>
            </>
          )}
        </label>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between">
          <span className="text-sm text-red-700 dark:text-red-400">{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Invoice List */}
      {invoices.length > 0 && (
        <div className="space-y-2">
          {invoices.map((url, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/30">
                  <File size={16} className="text-brand-600 dark:text-brand-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {getFileName(url)}
                </span>
              </div>
              <button
                onClick={() => handleDownload(url)}
                className="p-2 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/30 transition-colors"
                title="Download"
              >
                <Download size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {invoices.length === 0 && !isUploading && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          No invoices uploaded yet
        </p>
      )}
    </div>
  );
};

export default InvoiceSection;
