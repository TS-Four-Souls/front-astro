/** UI anchor point on a player row, resolved to a DOM node for getBoundingClientRect. */
export type PlayerAnchor = "coins";

export type GameAnimationBridge = {
  stackEl: HTMLDivElement | null;
  meHandEls: Map<number, HTMLDivElement>;
  /** Any in-play item card on the table (all players), keyed by card globalId. */
  inPlayCardEls: Map<number, HTMLDivElement>;
  opponentHandPileEls: Map<string, HTMLDivElement>;
  playerAnchors: Map<string, Map<PlayerAnchor, HTMLDivElement>>;
  previousMeByCard: Map<number, { slug: string; rect: DOMRect }>;
  previousOppPile: Map<string, DOMRect>;
  seenAnimationIds: Set<number>;
  initialized: boolean;
};

export const createAnimationBridge = (): GameAnimationBridge => ({
  stackEl: null,
  meHandEls: new Map(),
  inPlayCardEls: new Map(),
  opponentHandPileEls: new Map(),
  playerAnchors: new Map(),
  previousMeByCard: new Map(),
  previousOppPile: new Map(),
  seenAnimationIds: new Set(),
  initialized: false,
});

export type RectPlain = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Point2D = { x: number; y: number };
