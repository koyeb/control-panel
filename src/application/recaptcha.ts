import { getConfig } from './config';

type Grecaptcha = {
  ready(callback: () => void): void;
  execute(siteKey: string, params: unknown): Promise<string>;
};

declare global {
  interface Window {
    grecaptcha: Grecaptcha;
  }
}

export async function getCaptcha(action: 'signup') {
  const recaptchaClientKey = getConfig('recaptchaClientKey');

  if (recaptchaClientKey === undefined) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA is not loaded, please try again later or from another browser');
  }

  await new Promise<void>((resolve) => {
    window.grecaptcha.ready(resolve);
  });

  return window.grecaptcha.execute(recaptchaClientKey, { action });
}
