import dic_en from "../../data/translations/en.json";
import dic_es from "../../data/translations/es.json";
import dic_fr from "../../data/translations/fr.json";
import boxes_en from "../../data/boxes/en.json";
import boxes_es from "../../data/boxes/es.json";
import boxes_fr from "../../data/boxes/fr.json";

const flattenDic = (
  obj: Record<string, any>,
  prefix: string = "",
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(obj).flatMap(([key, value]) => {
      const newKey = `${prefix}${key}`;
      if (typeof value === "string") {
        return [[newKey, value]];
      } else {
        return Object.entries(flattenDic(value, `${newKey}.`));
      }
    }),
  );
export enum LANGUAGE_CODE {
  EN = "en",
  FR = "fr",
  ES = "es",
}
export const translation_dics: Record<LANGUAGE_CODE, Record<string, string>> = {
  en: flattenDic(dic_en),
  es: flattenDic(dic_es),
  fr: flattenDic(dic_fr),
} as const;
export const boxes_dics: Record<
  LANGUAGE_CODE,
  Record<string, { top: number; right: number; left: number; bottom: number }[]>
> = { en: boxes_en, fr: boxes_fr, es: boxes_es };
export const cards_dics: Record<LANGUAGE_CODE, string> = {
  en: "en",
  fr: "fr",
  es: "es",
};

export const DEFAULT_LANGUAGE: LANGUAGE_CODE = LANGUAGE_CODE.EN;

const listeners = new Set<() => void>();

export function isLanguageCode(s: string): s is LANGUAGE_CODE {
  return Object.values(LANGUAGE_CODE).includes(s as LANGUAGE_CODE);
}

export function onLanguageChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
