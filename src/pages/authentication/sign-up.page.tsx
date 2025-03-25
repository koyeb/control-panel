import { routes } from 'src/application/routes';
import { DocumentTitle } from 'src/components/document-title';
import { IconMail } from 'src/components/icons';
import { ExternalLink, Link } from 'src/components/link';
import { useSearchParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

import { GithubOAuthButton } from './components/github-oauth-button';
import { SignUpForm } from './components/sign-up-form';
import { Separator } from './separator';

const T = createTranslate('pages.authentication.signUp');

export function SignUpPage() {
  const t = T.useTranslate();
  const [method, setMethod] = useSearchParam('method');

  return (
    <div className="col flex-1">
      <DocumentTitle title={t('title')} />

      <div className="col mx-auto w-full max-w-72 flex-1 justify-center py-8 text-center">
        <h1 className="text-3xl font-semibold">
          <T id="title" />
        </h1>

        <div className="mt-2 font-medium text-default/80">
          <T id="subtitle" />
        </div>

        <GithubOAuthButton action="signin" className="mt-12">
          <T id="githubSignUp" />
        </GithubOAuthButton>

        <Separator />

        {method === 'email' && <SignUpForm />}

        {method === null && (
          <button type="button" className="row mx-auto items-center gap-1" onClick={() => setMethod('email')}>
            <IconMail className="size-4" /> <T id="emailSignUp" />
          </button>
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
    <Link href={routes.signIn()} className="text-default underline">
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
    <ExternalLink openInNewTab href="https://www.koyeb.com/docs/legal/terms" className="underline">
      {children}
    </ExternalLink>
  );

  const privacy = (children: React.ReactNode) => (
    <ExternalLink
      openInNewTab
      href="https://www.koyeb.com/docs/legal/data-processing-agreement"
      className="underline"
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
    <ExternalLink href="https://policies.google.com/privacy" className="underline">
      {children}
    </ExternalLink>
  );

  const terms = (children: React.ReactNode) => (
    <ExternalLink href="https://policies.google.com/terms" className="underline">
      {children}
    </ExternalLink>
  );

  return (
    <p className="mt-2 text-center text-xs">
      <T id="reCAPTCHA" values={{ privacy, terms }} />
    </p>
  );
}
