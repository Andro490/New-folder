import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: 'black', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ff4444' }}>Something went wrong!</h1>
          <p>Please take a screenshot of this error and send it to the developer:</p>
          <div style={{ background: '#222', padding: 10, borderRadius: 5, marginTop: 10, overflowX: 'auto' }}>
            <h3 style={{ color: '#ff8888', marginTop: 0 }}>{this.state.error?.toString()}</h3>
            <pre style={{ fontSize: 12, color: '#aaa', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.stack}
            </pre>
            <hr style={{ borderColor: '#444' }} />
            <pre style={{ fontSize: 12, color: '#888', whiteSpace: 'pre-wrap' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, padding: '10px 20px', background: '#f5c842', color: 'black', border: 'none', fontWeight: 'bold', borderRadius: 5 }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
