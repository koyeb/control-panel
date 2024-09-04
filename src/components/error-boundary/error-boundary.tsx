import { Component, ErrorInfo, ReactNode } from 'react';

import { isApiError } from 'src/api/api-errors';
import { reportError } from 'src/application/report-error';

import { ErrorView } from './error-view';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    errorInfo: null,
  };

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportError(error);
    this.setState({ error, errorInfo });
  }

  render(): ReactNode {
    const { error } = this.state;

    if (error) {
      const { status, code } = this.apiError ?? {};

      return (
        <ErrorView
          httpStatus={status}
          message={error.message}
          code={code}
          onReset={() => this.setState({ error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }

  private get apiError() {
    if (isApiError(this.state.error)) {
      return this.state.error;
    }
  }
}
