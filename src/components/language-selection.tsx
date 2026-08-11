import { LANGUAGE_CODE } from "../utils/translate";
import { useTooltip } from "./board/use-tooltip";
import { useLanguageContext } from "./contexts/language-context";

const languageLabelMap: Record<LANGUAGE_CODE, string> = {
  en: "English",
  fr: "Français",
  pt: "Português",
  es: "Español",
};

export const LanguageSelection = ({}: {}) => {
  const { t, language, setLanguage } = useLanguageContext();
  const tooltip = useTooltip({
    enabled: true,
    title: t("languageSelectionButton.tooltip.title"),
    content: t("languageSelectionButton.tooltip.message"),
  });
  return (
    <select
      onMouseEnter={tooltip.setTooltip}
      onMouseLeave={tooltip.closeTooltip}
      onClick={tooltip.closeTooltip}
      value={language}
      onChange={(event) => setLanguage(event.target.value as LANGUAGE_CODE)}
      className="absolute right-10 bottom-10 cursor-pointer rounded-full bg-space-500 py-3 pr-2 pl-4 shadow-xl/50 inset-shadow-xs inset-shadow-taupe-100/10 transition-[filter] hover:brightness-120 active:brightness-150">
      {Object.values(LANGUAGE_CODE).map((code) => (
        <option key={code} value={code}>
          {languageLabelMap[code]}
        </option>
      ))}
    </select>
  );
};
