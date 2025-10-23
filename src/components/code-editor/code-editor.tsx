import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';
import clsx from 'clsx';

import { useThemeModeOrPreferred } from 'src/hooks/theme';

import { Combobox } from '../forms/combobox';

import { type CodeEditor } from './use-code-editor';

type CodeEditorProps = {
  editor: CodeEditor;
  id?: string;
  autoFocus?: boolean;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CodeEditor({ editor, className, ...props }: CodeEditorProps) {
  const theme = useThemeModeOrPreferred();

  return (
    <CodeMirror
      {...props}
      height="200px"
      theme={theme === 'light' ? githubLight : githubDark}
      extensions={editor.extensions}
      className={clsx('overflow-hidden rounded border', className)}
      minHeight="100%"
    />
  );
}

type CodeEditorLanguageSelectProps = {
  codeEditor: CodeEditor;
  placeholder?: string;
};

export function CodeEditorLanguageSelect({ codeEditor, placeholder }: CodeEditorLanguageSelectProps) {
  return (
    <Combobox
      items={codeEditor.filteredLanguages}
      getKey={codeEditor.getLanguageName}
      itemToString={codeEditor.getLanguageName}
      renderItem={codeEditor.getLanguageName}
      onInputValueChange={codeEditor.onSearch}
      onClosed={codeEditor.onLanguageSelectorClosed}
      value={codeEditor.selectedLanguage}
      onChange={codeEditor.onLanguageSelected}
      placeholder={placeholder}
      size={1}
    />
  );
}
