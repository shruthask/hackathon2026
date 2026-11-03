import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InputSection from './components/InputSection';
import ResultsDashboard from './components/ResultsDashboard';
import BeforeAfterComparison from './components/BeforeAfterComparison';
import ManualTestingGuide from './components/ManualTestingGuide';
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
  const [activeView, setActiveView] = useState('console'); // 'console', 'how-it-works', 'guidelines', 'manual-testing', 'compare'
  const [backendStatus, setBackendStatus] = useState({ ok: false, checked: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const inputSectionRef = useRef(null);

  // Input states
  const [inputCode, setInputCode] = useState(SAMPLES[0]?.html || '');
  const [inputUrl, setInputUrl] = useState('https://example.com');
  const [selectedSampleId, setSelectedSampleId] = useState('broken-bakery');

  // Verify backend health on mount and periodically
  const verifyHealth = async () => {
    const res = await checkBackendHealth();
    setBackendStatus({ ok: res.ok, checked: true, data: res.data, error: res.error });
  };

  useEffect(() => {
    verifyHealth();
    const timer = setInterval(verifyHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  // Run initial scan of default sample so results dashboard is populated
  useEffect(() => {
    const initialRun = async () => {
      if (SAMPLES[0]?.html) {
        try {
          setIsLoading(true);
          const res = await scanHtml(SAMPLES[0].html);
          setReport(res);
        } catch (err) {
          console.warn('Initial background scan skipped (backend might still be starting):', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    initialRun();
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
          <div className="space-y-12">
            
            {/* Developer-First Hero Banner */}
            <Hero 
              onSelectSample={handleSelectSample} 
              onStartAudit={handleStartAuditClick}
            />

            {/* Input Section ("Three Front Doors") */}
            <div ref={inputSectionRef}>
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
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
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
          <Guidelines />
        )}

        {/* Manual Testing Guide View */}
        {activeView === 'manual-testing' && (
          <ManualTestingGuide />
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
