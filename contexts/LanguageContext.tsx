import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKey } from '../constants/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('app_language');
        if (savedLang === 'en' || savedLang === 'hi') {
          setLanguageState(savedLang as Language);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem('app_language', newLang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const translationSet = translations[language] || translations['en'];
    return translationSet[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
