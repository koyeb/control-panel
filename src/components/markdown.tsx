import clsx from 'clsx';
import { JSX, useEffect, useState } from 'react';
import production from 'react/jsx-runtime';
import rehypeHighlight from 'rehype-highlight';
import rehypeReact from 'rehype-react';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import 'highlight.js/styles/github-dark.min.css';

import { CopyIconButton } from './copy-icon-button';

export default function Markdown({ content }: { content: string }) {
  const [element, setElement] = useState<JSX.Element | null>(null);

  useEffect(() => {
    void markdownToHtml(content).then(setElement);
  }, [content]);

  return <div className="prose max-w-none dark:prose-invert">{element}</div>;
}

function markdownToHtml(content: string) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeHighlight)
    .use(rehypeReact, { ...production, components })
    .process(content)
    .then(({ result }: { result: JSX.Element }) => result);
}

const components = {
  pre: Pre,
};

function Pre({ className, children, ...props }: React.ComponentProps<'pre'>) {
  const [text, setText] = useState<string>();

  return (
    <pre {...props} ref={(ref) => setText(ref?.innerText)} className={clsx(className, 'relative')}>
      {text && <CopyIconButton text={text} className="absolute top-4 right-4 size-4" />}
      {children}
    </pre>
  );
}
