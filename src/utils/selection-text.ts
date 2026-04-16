import type { IdentifierType } from "@/shared/api";

export const receiverName = ({
  from,
  receiver,
}: {
  from: IdentifierType;
  receiver: IdentifierType;
}) => {
  return from.name === receiver.name ? "themselves" : receiver.name;
};
