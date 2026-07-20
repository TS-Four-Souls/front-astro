import { useLanguageContext } from "../contexts/language-context";

export const Loading = () => {
  const { t } = useLanguageContext();
  return t("introStep.loadingMessage");
};
