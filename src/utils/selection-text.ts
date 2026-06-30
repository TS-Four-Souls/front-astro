import { t } from "@/components/translation/translate";
import type { IdentifierType } from "@/shared/api";

export const receiverName = ({
  from,
  receiver,
}: {
  from: IdentifierType;
  receiver: IdentifierType;
}) => {
  return t(from.nameKey) === t(receiver.nameKey) ? "themselves" : t(receiver.nameKey);
};
