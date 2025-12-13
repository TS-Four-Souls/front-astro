export type JoinResponse = {
  message: string;
  secret: string;
}

export type Issuer = {
  id: string;
  secret: string;
}


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
  },
  players: {
    name: string;
    handSize: number;
    inPlay: GenericCardType[];
    souls: GenericCardType[];
    coins: number
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

type GenericCardType = {
  slug: string;
}