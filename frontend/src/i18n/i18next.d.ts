import 'i18next';
import deTranslation from './locales/de/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof deTranslation;
    };
  }
}
