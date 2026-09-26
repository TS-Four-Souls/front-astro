import { cn } from "@/utils/cn";
import { LANGUAGE_CODE } from "../utils/translate";
import { useTooltip } from "./board/use-tooltip";
import { useLanguageContext } from "./contexts/language-context";

export const languageLabelMap: Record<LANGUAGE_CODE, string> = {
  en: "English",
  fr: "Français",
  pt: "Português",
  es: "Español",
};

export const LanguageSelection = ({ className }: { className?: string }) => {
  const { t, language, setLanguage } = useLanguageContext();
  const tooltip = useTooltip({
    enabled: true,
    title: t("languageSelectionButton.tooltip.title"),
    content: t("languageSelectionButton.tooltip.message"),
  });
  return (
    <select
      {...tooltip.revealProps}
      onClick={tooltip.closeTooltip}
      value={language}
      onChange={(event) => setLanguage(event.target.value as LANGUAGE_CODE)}
      className={cn(
        "cursor-pointer rounded-full bg-space-500 py-3 pr-2 pl-4 shadow-xl/50 inset-shadow-xs inset-shadow-taupe-100/10 transition-[filter] hover:brightness-120 active:brightness-150",
        className,
      )}>
      {Object.values(LANGUAGE_CODE).map((code) => (
        <option key={code} value={code}>
          {languageLabelMap[code]}
        </option>
      ))}
    </select>
  );
};
