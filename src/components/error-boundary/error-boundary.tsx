import { Component, ErrorInfo, ReactNode } from 'react';
import { z } from 'zod';

import { isApiError } from 'src/api/api-errors';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { reportError } from 'src/application/report-error';

import { AccountLocked } from './account-locked';
import { ErrorView } from './error-view';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  accountLocked: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    errorInfo: null,
    accountLocked: false,
  };

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (isAccountLockedError(error)) {
      this.setState({ accountLocked: true });
    } else {
      reportError(error);
      this.setState({ error, errorInfo });
    }
  }

  render(): ReactNode {
    const { error, accountLocked } = this.state;

    if (accountLocked) {
      return <AccountLocked />;
    }

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

const isAccountLockedError = createValidationGuard(
  z.object({
    status: z.literal(403),
    message: z.literal('Account is locked'),
  }),
);
