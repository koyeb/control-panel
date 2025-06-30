import { Autocomplete } from '@koyeb/design-system';
import { LanguageName, langNames, langs } from '@uiw/codemirror-extensions-langs';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { ThemeMode, useThemeModeOrPreferred } from 'src/hooks/theme';
import { identity } from 'src/utils/generic';

export type CodeEditorLanguage = LanguageName | 'plaintext';

type CodeEditorProps = {
  autoFocus?: boolean;
  language?: CodeEditorLanguage;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CodeEditor({ language, className, ...props }: CodeEditorProps) {
  const theme = useThemeModeOrPreferred();

  return (
    <CodeMirror
      {...props}
      height="200px"
      theme={theme === ThemeMode.light ? githubLight : githubDark}
      extensions={language && language !== 'plaintext' ? [langs[language]()] : []}
      className={clsx('overflow-hidden rounded border', className)}
      minHeight="100%"
    />
  );
}

type CodeEditorLanguageSelectProps = {
  placeholder?: string;
  value?: CodeEditorLanguage;
  onChange: (value: CodeEditorLanguage) => void;
};

export function CodeEditorLanguageSelect({ placeholder, value, onChange }: CodeEditorLanguageSelectProps) {
  const [filteredItems, setFilteredItems] = useState(langNames);

  useEffect(() => {
    setFilteredItems(langNames);
  }, [value]);

  return (
    <Autocomplete
      placeholder={placeholder}
      items={filteredItems}
      getKey={identity}
      itemToString={identity}
      renderItem={identity}
      onInputValueChange={(search, isItemSelected) => {
        setFilteredItems(isItemSelected ? langNames : langNames.filter((lang) => lang.includes(search)));
      }}
      selectedItem={value ?? null}
      onSelectedItemChange={(value) => {
        onChange(value);
        setFilteredItems(langNames);
      }}
      size={1}
    />
  );
}
