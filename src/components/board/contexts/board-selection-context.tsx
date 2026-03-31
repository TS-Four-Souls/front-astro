import type { DetailedState, SelectionItem } from "@/shared/api";
import { createContext, useContext, useMemo, useState } from "react";
import { useGameContext } from "./game-context";
import { Button } from "@/components/button";
import { cn } from "@/utils/cn";
import { useHotkeys } from "react-hotkeys-hook";
import { HotkeyScope } from "@/utils/hotkey";

export const boardSelectionTargetId = {
  meInPlay: (index: number, slug: string) => `me:inplay:${index}:${slug}`,
  meHand: (index: number, slug: string) => `me:hand:${index}:${slug}`,
  playerEntity: (playerName: string, slug: string) =>
    `player:entity:${playerName}:${slug}`,
  monsterEntity: (slug: string) => `monster:entity:${slug}`,
  stackElement: (stackId: number) => `stack:element:${stackId}`,
  lootDeck: "loot:deck",
  treasureDeck: "treasure:deck",
  monsterDeck: "monster:deck",
  playerInPlay: (playerName: string, index: number, slug: string) =>
    `player:${playerName}:inplay:${index}:${slug}`,
  monsterInPlay: (index: number, slug: string) => `monster:inplay:${index}:${slug}`,
  treasureInPlay: (index: number, slug: string) =>
    `treasure:inplay:${index}:${slug}`,
  lootDiscardTop: (slug: string) => `loot:discard:top:${slug}`,
  treasureDiscardTop: (slug: string) => `treasure:discard:top:${slug}`,
  monsterDiscardTop: (slug: string) => `monster:discard:top:${slug}`,
  treasureDeckTop: (slug: string) => `treasure:deck:top:${slug}`,
};

type CardSelectionOption = Extract<SelectionItem, { type: "card" }>;
type StackSelectionOption = Extract<SelectionItem, { type: "stackElement" }>;
type PlayerSelectionOption = Extract<SelectionItem, { type: "player" }>;
type MonsterSelectionOption = Extract<SelectionItem, { type: "monster" }>;
type StringSelectionOption = Extract<SelectionItem, { type: "string" }>;

type VisibleTarget =
  | { id: string; type: "card"; slug: string }
  | { id: string; type: "stackElement"; stackId: number }
  | { id: string; type: "player"; playerName: string; slug: string }
  | { id: string; type: "monster"; slug: string }
  | { id: string; type: "deck"; deck: "loot" | "treasure" | "monster" };

interface ActiveBoardSelection {
  requestId: string;
  prompt: string;
  minCount: number;
  maxCount: number;
  options: SelectionItem[];
  selectedOptionIndexes: number[];
  targetToOptionIndex: Map<string, number>;
  onSubmit: (selections: SelectionItem[]) => void;
  onCancel?: () => void;
  onSwitchToMenu?: () => void;
}

interface TargetSelectionState {
  selectable: boolean;
  selected: boolean;
  selectionOrder: number | undefined;
}

interface BoardSelectionContextProps {
  canStartBoardSelection: (params: { options: SelectionItem[] }) => boolean;
  tryStartBoardSelection: (params: {
    requestId: string;
    prompt: string;
    minCount: number;
    maxCount: number;
    options: SelectionItem[];
    onSubmit: (selections: SelectionItem[]) => void;
    onCancel?: () => void;
    onSwitchToMenu?: () => void;
  }) => boolean;
  clearBoardSelection: () => void;
  cancelBoardSelection: () => void;
  selectTarget: (targetId: string) => void;
  getTargetSelectionState: (targetId: string) => TargetSelectionState;
  getTargetSelectionHotkey: (targetId: string) => string | undefined;
  activeRequestId?: string;
}

const BoardSelectionContext = createContext<BoardSelectionContextProps>({
  canStartBoardSelection: () => false,
  tryStartBoardSelection: () => false,
  clearBoardSelection: () => {},
  cancelBoardSelection: () => {},
  selectTarget: () => {},
  getTargetSelectionState: () => ({
    selectable: false,
    selected: false,
    selectionOrder: undefined,
  }),
  getTargetSelectionHotkey: () => undefined,
  activeRequestId: undefined,
});

