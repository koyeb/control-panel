import { routes } from 'src/application/routes';
import { ExternalLink, Link } from 'src/components/link';
import { useSearchParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

import { GithubOAuthButton } from './components/github-oauth-button';
import { SignUpForm } from './components/sign-up-form';

const T = createTranslate('pages.authentication.signUp');

export function SignUpPage() {
  const [method, setMethod] = useSearchParam('method');

  return (
    <div className="col gap-8">
      <h1 className="text-center text-3xl font-semibold">
        <T id="title" />
      </h1>

      {method === null && (
        <>
          <GithubOAuthButton action="signup">
            <T id="githubSignUp" />
          </GithubOAuthButton>

          <button type="button" onClick={() => setMethod('email')} className="text-link self-center text-xs">
            <T id="emailSignUp" />
          </button>
        </>
      )}

      {method === 'email' && (
        <>
          <SignUpForm />

          <button type="button" onClick={() => setMethod(null)} className="text-link self-center text-xs">
            <T id="githubSignUp" />
          </button>
        </>
      )}

      <p className="text-center text-xs">
        <T
          id="signInLink"
          values={{
            link: (children) => (
              <Link href={routes.signIn()} className="text-link">
                {children}
              </Link>
            ),
          }}
        />
      </p>

      <p className="fixed bottom-4 ml-8 text-xs text-dim">
        <T
          id="agreements"
          values={{
            tos: (children) => (
              <ExternalLink openInNewTab href="https://www.koyeb.com/docs/legal/terms" className="text-link">
                {children}
              </ExternalLink>
            ),
            privacy: (children) => (
              <ExternalLink
                openInNewTab
                href="https://www.koyeb.com/docs/legal/data-processing-agreement"
                className="text-link"
              >
                {children}
              </ExternalLink>
            ),
          }}
        />
      </p>
    </div>
  );
}
