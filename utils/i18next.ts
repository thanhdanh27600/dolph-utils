import { TOptions } from 'i18next';
import { useTranslation } from 'next-i18next';
import common from 'public/locales/vi/common.json';
import { UseTranslationOptions } from 'react-i18next';
import { Locale, Locales, locales } from 'types/locale';

export type LanguageNamespaces = {
  common: keyof typeof common;
};

export type SingleNamespace<K extends keyof LanguageNamespaces> = LanguageNamespaces[K];

export function useTrans<K extends keyof LanguageNamespaces>(namespace?: K | K[], options?: UseTranslationOptions) {
  const { t, i18n } = useTranslation(namespace, options);
  const locale: Locale = locales[i18n.language as Locales];
  return {
    t: (key: SingleNamespace<K>, options?: object | TOptions) => t(key, options || {}),
    i18n,
    locale,
  };
}
