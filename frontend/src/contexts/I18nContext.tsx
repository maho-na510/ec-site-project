import React, { createContext, useContext, ReactNode } from 'react'
import { ja, Translations } from '../locales/ja'

interface I18nContextType {
  t: Translations
  locale: string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // For now, we'll just use Japanese
  // You can extend this later to support multiple languages
  const locale = 'ja'
  const translations = ja

  return (
    <I18nContext.Provider value={{ t: translations, locale }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}
