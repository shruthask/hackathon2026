import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InputSection from './components/InputSection';
import ResultsDashboard from './components/ResultsDashboard';
import BeforeAfterComparison from './components/BeforeAfterComparison';
import HowItWorks from './components/HowItWorks';
import Guidelines from './components/Guidelines';
import Footer from './components/Footer';
import { 
  checkBackendHealth, 
  scanHtml, 
  scanUrl, 
  scanFile, 
  fetchLatestAudit 
} from './utils/api';
import { SAMPLES } from './utils/samples';

export default function App() {
  const [activeView, setActiveView] = useState('console'); // 'console', 'how-it-works', 'guidelines', 'compare'
  const [backendStatus, setBackendStatus] = useState({ ok: false, checked: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const inputSectionRef = useRef(null);

  // Input states
  const [inputCode, setInputCode] = useState('');
  const [inputUrl, setInputUrl] = useState('https://example.com');
  const [selectedSampleId, setSelectedSampleId] = useState(null);

  // Verify backend health on mount and periodically
  const verifyHealth = async () => {
    const res = await checkBackendHealth();
    setBackendStatus({ ok: res.ok, checked: true, data: res.data, error: res.error });
  };

  useEffect(() => {
    verifyHealth();
    const timer = setInterval(verifyHealth, 15000);

    // Check for extension redirect or stored live audit
    const checkExtensionSync = async () => {
      const params = new URLSearchParams(window.location.search);
      const isFromExtension = params.get('source') === 'extension';

      // 1. Try reading directly from localStorage
      const storedReport = localStorage.getItem('lantern_extension_report');
      if (storedReport) {
        try {
          const parsed = JSON.parse(storedReport);
          setReport(parsed);
          setActiveView('console');
          if (isFromExtension) {
            setTimeout(() => {
              document.getElementById('results-dashboard')?.scrollIntoView({ behavior: 'smooth' });
            }, 250);
          }
          return;
        } catch (e) {
          console.warn('Failed to parse lantern_extension_report from localStorage', e);
        }
      }

      // 2. Fallback: fetch latest synced report from backend
      if (isFromExtension) {
        try {
          const latest = await fetchLatestAudit();
          if (latest) {
            setReport(latest);
            setActiveView('console');
            setTimeout(() => {
              document.getElementById('results-dashboard')?.scrollIntoView({ behavior: 'smooth' });
            }, 250);
          }
        } catch (err) {
          console.error('Could not fetch latest audit from backend:', err);
        }
      }
    };

    checkExtensionSync();

    // Listen for real-time live audit injection event from extension
    const handleReportEvent = (e) => {
      if (e.detail) {
        setReport(e.detail);
        setActiveView('console');
        setTimeout(() => {
          document.getElementById('results-dashboard')?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    };

    window.addEventListener('lantern-report-loaded', handleReportEvent);

    return () => {
      clearInterval(timer);
      window.removeEventListener('lantern-report-loaded', handleReportEvent);
    };
  }, []);

  // Handlers for scanning
  const handleScanHtml = async (html) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await scanHtml(html);
      setReport(res);
      setActiveView('console');
    } catch (err) {
      setError(err.message || 'Failed to scan HTML. Make sure the backend server is running on http://localhost:8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanUrl = async (url) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await scanUrl(url);
      setReport(res);
      setActiveView('console');
    } catch (err) {
      setError(err.message || 'Failed to scan URL. Please verify the URL and backend network access.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanFile = async (file) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await scanFile(file);
      setReport(res);
      setActiveView('console');
    } catch (err) {
      setError(err.message || 'Failed to scan uploaded file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncLatestAudit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const latest = await fetchLatestAudit();
      if (!latest) {
        setError('No in-browser audit reports found in backend. Trigger a scan from the Lantern Chrome Extension first!');
      } else {
        setReport(latest);
        setActiveView('console');
      }
    } catch (err) {
      setError(err.message || 'Failed to sync latest audit report from extension.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSample = async (sampleId) => {
    const sample = SAMPLES.find(s => s.id === sampleId);
    if (!sample) return;
    setInputCode(sample.html);
    setSelectedSampleId(sampleId);
    setActiveView('console');
    await handleScanHtml(sample.html);
  };

  const handleApplyReport = (appliedReport) => {
    setReport(appliedReport);
    setActiveView('console');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleStartAuditClick = () => {
    setActiveView('console');
    setTimeout(() => {
      inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Navigation matching user's reference design */}
      <Navbar
        backendStatus={backendStatus}
        onRefreshHealth={verifyHealth}
        activeView={activeView}
        setActiveView={setActiveView}
        onStartAudit={handleStartAuditClick}
      />

      <main className="flex-1">
        
        {/* Scan Console View */}
        {activeView === 'console' && (
          <div>
            
            {/* Developer-First Full Viewport Hero */}
            <Hero 
              onSelectSample={handleSelectSample} 
              onStartAudit={handleStartAuditClick}
            />

            {/* Input Section with Smooth Gradient Bridge from Hero Deep Blue to Slate-50 White */}
            <div 
              ref={inputSectionRef}
              className="relative pt-10 sm:pt-14 pb-16 sm:pb-20 transition-all"
              style={{
                background: 'linear-gradient(180deg, #070D1E 0%, #0C1838 14%, #152756 28%, #294074 44%, #556E9D 60%, #95A9CA 75%, #D6DFEE 88%, #F8FAFC 100%)'
              }}
            >
              <InputSection
                onScanUrl={handleScanUrl}
                onScanHtml={handleScanHtml}
                onScanFile={handleScanFile}
                onSyncLatestAudit={handleSyncLatestAudit}
                isLoading={isLoading}
                error={error}
                inputCode={inputCode}
                setInputCode={setInputCode}
                inputUrl={inputUrl}
                setInputUrl={setInputUrl}
                selectedSampleId={selectedSampleId}
                setSelectedSampleId={setSelectedSampleId}
              />
            </div>

            {/* Results Dashboard */}
            <section id="results-dashboard" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
              {report ? (
                <ResultsDashboard
                  report={report}
                  onRescan={() => handleScanHtml(inputCode)}
                  onOpenCompareWithCurrent={(currentReport) => setActiveView('compare')}
                />
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                  <p className="text-sm font-semibold text-slate-500">
                    Enter code, a URL, or an HTML file above to view the accessibility audit.
                  </p>
                </div>
              )}
            </section>

          </div>
        )}

        {/* How It Works View */}
        {activeView === 'how-it-works' && (
          <HowItWorks onGoToConsole={() => setActiveView('console')} />
        )}

        {/* Guidelines View */}
        {activeView === 'guidelines' && (
          <Guidelines onGoToConsole={() => setActiveView('console')} />
        )}

        {/* Before and After Comparison View */}
        {activeView === 'compare' && (
          <BeforeAfterComparison onApplyReport={handleApplyReport} />
        )}

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
