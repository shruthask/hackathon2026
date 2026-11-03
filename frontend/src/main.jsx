import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lantern React ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '600px', width: '100%', backgroundColor: '#ffffff', border: '1px solid #fecdd3', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', fontSize: '20px' }}>⚠️</div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#9f1239', margin: 0 }}>Application Render Notice</h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>An unexpected error occurred during rendering.</p>
              </div>
            </div>
            <pre style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', lineHeight: '1.5', fontFamily: 'monospace' }}>
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#f28c28', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
