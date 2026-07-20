import { useLanguageContext } from "@/components/contexts/language-context";
import type { IdentifierType } from "@/shared/api";

export const receiverName = ({
  from,
  receiver,
}: {
  from: IdentifierType;
  receiver: IdentifierType;
}) => {
  const { ts } = useLanguageContext();
  return ts(from.nameKey) === ts(receiver.nameKey)
    ? "themselves"
    : ts(receiver.nameKey);
};
