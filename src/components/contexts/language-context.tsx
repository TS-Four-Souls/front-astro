import type { SerializedTranslation } from "@/shared/api";
import { storage } from "@/utils/storage";
import {
  boxes_dics,
  DEFAULT_LANGUAGE,
  isLanguageCode,
  LANGUAGE_CODE,
  translation_dics,
} from "@/utils/translate";
import { createContext, useContext, useState } from "react";
import type { TranslationFunctionArgs, TranslationKeys } from "translations";

const STORAGE_KEY = "language";

export function initLanguage(): LANGUAGE_CODE {
  const storedLanguage = storage.getItem(STORAGE_KEY);
  if (storedLanguage && isLanguageCode(storedLanguage)) {
    return storedLanguage;
  } else if (typeof window !== "undefined") {
    const navigatorLang = navigator.language.split("-")[0];
    if (navigatorLang && isLanguageCode(navigatorLang)) {
      return navigatorLang;
    }
  }
  return DEFAULT_LANGUAGE;
}

interface LanguageContextProps {
  language: LANGUAGE_CODE;
  setLanguage: (lan: LANGUAGE_CODE) => void;
  ts: (st: SerializedTranslation) => string;
  t: <T extends TranslationKeys>(...args: TranslationFunctionArgs<T>) => string;
  translateError: (error: string | SerializedTranslation) => string;
  boxes: (typeof boxes_dics)["en"];
}

const LanguageContext = createContext<LanguageContextProps>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  ts: () => "",
  t: () => "",
  translateError: () => "",
  boxes: {},
});

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [language, setLanguage] = useState<LANGUAGE_CODE>(initLanguage());
  function changeLanguage(language: LANGUAGE_CODE) {
    setLanguage(language);
    storage.setItem(STORAGE_KEY, language);
  }

  function ts(st: SerializedTranslation): string {
    const currentDic = translation_dics[language];
    let txt = currentDic[st.key] ?? translation_dics[DEFAULT_LANGUAGE][st.key];
    if (txt === undefined) {
      console.error(`Missing translation for key: ${st.key}`);
      return st.key;
    }
    if (st.interpolates === undefined) {
      return txt;
    }
    const interpolateKeys = Object.keys(st.interpolates);
    for (let i = 0; i < interpolateKeys.length; i++) {
      const key = interpolateKeys[i];
      const value = st.interpolates[key];
      if (value === undefined) {
        console.error(`Missing interpolation value for key: ${key}`);
        continue;
      }
      if (typeof value === "object" && !Array.isArray(value))
        txt = txt.replaceAll(`{{${key}}}`, ts(value));
      else if (Array.isArray(value))
        txt = txt.replaceAll(`{{${key}}}`, value.map((v) => ts(v)).join(", "));
      else txt = txt.replaceAll(`{{${key}}}`, value.toString());
    }
    return txt;
  }

  function t<T extends TranslationKeys>(
    ...args: TranslationFunctionArgs<T>
  ): string {
    const serializedTranslation: SerializedTranslation =
      args[1] === undefined
        ? { key: args[0] }
        : { key: args[0], interpolates: args[1] };
    return ts(serializedTranslation);
  }

  function translateError(error: string | SerializedTranslation): string {
    if (typeof error === "string") return error;
    return ts(error);
  }
  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        ts,
        t,
        translateError,
        boxes: boxes_dics[language],
      }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => {
  return useContext(LanguageContext);
};
