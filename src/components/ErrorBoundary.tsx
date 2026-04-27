import { Component, type ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-screen">
          <div className="error-card">
            <ExclamationTriangleIcon className="error-icon" />
            <div className="error-title">Something went wrong</div>
            <div className="error-message">{this.state.error.message}</div>
            <button className="btn-primary" onClick={() => this.setState({ error: null })}>
              <ArrowPathIcon style={{ width: 16, height: 16 }} /> Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
