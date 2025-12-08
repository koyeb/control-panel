import { useAuth } from '@workos-inc/authkit-react';

import { DocumentTitle } from 'src/components/document-title';
import { useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

import { AuthButton } from './components/auth-button';
import { SignInForm } from './components/sign-in-form';
import { Separator } from './separator';

const T = createTranslate('pages.authentication.signIn');

export function SignInPage() {
  const t = T.useTranslate();
  const next = useSearchParams().get('next');
  const authKit = useAuth();

  return (
    <div className="mx-auto col w-full max-w-90 flex-1 justify-center py-8 text-center">
      <DocumentTitle title={t('title')} />

      <h1 className="text-3xl font-semibold">
        <T id="title" />
      </h1>

      <div className="mt-2 mb-10 font-medium text-default/80">
        <T id="subtitle" />
      </div>

      <SignInForm redirect={next ?? '/'} />

      <Separator />

      <AuthButton type="button" onClick={() => void authKit.signIn({ state: { next } })}>
        <T id="otherOptions" />
      </AuthButton>

      <SignUpLink />
    </div>
  );
}

function SignUpLink() {
  const authKit = useAuth();

  const link = (children: React.ReactNode[]) => (
    <button type="button" onClick={() => void authKit.signUp()} className="font-medium text-default">
      {children}
    </button>
  );

  return (
    <p className="mt-6 text-center text-xs text-dim">
      <T id="signUpLink" values={{ link }} />
    </p>
  );
}
