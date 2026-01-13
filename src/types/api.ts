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
    isEngagedInCombat: boolean;
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
    isEngagedInCombat: boolean;

  }[];
  topDiscards: {
    loot?: GenericCardType;
    treasure?: GenericCardType;
    monster?: GenericCardType;
  };
  monsters: MonsterCard[];
  shop: GenericCardType[];
  turn: string;
  stack: string[];
  pendingSelection?: PendingSelection;
};

export type MonsterCard = {
  slug: string;
  name: string;
  stats?: {
    healthPoints: number;
    attackPoints: number;
    evasionPoints: number;
    isEngagedInCombat: boolean;
  }
}

export type PendingSelection = {
  requestId: string;
  description: string;
  options: string[];
  count: number;
  asMany: boolean;
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
  // TODO: maybe add a requestId here to refresh the selectedChoices in the popup
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

export type SubmitSelectionResponse = {
  issuer: Issuer;
  requestId: string;
  selectedOptions: string[];
};