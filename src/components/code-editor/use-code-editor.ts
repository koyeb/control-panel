import { langs } from '@uiw/codemirror-extensions-langs';
import { useEffect, useState } from 'react';

import { last, unique } from 'src/utils/arrays';

const languageItems = unique(
  Object.values(langs).map((lang) => lang()),
  getLanguageName,
);

export type CodeEditor = ReturnType<typeof useCodeEditor>;

export function useCodeEditor(filepath: string) {
  const filename = last(filepath.split('/'));
  const extension = last((filename ?? '')?.split('.'));

  const [selectedLanguage, setSelectedLanguage] = useState(getLanguage('txt'));
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>(languageItems);

  useEffect(() => {
    const language = getLanguage(extension ?? 'txt');

    if (language) {
      setSelectedLanguage(language);
    }
  }, [extension]);

  return {
    extensions: selectedLanguage ? [selectedLanguage] : [],
    selectedLanguage,
    filteredLanguages,
    getLanguageName,
    onLanguageSelected: setSelectedLanguage,
    onSearch: (search: string, isSelected: boolean) => {
      if (isSelected) {
        setFilteredLanguages(languageItems);
      } else {
        setFilteredLanguages(languageItems.filter((language) => getLanguageName(language).includes(search)));
      }
    },
  };
}

type Language = NonNullable<ReturnType<typeof getLanguage>>;

function getLanguage(lang: string) {
  const languageFn = langs[lang];

  if (languageFn) {
    return languageFn();
  }
}

function getLanguageName(lang: Language) {
  if ('language' in lang) {
    return lang.language.name;
  }

  return lang.name;
}
