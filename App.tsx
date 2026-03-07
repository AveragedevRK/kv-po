import React, { useState, useEffect } from 'react';
import { FileText, Sun, Moon, Download, Code, Loader2 } from 'lucide-react';
import SummaryCards from './components/SummaryCards';
import AccountBreakdown from './components/AccountBreakdown';
import SkuTable from './components/SkuTable';
import { loadPurchaseOrder } from './lib/loadPurchaseOrder';
import { OverallStats, AccountStat, SkuData } from './types';
import { initializeTelemetry } from './telemetry';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overallStats, setOverallStats] = useState<OverallStats>({ totalInvestment: 0, totalProfit: 0, avgTurnover: 0 });
  const [accountStats, setAccountStats] = useState<AccountStat[]>([]);
  const [skuData, setSkuData] = useState<SkuData[]>([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Trigger telemetry initialization once on mount
  useEffect(() => {
    initializeTelemetry();
  }, []);

  // Load data from Firestore
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await loadPurchaseOrder('PO-2026-001');
        setOverallStats(result.overallStats);
        setAccountStats(result.accountStats);
        setSkuData(result.items);
      } catch (err) {
        console.error('Error loading purchase order:', err);
        setError('Failed to load purchase order data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleExportPDF = () => {
    // Set title to filename for auto-save naming
    const originalTitle = document.title;
    document.title = "KV_Purchase_Order_2_Jan_2026";
    window.print();
    // Restore title after print dialog closes
    setTimeout(() => { document.title = originalTitle; }, 500);
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Account', 'Category', 'Turnover (Days)', 'Investment', 'Profit', 'Status'];
    const rows = skuData.map(item => [
      `"${item.sku}"`,
      `"${item.account}"`,
      `"${item.category}"`,
      item.turnover,
      item.investment.toFixed(2),
      item.profit.toFixed(2),
      `"${item.status}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kv_purchase_order_2_skus_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const LOGO_URL = "https://s3-eu-west-1.amazonaws.com/tpd/logos/6169bf2b0bd1fb001d4d3161/0x0.png";

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} pb-24 sm:pb-20 relative overflow-hidden print:bg-white print:text-black`}>
      {/* Background Logo */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.015]">
        <img 
          src={LOGO_URL}
          alt="KV Watermark" 
          className="w-3/4 max-w-4xl grayscale dark:invert"
        />
      </div>

      {/* Sticky Container for Header and Credits Banner */}
      <div className={`sticky top-0 z-30 transition-colors duration-200 shadow-md ${isDarkMode ? 'bg-gray-850' : 'bg-white'}`}>
        
        {/* Main Header */}
        <header className={`border-b transition-colors duration-200 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} print:border-b print:border-gray-300`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              <div className="flex items-center">
                <img 
                  src={LOGO_URL}
                  alt="KV Logo" 
                  className="h-12 w-auto mr-4 rounded-md"
                />
                <div className={`border-l pl-4 flex flex-col justify-center transition-colors duration-200 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <h1 className={`text-xl font-bold leading-none mb-1 transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Purchase Order #2</h1>
                  <p className={`text-xs font-semibold uppercase tracking-wider leading-none transition-colors duration-200 bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent`}>
                    Jan 2026
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-3 no-print">
                 <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full transition-colors duration-200 focus:outline-none ${isDarkMode ? 'text-brand-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-brand-50'}`}
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                <button 
                  onClick={handleExportCSV}
                  className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none transition-colors duration-200 ${isDarkMode ? 'bg-gray-750 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-brand-400' : 'bg-white border-gray-300 text-gray-700 hover:bg-brand-50 hover:text-brand-700'}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>

                <button 
                  onClick={handleExportPDF}
                  className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none transition-colors duration-200 bg-gradient-to-r from-brand-600 to-cyan-600 border-transparent text-white hover:from-brand-700 hover:to-cyan-700 shadow-lg shadow-brand-500/30`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Developer Credits Banner - Now Sticky part of the header block */}
        <div className="bg-brand-50/50 dark:bg-brand-900/10 border-b border-brand-100 dark:border-brand-900/30 no-print backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 text-center">
             <p className="text-sm font-medium text-brand-800 dark:text-brand-200 flex items-center justify-center gap-2">
              <Code size={16} />
              Designed & Developed by 
              <a href="https://github.com/SalesGuyInTech" target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-2 decoration-brand-400 hover:text-brand-600 dark:hover:text-white transition-colors">GM</a>
              &
              <a href="https://github.com/AveragedevRK/" target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-2 decoration-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors">Rajab</a>
             </p>
          </div>
        </div>

      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-brand-500 mb-4" />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading purchase order data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Section: Overview */}
            <div className="mb-8 break-inside-avoid">
              <h2 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${isDarkMode ? 'text-brand-100' : 'text-gray-800'}`}>Overview</h2>
              <SummaryCards stats={overallStats} />
            </div>

            {/* Section: Account Breakdown */}
            <div className="mb-8 break-inside-avoid">
              <AccountBreakdown accounts={accountStats} />
            </div>

            {/* Section: SKU Detail */}
            <div className="break-inside-auto">
               <SkuTable data={skuData} />
            </div>
          </>
        )}

      </main>
      
      {/* Mobile Sticky Footer Actions */}
      <div className={`fixed bottom-0 left-0 right-0 border-t p-4 sm:hidden flex justify-between gap-3 z-40 no-print transition-colors duration-200 ${isDarkMode ? 'bg-gray-850 border-gray-700' : 'bg-white border-brand-200'}`}>
           <button
            onClick={toggleTheme}
            className={`p-2 rounded-full flex-shrink-0 transition-colors duration-200 ${isDarkMode ? 'text-brand-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-brand-50'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={handleExportCSV}
             className={`flex-1 inline-flex justify-center items-center px-3 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none transition-colors duration-200 ${isDarkMode ? 'bg-gray-750 border-gray-600 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-brand-50'}`}
          >
            CSV
          </button>
          <button 
            onClick={handleExportPDF}
            className={`flex-1 inline-flex justify-center items-center px-3 py-2 border shadow-sm text-sm font-medium rounded-md transition-colors duration-200 bg-gradient-to-r from-brand-600 to-cyan-600 border-transparent text-white hover:from-brand-700 hover:to-cyan-700`}
          >
            PDF
          </button>
      </div>

    </div>
  );
};

export default App;
