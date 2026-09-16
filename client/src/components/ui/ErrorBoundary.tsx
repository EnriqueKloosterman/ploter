import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-surface text-slate-300 p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Algo salio mal</h2>
            <p className="text-sm text-slate-400">
              {this.state.error?.message || 'Ocurrio un error inesperado en la interfaz.'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-2 bg-accent hover:bg-accent-strong text-white font-medium rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
