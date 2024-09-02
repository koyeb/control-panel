import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

export function Code({ lang, value, className }: { lang: string; value: string; className?: string }) {
  const [html, setHtml] = useState<string>();

  useEffect(() => {
    codeToHtml(value, {
      lang,
      theme: 'min-light',
      colorReplacements: { '#ffffff': 'transparent' },
      // eslint-disable-next-line no-console
    }).then(setHtml, console.error);
  }, [lang, value]);

  if (html === undefined) {
    return null;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} className={className} />;
}

export function Json({ value, className }: { value?: unknown; className?: string }) {
  return <Code lang="json" value={JSON.stringify(value, null, 2)} className={className} />;
}
