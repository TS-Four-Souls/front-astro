import { LANGUAGE_CODE } from "../utils/translate";
import { useLanguageContext } from "./contexts/language-context";

const languageLabelMap: Record<LANGUAGE_CODE, string> = {
  en: "English",
  fr: "Français",
};

export const LanguageSelection = ({}: {}) => {
  const { language, setLanguage } = useLanguageContext();
  return (
    <div className="absolute right-4 bottom-30 z-50">
      <label className="sr-only" htmlFor="language-select">
        Select language
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(event) => setLanguage(event.target.value as LANGUAGE_CODE)}
        className="bg-space-700 rounded-md border border-space-400 px-3 py-2 text-sm text-white transition outline-none hover:border-white">
        {Object.values(LANGUAGE_CODE).map((code) => (
          <option key={code} value={code}>
            {languageLabelMap[code]}
          </option>
        ))}
      </select>
    </div>
  );
};
