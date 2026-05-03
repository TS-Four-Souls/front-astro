import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";
import { useGameContext } from "../game-context";
import type { DetailedState } from "@/shared/api";
import { CardType } from "../../card";
import {
  createAnimationBridge,
  type GameAnimationBridge,
  type PlayerAnchor,
  type Point2D,
} from "./types";
import { CardGhost, type CardGhostPayload } from "./card-ghost";
import { CoinProjectile } from "./coin-projectile";

const MAX_VISIBLE_COINS = 100;
const COIN_STAGGER_MS = 60;
const DRAW_LOOT_STAGGER_MS = 60;
const MAX_DRAW_LOOT_GHOSTS = 20;
const STACK_TARGET_OFFSET_LEFT = 24;
const STACK_TARGET_OFFSET_TOP = 24;
const STACK_TARGET_SIZE = 40;
const MONSTER_SOUL_FLIGHT_MS = 1000;
const MONSTER_SOUL_SHRINK_MS = 200;

type CardGhostItem = CardGhostPayload & { id: number };

type CoinBurstItem = {
  id: number;
  fromRect: { left: number; top: number; width: number; height: number };
  toPoint: Point2D;
  delayMs: number;
};

export interface GameAnimationContextValue {
  setStackEl: (el: HTMLDivElement | null) => void;
  registerLootDeckEl: (el: HTMLDivElement | null) => void;
  registerTreasureDeckEl: (el: HTMLDivElement | null) => void;
  registerTreasureShopPileEl: (
    globalId: number,
    el: HTMLDivElement | null,
  ) => void;
  registerMonsterSlotEl: (globalId: number, el: HTMLDivElement | null) => void;
  registerBonusSoulPileEl: (
    globalId: number,
    el: HTMLDivElement | null,
  ) => void;
  registerMeHandCardEl: (globalId: number, el: HTMLDivElement | null) => void;
  registerInPlayCardEl: (globalId: number, el: HTMLDivElement | null) => void;
  registerOpponentHandPile: (
    playerName: string,
    el: HTMLDivElement | null,
  ) => void;
  registerPlayerAnchor: (
    playerName: string,
    anchor: PlayerAnchor,
    el: HTMLDivElement | null,
  ) => void;
}

const GameAnimationContext = createContext<GameAnimationContextValue>({
  setStackEl: () => {},
  registerLootDeckEl: () => {},
  registerTreasureDeckEl: () => {},
  registerTreasureShopPileEl: () => {},
  registerMonsterSlotEl: () => {},
  registerBonusSoulPileEl: () => {},
  registerMeHandCardEl: () => {},
  registerInPlayCardEl: () => {},
  registerOpponentHandPile: () => {},
  registerPlayerAnchor: () => {},
});

const rectPlain = (r: DOMRect) => ({
  left: r.left,
  top: r.top,
  width: r.width,
  height: r.height,
});

