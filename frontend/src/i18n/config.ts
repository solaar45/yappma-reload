import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import deTranslation from './locales/de/translation.json';
import enTranslation from './locales/en/translation.json';
import trTranslation from './locales/tr/translation.json';

i18n
  .use(LanguageDetector) // Detects browser language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      de: {
        translation: deTranslation,
      },
      en: {
        translation: enTranslation,
      },
      tr: {
        translation: trTranslation,
      },
    },
    fallbackLng: 'de', // Default to German
    debug: false, // Set to true for development debugging
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      // Cache user language preference
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
