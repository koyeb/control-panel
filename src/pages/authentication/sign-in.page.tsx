import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

import { GithubOAuthButton } from './components/github-oauth-button';
import { SignInForm } from './components/sign-in-form';

const T = createTranslate('pages.authentication.signIn');

export function SignInPage() {
  return (
    <div className="mx-auto w-full max-w-72 text-center">
      <h1 className="text-3xl font-semibold">
        <T id="title" />
      </h1>

      <div className="mt-2 font-medium text-[#363533]">Back to work, back to building.</div>

      <GithubOAuthButton action="signin" className="mt-12">
        <T id="githubSignIn" />
      </GithubOAuthButton>

      <Separator />

      <SignInForm />

      <Links />
    </div>
  );
}

function Separator() {
  return (
    <div className="row my-6 items-center justify-center">
      <hr className="flex-1 border-[#9F9F9F]/30" />

      <span className="px-6 text-xs text-[#9F9F9F]">
        <T id="or" />
      </span>

      <hr className="flex-1 border-[#9F9F9F]/30" />
    </div>
  );
}

function Links() {
  const signUp = (children: React.ReactNode[]) => (
    <Link href={routes.signUp()} className="text-default underline">
      {children}
    </Link>
  );

  const forgotPassword = (children: React.ReactNode[]) => (
    <Link href={routes.resetPassword()} className="text-default underline">
      {children}
    </Link>
  );

  return (
    <>
      <p className="mt-6 text-center text-xs text-[#6B6965]">
        <T id="signUpLink" values={{ link: signUp }} />
      </p>

      <p className="mt-1 text-center text-xs text-[#6B6965]">
        <T id="forgotPasswordLink" values={{ link: forgotPassword }} />
      </p>
    </>
  );
}