const AnimationsFromState = ({
  bridgeRef,
  onLootToStack,
  onDrawLoot,
  onTreasureBuyToInPlay,
  onMonsterSoulToCounter,
  onGiveCoins,
}: {
  bridgeRef: RefObject<GameAnimationBridge>;
  onLootToStack: (payload: { slug: string; fromRect: DOMRect }) => void;
  onDrawLoot: (payload: {
    fromRect: DOMRect;
    toRect: DOMRect;
    delayMs?: number;
  }) => void;
  onTreasureBuyToInPlay: (payload: {
    fromRect: DOMRect;
    toRect: DOMRect;
    slug: string;
  }) => void;
  onMonsterSoulToCounter: (payload: {
    fromRect: DOMRect;
    toRect: DOMRect;
    slug: string;
  }) => void;
  onGiveCoins: (payload: {
    fromRect: DOMRect;
    toPoint: Point2D;
    count: number;
  }) => void;
}) => {
  const { state } = useGameContext();

  useLayoutEffect(() => {
    const bridge = bridgeRef.current;

    if (!bridge.initialized) {
      for (const a of state.animations) {
        bridge.seenAnimationIds.add(a.id);
      }
      refreshHandSnapshots(bridge, state);
      refreshTreasureShopSnapshots(bridge, state);
      refreshMonsterSnapshots(bridge, state);
      refreshBonusSoulSnapshots(bridge, state);
      bridge.initialized = true;
      return;
    }

    for (const a of state.animations) {
      if (bridge.seenAnimationIds.has(a.id)) continue;
      bridge.seenAnimationIds.add(a.id);

      if (a.type === "playLoot") {
        const isMe = a.player === state.me.name;
        if (isMe) {
          const prev = bridge.previousMeByCard.get(a.card.globalId);
          if (prev) {
            onLootToStack({
              slug: prev.slug,
              fromRect: prev.rect,
            });
          }
        } else {
          const prevPile = bridge.previousOppPile.get(a.player);
          if (prevPile) {
            onLootToStack({
              slug: a.card.slug,
              fromRect: prevPile,
            });
          }
        }
        continue;
      }

      if (a.type === "giveCoins") {
        if (a.count > 0) {
          const from = getPlayerCoinRect(bridge, a.sender);
          const to = getPlayerCoinRect(bridge, a.recipient);
          if (from && to) {
            const toPoint: Point2D = {
              x: to.left + to.width / 2,
              y: to.top + to.height / 2,
            };
            onGiveCoins({ fromRect: from, toPoint, count: a.count });
          }
        }
        continue;
      }

      if (a.type === "activateInPlay") {
        const el = bridge.inPlayCardEls.get(a.card.globalId);
        if (el) {
          onLootToStack({
            slug: a.card.slug,
            fromRect: el.getBoundingClientRect(),
          });
        }
        continue;
      }

      if (a.type === "drawLoot") {
        const fromEl = bridge.lootDeckEl;
        if (fromEl && a.nb > 0) {
          const fromRect = fromEl.getBoundingClientRect();
          if (a.player === state.me.name) {
            const hand = state.me.hand;
            const n = Math.min(a.nb, hand.length);
            for (let i = 0; i < n; i++) {
              const card = hand[hand.length - n + i];
              const el = bridge.meHandEls.get(card.globalId);
              if (el) {
                onDrawLoot({
                  fromRect,
                  toRect: el.getBoundingClientRect(),
                  delayMs: i * DRAW_LOOT_STAGGER_MS,
                });
              }
            }
          } else {
            const pileEl = bridge.opponentHandPileEls.get(a.player);
            if (pileEl) {
              const toRect = pileEl.getBoundingClientRect();
              const count = Math.min(a.nb, MAX_DRAW_LOOT_GHOSTS);
              for (let i = 0; i < count; i++) {
                onDrawLoot({
                  fromRect,
                  toRect,
                  delayMs: i * DRAW_LOOT_STAGGER_MS,
                });
              }
            }
          }
        }
        continue;
      }

      if (a.type === "buyTopDeckTreasure" || a.type === "buyShopTreasure") {
        const toEl = bridge.inPlayCardEls.get(a.card.globalId);
        if (!toEl) continue;

        let fromRect: DOMRect | null = null;
        if (a.type === "buyTopDeckTreasure") {
          const deckEl = bridge.treasureDeckEl;
          if (deckEl) fromRect = deckEl.getBoundingClientRect();
        } else {
          fromRect =
            bridge.previousTreasureShopPileByCard.get(a.card.globalId) ??
            bridge.treasureShopPileEls.get(a.card.globalId)?.getBoundingClientRect() ??
            null;
        }

        if (fromRect) {
          onTreasureBuyToInPlay({
            fromRect,
            toRect: toEl.getBoundingClientRect(),
            slug: a.card.slug,
          });
        }
        continue;
      }

      if (a.type === "obtainMonsterSoul") {
        const fromRect =
          bridge.previousMonsterSlotByCard.get(a.card.globalId) ??
          bridge.monsterSlotEls.get(a.card.globalId)?.getBoundingClientRect() ??
          null;
        const soulsEl = bridge.playerAnchors
          .get(a.player)
          ?.get("souls");
        const toRect = soulsEl?.getBoundingClientRect() ?? null;
        if (fromRect && toRect) {
          onMonsterSoulToCounter({
            fromRect,
            toRect,
            slug: a.card.slug,
          });
        }
        continue;
      }

      if (a.type === "obtainBonusSoul") {
        const fromRect =
          bridge.previousBonusSoulPileByCard.get(a.card.globalId) ??
          bridge.bonusSoulPileEls.get(a.card.globalId)?.getBoundingClientRect() ??
          null;
        const soulsEl = bridge.playerAnchors.get(a.player)?.get("souls");
        const toRect = soulsEl?.getBoundingClientRect() ?? null;
        if (fromRect && toRect) {
          onMonsterSoulToCounter({
            fromRect,
            toRect,
            slug: a.card.slug,
          });
        }
        continue;
      }
    }

    refreshHandSnapshots(bridge, state);
    refreshTreasureShopSnapshots(bridge, state);
    refreshMonsterSnapshots(bridge, state);
    refreshBonusSoulSnapshots(bridge, state);
  }, [
    state,
    bridgeRef,
    onLootToStack,
    onDrawLoot,
    onTreasureBuyToInPlay,
    onMonsterSoulToCounter,
    onGiveCoins,
  ]);

  return null;
};

