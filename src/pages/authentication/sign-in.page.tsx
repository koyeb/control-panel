import { routes } from 'src/application/routes';
import { DocumentTitle } from 'src/components/document-title';
import { Link } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

import { GithubOAuthButton } from './components/github-oauth-button';
import { SignInForm } from './components/sign-in-form';
import { Separator } from './separator';

const T = createTranslate('pages.authentication.signIn');

export function SignInPage() {
  const t = T.useTranslate();

  return (
    <div className="col mx-auto w-full max-w-72 flex-1 justify-center py-8 text-center">
      <DocumentTitle title={t('title')} />

      <h1 className="text-3xl font-semibold">
        <T id="title" />
      </h1>

      <div className="mt-2 font-medium text-default/80">
        <T id="subtitle" />
      </div>

      <GithubOAuthButton action="signin" className="mt-12">
        <T id="githubSignIn" />
      </GithubOAuthButton>

      <Separator />

      <SignInForm />

      <SignUpLink />
      <PasswordResetLink />
    </div>
  );
}

function SignUpLink() {
  const link = (children: React.ReactNode[]) => (
    <Link href={routes.signUp()} className="text-default underline">
      {children}
    </Link>
  );

  return (
    <p className="mt-6 text-center text-xs text-dim">
      <T id="signUpLink" values={{ link }} />
    </p>
  );
}

function PasswordResetLink() {
  const link = (children: React.ReactNode[]) => (
    <Link href={routes.resetPassword()} className="text-default underline">
      {children}
    </Link>
  );

  return (
    <p className="mt-1 text-center text-xs text-dim">
      <T id="forgotPasswordLink" values={{ link }} />
    </p>
  );
}
