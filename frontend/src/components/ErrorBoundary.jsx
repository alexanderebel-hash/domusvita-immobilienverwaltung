import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full border border-red-200 bg-red-50 rounded-lg p-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl">!</div>
            <h2 className="text-lg font-semibold text-red-800 mb-2">Ein Fehler ist aufgetreten</h2>
            <p className="text-sm text-red-600 mb-4">Die Anwendung konnte diese Ansicht nicht laden.</p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="p-3 bg-red-100 rounded text-xs font-mono text-red-800 mb-4 overflow-auto max-h-32 text-left">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-100 text-sm"
              >
                Erneut versuchen
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Seite neu laden
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
