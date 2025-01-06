import { routes } from 'src/application/routes';
import { ExternalLink, Link } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

import { GithubOAuthButton } from './components/github-oauth-button';
import { SignInForm } from './components/sign-in-form';

const T = createTranslate('pages.authentication.signIn');

export function SignInPage() {
  return (
    <div className="col gap-8">
      <h1 className="text-center text-3xl font-semibold">
        <T id="title" />
      </h1>

      <GithubOAuthButton action="signin">
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
    <div className="row items-center justify-center">
      <Hr />

      <span className="px-2 text-xs uppercase">
        <T id="or" />
      </span>

      <Hr />
    </div>
  );
}

function Hr() {
  return (
    <div className="flex-1">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 1">
        <line
          x1="0"
          y1="0"
          x2="100%"
          y2="0"
          stroke="currentColor"
          strokeOpacity="0.4"
          strokeDasharray="2 6"
        />
      </svg>
    </div>
  );
}

function Links() {
  const signUp = (children: React.ReactNode[]) => (
    <Link href={routes.signUp()} className="text-link">
      {children}
    </Link>
  );

  const forgotPassword = (children: React.ReactNode[]) => (
    <Link href={routes.resetPassword()} className="text-link">
      {children}
    </Link>
  );

  const community = (children: React.ReactNode[]) => (
    <ExternalLink href="https://community.koyeb.com" className="text-link !text-default">
      {children}
    </ExternalLink>
  );

  return (
    <div className="col gap-4 text-center text-xs">
      <p className="text-dim">
        <T id="signUpLink" values={{ link: signUp }} />
      </p>

      <p>
        <T id="forgotPasswordLink" values={{ link: forgotPassword }} />
      </p>

      <p>
        <T id="communityLink" values={{ link: community }} />
      </p>
    </div>
  );
}
