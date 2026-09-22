import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { transliterateToHindi } from '../services/transliteration';

export function useTransliteration(text: string | null | undefined): string {
  const { language } = useLanguage();
  const [transliteratedText, setTransliteratedText] = useState(text || '');

  useEffect(() => {
    let isMounted = true;
    if (!text) {
      setTransliteratedText('');
      return;
    }
    
    if (language === 'hi') {
      transliterateToHindi(text).then(result => {
        if (isMounted) setTransliteratedText(result);
      }).catch(() => {
        if (isMounted) setTransliteratedText(text);
      });
    } else {
      setTransliteratedText(text);
    }
    
    return () => { isMounted = false; };
  }, [text, language]);

  return transliteratedText;
}
