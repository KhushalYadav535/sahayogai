'use client';

import React, { createContext, useContext, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import en from '@/messages/en.json';
import hi from '@/messages/hi.json';
import mr from '@/messages/mr.json';

const messages = { en, hi, mr };

type Locale = 'en' | 'hi' | 'mr';

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void } | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  return ctx || { locale: 'en' as Locale, setLocale: () => {} };
}
