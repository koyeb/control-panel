import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

import { GithubOAuthButton } from './components/github-oauth-button';
import { SignInForm } from './components/sign-in-form';
import { Separator } from './separator';

const T = createTranslate('pages.authentication.signIn');

export function SignInPage() {
  return (
    <div className="mx-auto w-full max-w-72 text-center">
      <h1 className="text-3xl font-semibold">
        <T id="title" />
      </h1>

      <div className="mt-2 font-medium text-[#363533]">
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
    <p className="mt-6 text-center text-xs text-[#6B6965]">
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
    <p className="mt-1 text-center text-xs text-[#6B6965]">
      <T id="forgotPasswordLink" values={{ link }} />
    </p>
  );
}
