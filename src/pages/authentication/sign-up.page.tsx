import { DocumentTitle } from 'src/components/document-title';
import { ExternalLink, Link } from 'src/components/link';
import { useSearchParams } from 'src/hooks/router';
import { IconMail } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { GithubOAuthButton } from './components/github-oauth-button';
import { SignUpForm } from './components/sign-up-form';
import { Separator } from './separator';

const T = createTranslate('pages.authentication.signUp');

export function SignUpPage() {
  const t = T.useTranslate();

  const params = useSearchParams();
  const next = params.get('next');
  const method = params.get('method');

  return (
    <div className="col flex-1">
      <DocumentTitle title={t('title')} />

      <div className="mx-auto col w-full max-w-90 flex-1 justify-center py-8 text-center">
        <h1 className="text-3xl font-semibold">
          <T id="title" />
        </h1>

        <div className="mt-2 font-medium text-default/80">
          <T id="subtitle" />
        </div>

        <GithubOAuthButton action="signup" metadata={next ?? undefined} className="mt-12">
          <T id="githubSignUp" />
        </GithubOAuthButton>

        <Separator />

        {method === 'email' && (
          <SignUpForm
            initialValues={{
              name: params.get('name'),
              email: params.get('email'),
            }}
          />
        )}

        {method === null && (
          <Link to="/auth/signup" search={{ method: 'email' }} className="mx-auto row items-center gap-1">
            <IconMail className="size-4" /> <T id="emailSignUp" />
          </Link>
        )}

        <SignInLink />
        <TermsOfServices />
      </div>

      {method === 'email' && <ReCaptcha />}
    </div>
  );
}

function SignInLink() {
  const link = (children: React.ReactNode) => (
    <Link to="/auth/signin" className="font-medium text-default">
      {children}
    </Link>
  );

  return (
    <p className="mt-6 text-center text-xs text-dim">
      <T id="signInLink" values={{ link }} />
    </p>
  );
}

function TermsOfServices() {
  const tos = (children: React.ReactNode) => (
    <ExternalLink openInNewTab href="https://www.koyeb.com/docs/legal/terms" className="font-medium">
      {children}
    </ExternalLink>
  );

  const privacy = (children: React.ReactNode) => (
    <ExternalLink
      openInNewTab
      href="https://www.koyeb.com/docs/legal/data-processing-agreement"
      className="font-medium"
    >
      {children}
    </ExternalLink>
  );

  return (
    <p className="mt-8 text-xs leading-normal">
      <T id="agreements" values={{ tos, privacy }} />
    </p>
  );
}

function ReCaptcha() {
  const privacy = (children: React.ReactNode) => (
    <ExternalLink href="https://policies.google.com/privacy" className="font-medium">
      {children}
    </ExternalLink>
  );

  const terms = (children: React.ReactNode) => (
    <ExternalLink href="https://policies.google.com/terms" className="font-medium">
      {children}
    </ExternalLink>
  );

  return (
    <p className="mt-2 text-center text-xs">
      <T id="reCAPTCHA" values={{ privacy, terms }} />
    </p>
  );
}