const collectVisibleTargets = (
  state: DetailedState,
): VisibleTarget[] => {
  const targets: VisibleTarget[] = [];

  if (state.me.inPlay[0]) {
    targets.push({
      id: boardSelectionTargetId.playerEntity(state.me.name, state.me.inPlay[0].slug),
      type: "player",
      playerName: state.me.name,
      slug: state.me.inPlay[0].slug,
    });
  }

  state.me.inPlay.forEach((card, index) => {
    targets.push({
      id: boardSelectionTargetId.meInPlay(index, card.slug),
      type: "card",
      slug: card.slug,
    });
  });

  state.players.forEach((player) => {
    if (player.inPlay[0]) {
      targets.push({
        id: boardSelectionTargetId.playerEntity(player.name, player.inPlay[0].slug),
        type: "player",
        playerName: player.name,
        slug: player.inPlay[0].slug,
      });
    }

    player.inPlay.forEach((card, index) => {
      targets.push({
        id: boardSelectionTargetId.playerInPlay(player.name, index, card.slug),
        type: "card",
        slug: card.slug,
      });
    });
  });

  state.monsters.inPlay.forEach((monster, index) => {
    targets.push({
      id: boardSelectionTargetId.monsterEntity(monster.top.slug),
      type: "monster",
      slug: monster.top.slug,
    });

    targets.push({
      id: boardSelectionTargetId.monsterInPlay(index, monster.top.slug),
      type: "card",
      slug: monster.top.slug,
    });
  });

  state.treasure.inPlay.forEach((card, index) => {
    targets.push({
      id: boardSelectionTargetId.treasureInPlay(index, card.slug),
      type: "card",
      slug: card.slug,
    });
  });

  state.stack.forEach((element) => {
    targets.push({
      id: boardSelectionTargetId.stackElement(element.id),
      type: "stackElement",
      stackId: element.id,
    });
  });

  targets.push({
    id: boardSelectionTargetId.lootDeck,
    type: "deck",
    deck: "loot",
  });
  targets.push({
    id: boardSelectionTargetId.treasureDeck,
    type: "deck",
    deck: "treasure",
  });
  targets.push({
    id: boardSelectionTargetId.monsterDeck,
    type: "deck",
    deck: "monster",
  });

  const topLootDiscard = state.loot.discard.at(-1);
  if (topLootDiscard) {
    targets.push({
      id: boardSelectionTargetId.lootDiscardTop(topLootDiscard.slug),
      type: "card",
      slug: topLootDiscard.slug,
    });
  }

  const topTreasureDiscard = state.treasure.discard.at(-1);
  if (topTreasureDiscard) {
    targets.push({
      id: boardSelectionTargetId.treasureDiscardTop(topTreasureDiscard.slug),
      type: "card",
      slug: topTreasureDiscard.slug,
    });
  }

  const topMonsterDiscard = state.monsters.discard.at(-1);
  if (topMonsterDiscard) {
    targets.push({
      id: boardSelectionTargetId.monsterDiscardTop(topMonsterDiscard.slug),
      type: "card",
      slug: topMonsterDiscard.slug,
    });
  }

  if (state.firstCardTreasureDeck) {
    targets.push({
      id: boardSelectionTargetId.treasureDeckTop(state.firstCardTreasureDeck.slug),
      type: "card",
      slug: state.firstCardTreasureDeck.slug,
    });
  }

  // Keep hand targetable, but last in matching priority so board cards win when
  // slugs collide across zones.
  state.me.hand.forEach((card, index) => {
    targets.push({
      id: boardSelectionTargetId.meHand(index, card.slug),
      type: "card",
      slug: card.slug,
    });
  });

  return targets;
};

const normalizeDeckSelection = (
  value: string,
): "loot" | "treasure" | "monster" | undefined => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "loot" || normalized === "loot deck") {
    return "loot";
  }
  if (normalized === "treasure" || normalized === "treasure deck") {
    return "treasure";
  }
  if (normalized === "monster" || normalized === "monster deck") {
    return "monster";
  }

  return undefined;
};

