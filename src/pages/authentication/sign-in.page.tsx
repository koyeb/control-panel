import { useAuthKit } from 'src/application/authkit';
import { DocumentTitle } from 'src/components/document-title';
import { Link } from 'src/components/link';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

import { GithubOAuthButton } from './components/github-oauth-button';
import { SignInForm } from './components/sign-in-form';
import { Separator } from './separator';

const T = createTranslate('pages.authentication.signIn');

export function SignInPage() {
  const t = T.useTranslate();
  const next = useSearchParams().get('next');

  return (
    <div className="mx-auto col w-full max-w-72 flex-1 justify-center py-8 text-center">
      <DocumentTitle title={t('title')} />

      <h1 className="text-3xl font-semibold">
        <T id="title" />
      </h1>

      <div className="mt-2 font-medium text-default/80">
        <T id="subtitle" />
      </div>

      <GithubOAuthButton action="signin" metadata={next ?? undefined} className="mt-12">
        <T id="githubSignIn" />
      </GithubOAuthButton>

      <Separator />

      <SignInForm redirect={next ?? '/'} />

      <SignUpLink />
      <PasswordResetLink />
    </div>
  );
}

function SignUpLink() {
  const authKit = useAuthKit();

  const link = (children: React.ReactNode[]) => (
    <FeatureFlag
      feature="work-os"
      fallback={
        <Link to="/auth/signup" className="text-default underline">
          {children}
        </Link>
      }
    >
      <button type="button" onClick={() => void authKit.signUp()} className="text-default underline">
        {children}
      </button>
    </FeatureFlag>
  );

  return (
    <p className="mt-6 text-center text-xs text-dim">
      <T id="signUpLink" values={{ link }} />
    </p>
  );
}

function PasswordResetLink() {
  const link = (children: React.ReactNode[]) => (
    <Link to="/auth/reset-password" className="text-default underline">
      {children}
    </Link>
  );

  return (
    <p className="mt-1 text-center text-xs text-dim">
      <T id="forgotPasswordLink" values={{ link }} />
    </p>
  );
}
