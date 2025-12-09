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
    hand: { slug: string }[];
    inPlay: { slug: string }[];
  },
  players: {
    name: string;
    handSize: number;
    inPlay: { slug: string }[];
  }[];
};