import numberBoxesEn from "../../data/number-boxes/en.json";
import numberBoxesEs from "../../data/number-boxes/es.json";
import numberBoxesFr from "../../data/number-boxes/fr.json";
import numberBoxesPt from "../../data/number-boxes/pt.json";
import { LANGUAGE_CODE } from "./translate";

export interface NumberBox {
  value: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

type NumberBoxDictionary = Record<string, NumberBox[]>;

const numberBoxesByLanguage: Record<LANGUAGE_CODE, NumberBoxDictionary> = {
  [LANGUAGE_CODE.EN]: numberBoxesEn,
  [LANGUAGE_CODE.ES]: numberBoxesEs,
  [LANGUAGE_CODE.FR]: numberBoxesFr,
  [LANGUAGE_CODE.PT]: numberBoxesPt,
};

export interface ResolvedNumberBoxes {
  boxes: NumberBox[];
  language: LANGUAGE_CODE;
}

export const numberBoxCardSlugs = Object.keys(
  numberBoxesByLanguage[LANGUAGE_CODE.EN],
);

export function resolveNumberBoxes(
  cardSlug: string,
  preferredLanguage: LANGUAGE_CODE,
): ResolvedNumberBoxes | undefined {
  const localizedBoxes = numberBoxesByLanguage[preferredLanguage][cardSlug];
  if (localizedBoxes) {
    return { boxes: localizedBoxes, language: preferredLanguage };
  }

  const englishBoxes = numberBoxesByLanguage[LANGUAGE_CODE.EN][cardSlug];
  if (englishBoxes) {
    return { boxes: englishBoxes, language: LANGUAGE_CODE.EN };
  }
}
