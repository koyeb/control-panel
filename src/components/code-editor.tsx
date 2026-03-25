import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';
import clsx from 'clsx';

import { useThemeModeOrPreferred } from 'src/hooks/theme';

type CodeEditorProps = {
  id?: string;
  autoFocus?: boolean;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CodeEditor({ className, ...props }: CodeEditorProps) {
  const theme = useThemeModeOrPreferred();

  return (
    <CodeMirror
      {...props}
      height="200px"
      theme={theme === 'light' ? githubLight : githubDark}
      className={clsx('overflow-hidden rounded-sm border', className)}
      minHeight="100%"
    />
  );
}