function getPlayerCoinRect(bridge: GameAnimationBridge, playerName: string) {
  return (
    bridge.playerAnchors
      .get(playerName)
      ?.get("coins")
      ?.getBoundingClientRect() ?? null
  );
}

function refreshMonsterSnapshots(
  bridge: GameAnimationBridge,
  state: DetailedState,
) {
  bridge.previousMonsterSlotByCard.clear();
  for (const slot of state.monsters.inPlay) {
    const el = bridge.monsterSlotEls.get(slot.top.globalId);
    if (el) {
      bridge.previousMonsterSlotByCard.set(
        slot.top.globalId,
        el.getBoundingClientRect(),
      );
    }
  }
}

function getFixedStackTargetRect(
  stackEl: HTMLDivElement | null,
  fromRect: DOMRect,
) {
  if (!stackEl) {
    return {
      left: fromRect.left,
      top: fromRect.top,
      width: fromRect.width * 0.4,
      height: fromRect.height * 0.4,
    };
  }

  const stackRect = stackEl.getBoundingClientRect();
  return {
    left: stackRect.left + STACK_TARGET_OFFSET_LEFT,
    top: stackRect.top + STACK_TARGET_OFFSET_TOP,
    width: STACK_TARGET_SIZE,
    height: STACK_TARGET_SIZE,
  };
}

function refreshHandSnapshots(
  bridge: GameAnimationBridge,
  state: DetailedState,
) {
  bridge.previousMeByCard.clear();
  for (const card of state.me.hand) {
    const el = bridge.meHandEls.get(card.globalId);
    if (el) {
      bridge.previousMeByCard.set(card.globalId, {
        slug: card.slug,
        rect: el.getBoundingClientRect(),
      });
    }
  }
  bridge.previousOppPile.clear();
  for (const p of state.players) {
    if (p.handSize <= 0) continue;
    const el = bridge.opponentHandPileEls.get(p.name);
    if (el) {
      bridge.previousOppPile.set(p.name, el.getBoundingClientRect());
    }
  }
}

function refreshTreasureShopSnapshots(
  bridge: GameAnimationBridge,
  state: DetailedState,
) {
  bridge.previousTreasureShopPileByCard.clear();
  for (const card of state.treasure.inPlay) {
    const el = bridge.treasureShopPileEls.get(card.globalId);
    if (el) {
      bridge.previousTreasureShopPileByCard.set(
        card.globalId,
        el.getBoundingClientRect(),
      );
    }
  }
}

