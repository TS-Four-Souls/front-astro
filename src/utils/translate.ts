import type { TranslationFunctionArgs, TranslationKeys } from "translations";
import type { SerializedTranslation } from "../shared/api";
import dic from "@/shared/translation_en.json";

function flattenDic(
  obj: Record<string, Record<string, string>>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    for (const subKey in obj[key]) {
      result[`${key}.${subKey}`] = obj[key][subKey];
    }
  }
  return result;
}

const dicFlat = flattenDic(dic);

export function ts(st: SerializedTranslation): string {
  console.log("t", st);
  let txt = dicFlat[st.key];
  if (txt === undefined) {
    console.error(`Missing translation for key: ${st.key}`);
    return st.key;
  }
  if (st.interpolates === undefined) {
    return txt;
  }
  for (let i = 0; i < Object.keys(st.interpolates).length; i++) {
    const key = Object.keys(st.interpolates)[i];
    const value = st.interpolates[key];
    if (value === undefined) {
      console.error(`Missing interpolation value for key: ${key}`);
      continue;
    }
    if (typeof value === "object" && !Array.isArray(value))
      txt = txt.replaceAll(`{{${key}}}`, ts(value));
    else if (Array.isArray(value))
      txt = txt.replaceAll(`{{${key}}}`, value.map((v) => ts(v)).join(", "));
    else txt = txt.replaceAll(`{{${key}}}`, value);
  }
  return txt;
}

export function t<T extends TranslationKeys>(
  ...args: TranslationFunctionArgs<T>
): string {
  const serializedTranslation: SerializedTranslation =
    args[1] === undefined
      ? { key: args[0] }
      : { key: args[0], interpolates: args[1] };
  return ts(serializedTranslation);
}

export function translateError(error: string | SerializedTranslation): string {
  if (typeof error === "string") return error;
  return ts(error);
}
