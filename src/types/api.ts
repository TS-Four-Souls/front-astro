export type JoinResponse = {
  message: string;
  secret: string;
};

export type Issuer = {
  id: string;
  secret: string;
};

export type StateResponse = {
  players: {
    name: string;
    inPlay: { slug: string }[];
  }[];
};

export type DetailedStateResponse = {
  me: {
    name: string;
    hand: GenericCardType[];
    inPlay: GenericCardType[];
    souls: GenericCardType[];
    coins: number;
    currentHealthPoints: number;
    currentAttackPoints: number;
    remainingLootPlay: number;
  };
  players: {
    name: string;
    handSize: number;
    inPlay: GenericCardType[];
    souls: GenericCardType[];
    coins: number;
    currentHealthPoints: number;
    currentAttackPoints: number;
    remainingLootPlay: number;
  }[];
  topDiscards: {
    loot?: GenericCardType;
    treasure?: GenericCardType;
    monster?: GenericCardType;
  };
  monsters: GenericCardType[];
  shop: GenericCardType[];
  turn: string;
  stack: string[];
};

export type GenericCardType = {
  slug: string;
  charged?: boolean;
  effects?: ActiveEffectEntry[];
};

export type ActiveEffectEntry = {
  index: "tap" | number;
  description: string;
};

export interface TargetSelectorResponse {
    /** Description of what to select */
    description: string;
    /** How many targets to select */
    count: number;
    /** Whether the player can select fewer targets than count (asMany) */
    asMany: boolean;
    /** Available options as string identifiers */
    options: string[];
    /** Whether target building is complete */
    complete: boolean;
    /** For choose-one selectors: true = picking option description, false = picking actual targets */
    isChooseOne: boolean;
}