function refreshBonusSoulSnapshots(
  bridge: GameAnimationBridge,
  state: DetailedState,
) {
  bridge.previousBonusSoulPileByCard.clear();
  const souls = state.bonusSouls;
  if (!souls) return;
  for (const soul of souls) {
    const el = bridge.bonusSoulPileEls.get(soul.globalId);
    if (el) {
      bridge.previousBonusSoulPileByCard.set(
        soul.globalId,
        el.getBoundingClientRect(),
      );
    }
  }
}

export const GameAnimationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const stackElRef = useRef<HTMLDivElement | null>(null);
  const bridgeRef = useRef<GameAnimationBridge>(createAnimationBridge());
  const nextIdRef = useRef(0);

  const [cardGhosts, setCardGhosts] = useState<CardGhostItem[]>([]);
  const [coinBursts, setCoinBursts] = useState<CoinBurstItem[]>([]);

  const setStackEl = useCallback((el: HTMLDivElement | null) => {
    stackElRef.current = el;
    bridgeRef.current.stackEl = el;
  }, []);

  const registerLootDeckEl = useCallback((el: HTMLDivElement | null) => {
    bridgeRef.current.lootDeckEl = el;
  }, []);

  const registerTreasureDeckEl = useCallback((el: HTMLDivElement | null) => {
    bridgeRef.current.treasureDeckEl = el;
  }, []);

  const registerTreasureShopPileEl = useCallback(
    (globalId: number, el: HTMLDivElement | null) => {
      const b = bridgeRef.current;
      if (el) b.treasureShopPileEls.set(globalId, el);
      else b.treasureShopPileEls.delete(globalId);
    },
    [],
  );

  const registerMonsterSlotEl = useCallback(
    (globalId: number, el: HTMLDivElement | null) => {
      const b = bridgeRef.current;
      if (el) b.monsterSlotEls.set(globalId, el);
      else b.monsterSlotEls.delete(globalId);
    },
    [],
  );

  const registerBonusSoulPileEl = useCallback(
    (globalId: number, el: HTMLDivElement | null) => {
      const b = bridgeRef.current;
      if (el) b.bonusSoulPileEls.set(globalId, el);
      else b.bonusSoulPileEls.delete(globalId);
    },
    [],
  );

  const onLootToStack = useCallback(
    ({ slug, fromRect }: { slug: string; fromRect: DOMRect }) => {
      const id = nextIdRef.current++;
      const toRect = getFixedStackTargetRect(stackElRef.current, fromRect);
      setCardGhosts((prev) => [
        ...prev,
        {
          id,
          fromRect: rectPlain(fromRect),
          toRect,
          face: { kind: "front", slug },
        },
      ]);
    },
    [],
  );

  const onDrawLoot = useCallback(
    (payload: {
      fromRect: DOMRect;
      toRect: DOMRect;
      delayMs?: number;
    }) => {
      const id = nextIdRef.current++;
      setCardGhosts((prev) => [
        ...prev,
        {
          id,
          fromRect: rectPlain(payload.fromRect),
          toRect: rectPlain(payload.toRect),
          face: { kind: "back", cardType: CardType.LootCard },
          delayMs: payload.delayMs,
        },
      ]);
    },
    [],
  );

  const onTreasureBuyToInPlay = useCallback(
    (payload: {
      fromRect: DOMRect;
      toRect: DOMRect;
      slug: string;
    }) => {
      const id = nextIdRef.current++;
      setCardGhosts((prev) => [
        ...prev,
        {
          id,
          fromRect: rectPlain(payload.fromRect),
          toRect: rectPlain(payload.toRect),
          face: {
            kind: "front",
            slug: payload.slug,
            cropEnd: false,
          },
        },
      ]);
    },
    [],
  );

  const onMonsterSoulToCounter = useCallback(
    (payload: {
      fromRect: DOMRect;
      toRect: DOMRect;
      slug: string;
    }) => {
      const id = nextIdRef.current++;
      setCardGhosts((prev) => [
        ...prev,
        {
          id,
          fromRect: rectPlain(payload.fromRect),
          toRect: rectPlain(payload.toRect),
          face: { kind: "front", slug: payload.slug },
          flightDurationMs: MONSTER_SOUL_FLIGHT_MS,
          shrinkAfterFlightMs: MONSTER_SOUL_SHRINK_MS,
        },
      ]);
    },
    [],
  );

  const onGiveCoins = useCallback(
    ({
      fromRect,
      toPoint,
      count,
    }: {
      fromRect: DOMRect;
      toPoint: Point2D;
      count: number;
    }) => {
      const n = Math.min(Math.max(1, count), MAX_VISIBLE_COINS);
      const fromPlain = rectPlain(fromRect);
      setCoinBursts((prev) => {
        const add: CoinBurstItem[] = [];
        for (let i = 0; i < n; i++) {
          add.push({
            id: nextIdRef.current++,
            fromRect: { ...fromPlain },
            toPoint: { ...toPoint },
            delayMs: i * COIN_STAGGER_MS,
          });
        }
        return [...prev, ...add];
      });
    },
    [],
  );

  const registerMeHandCardEl = useCallback(
    (globalId: number, el: HTMLDivElement | null) => {
      const b = bridgeRef.current;
      if (el) b.meHandEls.set(globalId, el);
      else b.meHandEls.delete(globalId);
    },
    [],
  );

  const registerInPlayCardEl = useCallback(
    (globalId: number, el: HTMLDivElement | null) => {
      const b = bridgeRef.current;
      if (el) b.inPlayCardEls.set(globalId, el);
      else b.inPlayCardEls.delete(globalId);
    },
    [],
  );

  const registerOpponentHandPile = useCallback(
    (playerName: string, el: HTMLDivElement | null) => {
      const b = bridgeRef.current;
      if (el) b.opponentHandPileEls.set(playerName, el);
      else b.opponentHandPileEls.delete(playerName);
    },
    [],
  );

  const registerPlayerAnchor = useCallback(
    (playerName: string, anchor: PlayerAnchor, el: HTMLDivElement | null) => {
      const b = bridgeRef.current;
      if (!b.playerAnchors.has(playerName)) {
        b.playerAnchors.set(playerName, new Map());
      }
      const m = b.playerAnchors.get(playerName)!;
      if (el) m.set(anchor, el);
      else m.delete(anchor);
    },
    [],
  );

  const removeCardGhost = useCallback((id: number) => {
    setCardGhosts((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const removeCoinBurst = useCallback((id: number) => {
    setCoinBursts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <GameAnimationContext.Provider
      value={{
        setStackEl,
        registerLootDeckEl,
        registerTreasureDeckEl,
        registerTreasureShopPileEl,
        registerMonsterSlotEl,
        registerBonusSoulPileEl,
        registerMeHandCardEl,
        registerInPlayCardEl,
        registerOpponentHandPile,
        registerPlayerAnchor,
      }}>
      {children}
      <AnimationsFromState
        bridgeRef={bridgeRef}
        onLootToStack={onLootToStack}
        onDrawLoot={onDrawLoot}
        onTreasureBuyToInPlay={onTreasureBuyToInPlay}
        onMonsterSoulToCounter={onMonsterSoulToCounter}
        onGiveCoins={onGiveCoins}
      />
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {cardGhosts.map(({ id, ...ghost }) => (
          <CardGhost
            key={id}
            ghost={ghost}
            onDone={() => removeCardGhost(id)}
          />
        ))}
        {coinBursts.map((c) => (
          <CoinProjectile
            key={c.id}
            flightInstanceId={c.id}
            fromRect={c.fromRect}
            toPoint={c.toPoint}
            delayMs={c.delayMs}
            onDone={() => removeCoinBurst(c.id)}
          />
        ))}
      </div>
    </GameAnimationContext.Provider>
  );
};

export const useGameAnimation = () => useContext(GameAnimationContext);
