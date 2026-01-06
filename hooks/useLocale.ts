import { useState, useCallback } from 'react';

// Supported languages
export type Locale = 'en' | 'zh';

// Translation key structure
export interface Translations {
  [key: string]: string | Translations;
}

// Get nested value from translation object
const getNestedValue = (obj: Translations, path: string): string => {
  const keys = path.split('.');
  let current: string | Translations = obj;
  
  for (const key of keys) {
    if (typeof current === 'string') return path;
    if (current[key] === undefined) return path;
    current = current[key];
  }
  
  return typeof current === 'string' ? current : path;
};

// Translation cache
const translationCache: Record<Locale, Translations> = {
  en: {},
  zh: {},
};

// Load translations dynamically
const loadTranslations = async (locale: Locale): Promise<Translations> => {
  if (Object.keys(translationCache[locale]).length > 0) {
    return translationCache[locale];
  }

  try {
    // Dynamic import of locale files
    const modules = import.meta.glob('../locales/*/*.json', { eager: true });
    const translations: Translations = {};
    
    for (const [path, module] of Object.entries(modules)) {
      if (path.includes(`/${locale}/`)) {
        const fileName = path.split('/').pop()?.replace('.json', '') || '';
        translations[fileName] = (module as { default: Translations }).default;
      }
    }
    
    translationCache[locale] = translations;
    return translations;
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error);
    return {};
  }
};

// Default locale from localStorage or browser
const getDefaultLocale = (): Locale => {
  const stored = localStorage.getItem('wasteland_locale');
  if (stored === 'en' || stored === 'zh') return stored;
  
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
};

/**
 * useLocale hook for internationalization
 * 
 * Usage:
 * const { t, locale, setLocale } = useLocale();
 * t('common.startGame') // Returns translated string
 */
export const useLocale = () => {
  const [locale, setLocaleState] = useState<Locale>(getDefaultLocale);
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations on mount and locale change
  useState(() => {
    loadTranslations(locale).then((t) => {
      setTranslations(t);
      setIsLoading(false);
    });
  });

  // Set locale and persist
  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem('wasteland_locale', newLocale);
    setLocaleState(newLocale);
    setIsLoading(true);
    loadTranslations(newLocale).then((t) => {
      setTranslations(t);
      setIsLoading(false);
    });
  }, []);

  // Translation function
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = getNestedValue(translations, key);
    
    // Replace parameters like {name} with values
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
      });
    }
    
    return text;
  }, [translations]);

  return {
    t,
    locale,
    setLocale,
    isLoading,
  };
};

export default useLocale;
