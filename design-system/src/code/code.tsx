import { useEffect, useState } from 'react';
import { createHighlighterCore, HighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

export type CodeLang = 'dotenv' | 'javascript' | 'json' | 'python' | 'go' | 'prisma' | 'text' | 'yaml';
type Theme = 'light' | 'dark';

type CodeProps = {
  lang: CodeLang;
  theme: Theme;
  value: string;
  className?: string;
};

export function Code({ lang, theme, value, className }: CodeProps) {
  const highlighter = useHighlighter();
  const [html, setHtml] = useState<string>();

  useEffect(() => {
    const html = highlighter?.codeToHtml(value, {
      lang,
      theme: `github-${theme}`,
      colorReplacements: {
        '#fff': 'transparent',
        '#24292e': 'transparent',
      },
    });

    setHtml(html);
  }, [lang, theme, value, highlighter]);

  if (html === undefined) {
    return null;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} className={className} />;
}

function useHighlighter() {
  const [highlighter, setHighlighter] = useState<HighlighterCore>();

  useEffect(() => {
    createHighlighterCore({
      themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
      langs: [
        import('shiki/langs/dotenv.mjs'),
        import('shiki/langs/javascript.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/python.mjs'),
        import('shiki/langs/go.mjs'),
        import('shiki/langs/prisma.mjs'),
        import('shiki/langs/yaml.mjs'),
      ],
      engine: createOnigurumaEngine(import('shiki/wasm')),
      // eslint-disable-next-line no-console
    }).then(setHighlighter, console.error);
  }, []);

  return highlighter;
}

export function Json({ theme, value, className }: { theme: Theme; value?: unknown; className?: string }) {
  return <Code lang="json" theme={theme} value={JSON.stringify(value, null, 2)} className={className} />;
}
