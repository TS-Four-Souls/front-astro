import { ts } from "@/utils/translate";
import type { IdentifierType } from "@/shared/api";

export const receiverName = ({
  from,
  receiver,
}: {
  from: IdentifierType;
  receiver: IdentifierType;
}) => {
  return ts(from.nameKey) === ts(receiver.nameKey)
    ? "themselves"
    : ts(receiver.nameKey);
};
