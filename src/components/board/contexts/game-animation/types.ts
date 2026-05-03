/** UI anchor point on a player row, resolved to a DOM node for getBoundingClientRect. */
export type PlayerAnchor = "coins" | "souls";

export type GameAnimationBridge = {
  stackEl: HTMLDivElement | null;
  /** Center board loot draw pile (top of deck visual). */
  lootDeckEl: HTMLDivElement | null;
  /** Center board treasure deck pile. */
  treasureDeckEl: HTMLDivElement | null;
  /** Treasure shop slots (center row), keyed by card globalId. */
  treasureShopPileEls: Map<number, HTMLDivElement>;
  /** Previous-frame rects for shop slots (card still in shop); used when animating buyShopTreasure after the slot unmounts. */
  previousTreasureShopPileByCard: Map<number, DOMRect>;
  /** Monster slots (center row), keyed by top monster card globalId. */
  monsterSlotEls: Map<number, HTMLDivElement>;
  /** Previous-frame rects for monster slots before the card leaves play (obtainMonsterSoul). */
  previousMonsterSlotByCard: Map<number, DOMRect>;
  /** Bonus soul piles (center column), keyed by card globalId. */
  bonusSoulPileEls: Map<number, HTMLDivElement>;
  /** Previous-frame rects before the bonus soul is granted (obtainBonusSoul). */
  previousBonusSoulPileByCard: Map<number, DOMRect>;
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
  lootDeckEl: null,
  treasureDeckEl: null,
  treasureShopPileEls: new Map(),
  previousTreasureShopPileByCard: new Map(),
  monsterSlotEls: new Map(),
  previousMonsterSlotByCard: new Map(),
  bonusSoulPileEls: new Map(),
  previousBonusSoulPileByCard: new Map(),
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
