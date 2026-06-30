import { type SerializedTranslation } from "../../shared/api";
import { type TranslationFunctionArgs, type TranslationKeys } from "translations";
import dic from "@/shared/translation.json";

function flattenDic(obj: Record<string, Record<string, string>>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in obj) {
        for (const subKey in obj[key]) {
            result[`${key}.${subKey}`] = obj[key][subKey];
        }
    }
    return result;
}

const dicFlat = flattenDic(dic);


export function t(st: SerializedTranslation): string {
    console.log("t", st);
    let txt = dicFlat[st.key];
    if (txt === undefined) {
        console.error(`Missing translation for key: ${st.key}`);
        return st.key;
    }
    if(st.interpolates === undefined) {
        return txt;
    }
    for (let i = 0; i < Object.keys(st.interpolates).length; i++) {
        const key = Object.keys(st.interpolates)[i];
        const value = st.interpolates[key];
        if (value === undefined) {
            console.error(`Missing interpolation value for key: ${key}`);
            continue;
        }
        if(typeof value === "object" && !Array.isArray(value))
            txt = txt.replaceAll(`{{${key}}}`, t(value));
        else if(Array.isArray(value))
            txt = txt.replaceAll(`{{${key}}}`, value.map(v => t(v)).join(", "));
        else
            txt = txt.replaceAll(`{{${key}}}`, value);
    }
    return txt;
}

export function toSeriTrans<T extends TranslationKeys>(
  ...args: TranslationFunctionArgs<T>
): SerializedTranslation {
  return args[1] === undefined
    ? { key: args[0] }
    : { key: args[0], interpolates: args[1] };
}


export function translateError(error: string | SerializedTranslation): SerializedTranslation {
    if(typeof error === "string")
        return toSeriTrans("common.content", { content: error });
    return error;
}