const resolveTargetToOptionIndex = (
  state: DetailedState,
  options: SelectionItem[],
): Map<string, number> | null => {
  const visibleTargets = collectVisibleTargets(state);

  const cardTargetsBySlug = new Map<string, string[]>();
  const stackTargetsById = new Map<number, string>();
  const playerTargetsByName = new Map<string, string>();
  const playerTargetsBySlug = new Map<string, string>();
  const monsterTargetsBySlug = new Map<string, string>();
  const deckTargets = new Map<"loot" | "treasure" | "monster", string>();

  for (const target of visibleTargets) {
    if (target.type === "card") {
      cardTargetsBySlug.set(target.slug, [
        ...(cardTargetsBySlug.get(target.slug) ?? []),
        target.id,
      ]);
    }

    if (target.type === "stackElement") {
      stackTargetsById.set(target.stackId, target.id);
    }

    if (target.type === "player") {
      playerTargetsByName.set(target.playerName, target.id);
      playerTargetsBySlug.set(target.slug, target.id);
    }

    if (target.type === "monster") {
      monsterTargetsBySlug.set(target.slug, target.id);
    }

    if (target.type === "deck") {
      deckTargets.set(target.deck, target.id);
    }
  }

  const slugUsage = new Map<string, number>();
  const targetToOptionIndex = new Map<string, number>();

  for (let optionIndex = 0; optionIndex < options.length; optionIndex++) {
    const option = options[optionIndex];

    if (option.type === "card") {
      const cardOption = option as CardSelectionOption;
      const slug = cardOption.payload.slug;
      const matches = cardTargetsBySlug.get(slug) ?? [];
      const usage = slugUsage.get(slug) ?? 0;
      const matchedTargetId = matches[usage];

      if (!matchedTargetId) {
        return null;
      }

      targetToOptionIndex.set(matchedTargetId, optionIndex);
      slugUsage.set(slug, usage + 1);
      continue;
    }

    if (option.type === "stackElement") {
      const stackOption = option as StackSelectionOption;
      const matchedTargetId = stackTargetsById.get(stackOption.payload.id);
      if (!matchedTargetId) {
        return null;
      }
      targetToOptionIndex.set(matchedTargetId, optionIndex);
      continue;
    }

    if (option.type === "player") {
      const playerOption = option as PlayerSelectionOption;
      const matchedTargetId =
        playerTargetsByName.get(playerOption.payload.name) ??
        playerTargetsBySlug.get(playerOption.payload.slug);
      if (!matchedTargetId) {
        return null;
      }
      targetToOptionIndex.set(matchedTargetId, optionIndex);
      continue;
    }

    if (option.type === "monster") {
      const monsterOption = option as MonsterSelectionOption;
      const matchedTargetId = monsterTargetsBySlug.get(monsterOption.payload.slug);
      if (!matchedTargetId) {
        return null;
      }
      targetToOptionIndex.set(matchedTargetId, optionIndex);
      continue;
    }

    if (option.type === "string") {
      const stringOption = option as StringSelectionOption;
      const deckSelection = normalizeDeckSelection(stringOption.payload);
      if (!deckSelection) {
        return null;
      }
      const matchedTargetId = deckTargets.get(deckSelection);
      if (!matchedTargetId) {
        return null;
      }
      targetToOptionIndex.set(matchedTargetId, optionIndex);
      continue;
    }

    return null;
  }

  return targetToOptionIndex;
};

