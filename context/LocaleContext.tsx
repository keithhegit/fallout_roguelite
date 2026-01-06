import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Supported languages
export type Locale = 'en' | 'zh';

// Translation structure
export interface Translations {
    [key: string]: string | Translations;
}

// Context type
interface LocaleContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    isLoading: boolean;
}

// Default context
const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Get nested translation value
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

// Load translations
const loadTranslations = async (locale: Locale): Promise<Translations> => {
    if (Object.keys(translationCache[locale]).length > 0) {
        return translationCache[locale];
    }

    try {
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

// Get default locale
const getDefaultLocale = (): Locale => {
    const stored = localStorage.getItem('wasteland_locale');
    if (stored === 'en' || stored === 'zh') return stored;

    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) return 'zh';
    return 'en';
};

// Provider props
interface LocaleProviderProps {
    children: ReactNode;
    defaultLocale?: Locale;
}

/**
 * LocaleProvider - Provides translation context to the app
 */
export const LocaleProvider: React.FC<LocaleProviderProps> = ({
    children,
    defaultLocale
}) => {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale || getDefaultLocale);
    const [translations, setTranslations] = useState<Translations>({});
    const [isLoading, setIsLoading] = useState(true);

    // Load translations on mount and locale change
    useEffect(() => {
        setIsLoading(true);
        loadTranslations(locale).then((t) => {
            setTranslations(t);
            setIsLoading(false);
        });
    }, [locale]);

    // Set locale and persist
    const setLocale = useCallback((newLocale: Locale) => {
        localStorage.setItem('wasteland_locale', newLocale);
        setLocaleState(newLocale);
    }, []);

    // Translation function with parameter support
    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let text = getNestedValue(translations, key);

        // Replace {param} with values
        if (params) {
            Object.entries(params).forEach(([param, value]) => {
                text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
            });
        }

        return text;
    }, [translations]);

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t, isLoading }}>
            {children}
        </LocaleContext.Provider>
    );
};

/**
 * useLocale hook - Access translation context
 * 
 * @example
 * const { t, locale, setLocale } = useLocale();
 * // Use translation: t('common.startGame')
 * // Switch language: setLocale('zh')
 */
export const useLocale = (): LocaleContextType => {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
};

export default LocaleProvider;
