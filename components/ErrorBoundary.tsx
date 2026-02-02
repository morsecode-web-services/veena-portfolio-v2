'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component error occurs
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      if (fallback) return fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-900">
            <div className="mb-4">
              <svg className="w-12 h-12 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-sm text-red-700 mb-4">We encountered an error while displaying this content. Please try refreshing the page.</p>
            {error && (
              <details className="text-left mb-4">
                <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800 font-medium">Technical details</summary>
                <pre className="mt-2 text-[10px] text-red-800 bg-red-100 p-2 rounded overflow-auto max-h-32 font-mono">{error.message}</pre>
              </details>
            )}
            <button onClick={this.handleReset} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-bold uppercase tracking-widest">Try Again</button>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Section-specific error boundary with minimal styling
 */
export function SectionErrorBoundary({ children, sectionName }: { children: ReactNode; sectionName: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="py-12 px-4 text-center">
          <div className="max-w-md mx-auto bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-700 mb-2">
              Unable to load the {sectionName} section
            </p>
            <p className="text-sm text-gray-500">
              Please refresh the page or try again later
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
