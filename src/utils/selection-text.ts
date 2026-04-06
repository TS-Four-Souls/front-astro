import type { IdentifierType, SelectionItem } from "@/shared/api";

export const selectionToText = (selection: SelectionItem) => {
  switch (selection.type) {
    case "card":
      return selection.payload.name;
    case "stackElement":
      switch (selection.payload.type) {
        case "death":
          return `${selection.payload.from.name} killed ${receiverName(selection.payload)}`;
        case "diceRoll":
          return `${selection.payload.card?.name ?? "Attack roll"} - ${selection.payload.issuer.name} rolled a ${selection.payload.diceRoll}`;
        case "damage":
          return `${selection.payload.from.name} dealt ${selection.payload.damage} damage to ${receiverName(selection.payload)}`;
        case "effect":
          return `${selection.payload.issuer.name} - ${selection.payload.card.name}`;
        case "LootCardEffect":
          return `${selection.payload.issuer.name} used ${selection.payload.card.name}`;
      }
    case "deck":
      return selection.payload;
    case "player":
      return selection.payload.name;
    case "monster":
      return selection.payload.name;
    case "string":
      return selection.payload;
    case "number":
      return selection.payload;
    case "boolean":
      return selection.payload;
    case "couplePlayerHand":
      return `${selection.payload.player.name} hand`;
    case "object":
    case "array":
    case "null":
    case "unknown":
      return "Unknown";
  }
};

export const receiverName = ({
  from,
  receiver,
}: {
  from: IdentifierType;
  receiver: IdentifierType;
}) => {
  return from.name === receiver.name ? "themselves" : receiver.name;
};
