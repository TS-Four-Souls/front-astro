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
import {
  createAnimationBridge,
  type GameAnimationBridge,
  type PlayerAnchor,
  type Point2D,
} from "./types";
import { LootCardGhost } from "./loot-card-ghost";
import { CoinProjectile } from "./coin-projectile";

const MAX_VISIBLE_COINS = 100;
const COIN_STAGGER_MS = 60;

type LootCardGhostItem = {
  id: number;
  slug: string;
  fromRect: { left: number; top: number; width: number; height: number };
  toPoint: Point2D;
};

type CoinBurstItem = {
  id: number;
  fromRect: { left: number; top: number; width: number; height: number };
  toPoint: Point2D;
  delayMs: number;
};

export interface GameAnimationContextValue {
  setStackEl: (el: HTMLDivElement | null) => void;
  registerMeHandCardEl: (globalId: number, el: HTMLDivElement | null) => void;
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
  registerMeHandCardEl: () => {},
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
  onGiveCoins,
}: {
  bridgeRef: RefObject<GameAnimationBridge>;
  onLootToStack: (payload: { slug: string; fromRect: DOMRect }) => void;
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
      bridge.initialized = true;
      return;
    }

    for (const a of state.animations) {
      if (bridge.seenAnimationIds.has(a.id)) continue;
      bridge.seenAnimationIds.add(a.id);

      if (a.type === "lootPlay") {
        const isMe = a.player === state.me.name;
        if (isMe) {
          const prev = bridge.previousMeByCard.get(a.card.globalId);
          if (prev) onLootToStack({ slug: prev.slug, fromRect: prev.rect });
        } else {
          const prevPile = bridge.previousOppPile.get(a.player);
          if (prevPile)
            onLootToStack({ slug: a.card.slug, fromRect: prevPile });
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
    }

    refreshHandSnapshots(bridge, state);
  }, [state, bridgeRef, onLootToStack, onGiveCoins]);

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

export const GameAnimationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const stackElRef = useRef<HTMLDivElement | null>(null);
  const bridgeRef = useRef<GameAnimationBridge>(createAnimationBridge());
  const nextIdRef = useRef(0);

  const [lootGhosts, setLootGhosts] = useState<LootCardGhostItem[]>([]);
  const [coinBursts, setCoinBursts] = useState<CoinBurstItem[]>([]);

  const setStackEl = useCallback((el: HTMLDivElement | null) => {
    stackElRef.current = el;
  }, []);

  const onLootToStack = useCallback(
    ({ slug, fromRect }: { slug: string; fromRect: DOMRect }) => {
      const stackEl = stackElRef.current;
      if (!stackEl) return;
      const stackRect = stackEl.getBoundingClientRect();
      const toPoint = {
        x: stackRect.left + stackRect.width / 2,
        y: stackRect.top + stackRect.height / 2,
      };
      const id = nextIdRef.current++;
      setLootGhosts((prev) => [
        ...prev,
        { id, slug, fromRect: rectPlain(fromRect), toPoint },
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

  const removeLootGhost = useCallback((id: number) => {
    setLootGhosts((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const removeCoinBurst = useCallback((id: number) => {
    setCoinBursts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <GameAnimationContext.Provider
      value={{
        setStackEl,
        registerMeHandCardEl,
        registerOpponentHandPile,
        registerPlayerAnchor,
      }}>
      {children}
      <AnimationsFromState
        bridgeRef={bridgeRef}
        onLootToStack={onLootToStack}
        onGiveCoins={onGiveCoins}
      />
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {lootGhosts.map((g) => (
          <LootCardGhost
            key={g.id}
            ghost={g}
            onDone={() => removeLootGhost(g.id)}
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
