import React, { useState, useRef } from 'react';
import { 
  Globe, 
  Code, 
  Upload, 
  Loader2, 
  Sparkles, 
  Trash2, 
  Play, 
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { SAMPLES } from '../utils/samples';

export default function InputSection({ 
  onScanUrl, 
  onScanHtml, 
  onScanFile, 
  onSyncLatestAudit, 
  isLoading, 
  error,
  inputCode,
  setInputCode,
  inputUrl,
  setInputUrl,
  selectedSampleId,
  setSelectedSampleId
}) {
  const [activeTab, setActiveTab] = useState('html'); // 'url', 'html', 'file', 'sync'
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Quick sample selection handler
  const handleLoadSample = (sampleId) => {
    const sample = SAMPLES.find(s => s.id === sampleId);
    if (sample) {
      setInputCode(sample.html);
      setSelectedSampleId(sampleId);
      setActiveTab('html');
    }
  };

  // Submit handlers
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    onScanUrl(inputUrl);
  };

  const handleHtmlSubmit = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    onScanHtml(inputCode);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onScanFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.includes('html') || file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
      setSelectedFile(file);
      onScanFile(file);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 z-20 relative">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Navigation Tabs ("Three Front Doors") */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('html')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'html'
                ? 'bg-white text-amber-600 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Paste HTML Code</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'url'
                ? 'bg-white text-amber-600 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Scan Web URL</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'file'
                ? 'bg-white text-amber-600 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Audit Request Failed</p>
                <p className="text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* TAB 1: PASTE HTML */}
          {activeTab === 'html' && (
            <form onSubmit={handleHtmlSubmit}>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="html-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Raw HTML Document or Markup Fragment
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    {(inputCode || '').length.toLocaleString()} characters
                  </span>
                  {Boolean(inputCode) && (
                    <button
                      type="button"
                      onClick={() => { setInputCode(''); setSelectedSampleId(null); }}
                      className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Sample Selectors */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-slate-500">Insert Sample:</span>
                {SAMPLES.map(sample => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleLoadSample(sample.id)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
                      selectedSampleId === sample.id
                        ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sample.name}
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  id="html-input"
                  rows={8}
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    setSelectedSampleId(null);
                  }}
                  placeholder="Paste HTML here..."
                  className="w-full font-mono text-xs p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-500 leading-relaxed"
                />
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !(inputCode || '').trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 text-white font-bold text-sm shadow-md shadow-amber-600/20 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning Code...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Run Accessibility Audit
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ENTER URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit}>
              <label htmlFor="url-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Enter Web Page Address to Audit
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <input
                    type="url"
                    id="url-input"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                    className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !inputUrl.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 text-white font-bold text-sm shadow-md shadow-amber-600/20 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Scan URL
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Quick Test URLs:</span>
                <button
                  type="button"
                  onClick={() => setInputUrl('https://example.com')}
                  className="text-amber-600 hover:underline"
                >
                  example.com
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setInputUrl('https://w3.org/WAI/demos/bad/before/home.html')}
                  className="text-amber-600 hover:underline"
                >
                  W3C Before Demo
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: UPLOAD FILE */}
          {activeTab === 'file' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-amber-500 bg-amber-50/50' 
                    : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50'
                }`}
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Drag and drop your HTML file here
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Supports standard <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">.html</code> and <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">.htm</code> documents up to 10MB
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 shadow-xs hover:bg-slate-100">
                    Browse File from Computer
                  </span>
                </div>
              </div>

              {selectedFile && (
                <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                  <span className="font-mono font-medium">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  {isLoading && <span className="flex items-center gap-1 text-amber-600 font-semibold"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...</span>}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
