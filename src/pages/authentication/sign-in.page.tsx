import { useAuth } from '@workos-inc/authkit-react';

import { DocumentTitle } from 'src/components/document-title';
import { Link } from 'src/components/link';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

import { AuthButton } from './components/auth-button';
import { GithubOAuthButton } from './components/github-oauth-button';
import { SignInForm } from './components/sign-in-form';
import { Separator } from './separator';

const T = createTranslate('pages.authentication.signIn');

export function SignInPage() {
  const t = T.useTranslate();
  const next = useSearchParams().get('next');
  const { signIn } = useAuth();

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

      <FeatureFlag
        feature="workos-signup"
        fallback={
          <GithubOAuthButton action="signin" metadata={next ?? undefined}>
            <T id="githubSignIn" />
          </GithubOAuthButton>
        }
      >
        <AuthButton type="button" onClick={() => void signIn({ state: { next } })}>
          <T id="otherOptions" />
        </AuthButton>
      </FeatureFlag>

      <SignUpLink />
    </div>
  );
}

function SignUpLink() {
  const { signUp } = useAuth();

  const link = (children: React.ReactNode[]) => (
    <FeatureFlag
      feature="workos-signup"
      fallback={
        <Link to="/auth/signup" className="font-medium text-default">
          {children}
        </Link>
      }
    >
      <button type="button" onClick={() => void signUp()} className="font-medium text-default">
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