export const BoardSelectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { state } = useGameContext();
  const [activeSelection, setActiveSelection] = useState<ActiveBoardSelection | null>(
    null,
  );

  const clearBoardSelection = () => {
    setActiveSelection(null);
  };

  const cancelBoardSelection = () => {
    setActiveSelection((current) => {
      current?.onCancel?.();
      return null;
    });
  };

  const canStartBoardSelection: BoardSelectionContextProps["canStartBoardSelection"] = ({
    options,
  }) => {
    if (options.length === 0) {
      return false;
    }

    return resolveTargetToOptionIndex(state, options) !== null;
  };

  const tryStartBoardSelection: BoardSelectionContextProps["tryStartBoardSelection"] = ({
    requestId,
    prompt,
    minCount,
    maxCount,
    options,
    onSubmit,
    onCancel,
    onSwitchToMenu,
  }) => {
    if (activeSelection?.requestId === requestId) {
      return true;
    }

    if (maxCount <= 0 || options.length === 0) {
      return false;
    }

    const targetToOptionIndex = resolveTargetToOptionIndex(state, options);
    if (!targetToOptionIndex) {
      return false;
    }

    setActiveSelection({
      requestId,
      prompt,
      minCount,
      maxCount,
      options,
      selectedOptionIndexes: [],
      targetToOptionIndex,
      onSubmit,
      onCancel,
      onSwitchToMenu,
    });
    return true;
  };

  const selectTarget = (targetId: string) => {
    setActiveSelection((current) => {
      if (!current) {
        return current;
      }

      const optionIndex = current.targetToOptionIndex.get(targetId);
      if (optionIndex === undefined) {
        return current;
      }

      const selectedIndex = current.selectedOptionIndexes.indexOf(optionIndex);
      if (selectedIndex >= 0) {
        const selectedOptionIndexes = current.selectedOptionIndexes.toSpliced(
          selectedIndex,
          1,
        );
        return { ...current, selectedOptionIndexes };
      }

      if (current.maxCount === 1) {
        return { ...current, selectedOptionIndexes: [optionIndex] };
      }

      if (current.selectedOptionIndexes.length >= current.maxCount) {
        return current;
      }

      return {
        ...current,
        selectedOptionIndexes: [...current.selectedOptionIndexes, optionIndex],
      };
    });
  };

  const getTargetSelectionState = (targetId: string): TargetSelectionState => {
    if (!activeSelection) {
      return {
        selectable: false,
        selected: false,
        selectionOrder: undefined,
      };
    }

    const optionIndex = activeSelection.targetToOptionIndex.get(targetId);
    if (optionIndex === undefined) {
      return {
        selectable: false,
        selected: false,
        selectionOrder: undefined,
      };
    }

    const selectionOrder =
      activeSelection.selectedOptionIndexes.indexOf(optionIndex) + 1;
    const selected = selectionOrder > 0;

    return {
      selectable:
        selected ||
        activeSelection.selectedOptionIndexes.length < activeSelection.maxCount ||
        activeSelection.maxCount === 1,
      selected,
      selectionOrder: selected ? selectionOrder : undefined,
    };
  };

  const canSubmit = useMemo(() => {
    if (!activeSelection) {
      return false;
    }

    return (
      activeSelection.selectedOptionIndexes.length >= activeSelection.minCount &&
      activeSelection.selectedOptionIndexes.length <= activeSelection.maxCount
    );
  }, [activeSelection]);

  const selectionHotkeysByTargetId = useMemo(() => {
    if (!activeSelection) {
      return new Map<string, string>();
    }

    const orderedTargets = Array.from(activeSelection.targetToOptionIndex.entries())
      .map(([targetId, optionIndex]) => ({ targetId, optionIndex }))
      .sort((a, b) => a.optionIndex - b.optionIndex);

    const maxSelectable = activeSelection.maxCount;
    const selected = activeSelection.selectedOptionIndexes;

    const selectableTargets = orderedTargets.filter(({ optionIndex }) => {
      const isSelected = selected.includes(optionIndex);

      return (
        isSelected ||
        selected.length < maxSelectable ||
        maxSelectable === 1
      );
    });

    const mapping = new Map<string, string>();
    for (let index = 0; index < Math.min(9, selectableTargets.length); index++) {
      mapping.set(selectableTargets[index].targetId, `${index + 1}`);
    }

    return mapping;
  }, [activeSelection]);

  const getTargetSelectionHotkey = (targetId: string) => {
    return selectionHotkeysByTargetId.get(targetId);
  };

  const onSubmit = () => {
    if (!activeSelection || !canSubmit) {
      return;
    }

    const selections = activeSelection.selectedOptionIndexes.map(
      (index) => activeSelection.options[index],
    );

    activeSelection.onSubmit(selections);
    setActiveSelection(null);
  };

  const onCancel = () => {
    activeSelection?.onCancel?.();
    setActiveSelection(null);
  };

  useHotkeys("enter", onSubmit, {
    scopes: [HotkeyScope.Selection],
    enabled: activeSelection !== null,
  });

  useHotkeys("escape", onCancel, {
    scopes: [HotkeyScope.Selection],
    enabled: activeSelection !== null,
  });

  useHotkeys(
    "tab",
    (event) => {
      event.preventDefault();
      activeSelection?.onSwitchToMenu?.();
    },
    {
      scopes: [HotkeyScope.Selection],
      enabled: activeSelection?.onSwitchToMenu !== undefined,
      preventDefault: true,
    },
  );

  return (
    <BoardSelectionContext.Provider
      value={{
        canStartBoardSelection,
        tryStartBoardSelection,
        clearBoardSelection,
        cancelBoardSelection,
        selectTarget,
        getTargetSelectionState,
        getTargetSelectionHotkey,
        activeRequestId: activeSelection?.requestId,
      }}>
      {children}
      {activeSelection && (
        <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-50 flex justify-center p-6">
          <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border-2 border-stone-700 bg-stone-900/95 p-4 shadow-xl backdrop-blur-md">
            <div className="flex flex-col">
              <p className="font-main text-lg font-bold">{activeSelection.prompt}</p>
              <p className="text-sm text-stone-400">
                {activeSelection.selectedOptionIndexes.length} selected
                {activeSelection.maxCount > 1
                  ? ` (min ${activeSelection.minCount}, max ${activeSelection.maxCount})`
                  : ""}
              </p>
            </div>
            {activeSelection.onSwitchToMenu && (
              <Button
                label="Use menu selection"
                onClick={activeSelection.onSwitchToMenu}
                hotkey="tab"
                hotkeyScope={[HotkeyScope.Selection]}
              />
            )}
            <Button
              label="Cancel"
              onClick={onCancel}
              hotkey="escape"
              hotkeyScope={[HotkeyScope.Selection]}
            />
            <Button
              label="Submit"
              onClick={onSubmit}
              disabled={!canSubmit}
              hotkey="enter"
              hotkeyScope={[HotkeyScope.Selection]}
              className={cn(canSubmit && "glow-4")}
            />
          </div>
        </div>
      )}
    </BoardSelectionContext.Provider>
  );
};

export const useBoardSelectionContext = () => {
  return useContext(BoardSelectionContext);
};
