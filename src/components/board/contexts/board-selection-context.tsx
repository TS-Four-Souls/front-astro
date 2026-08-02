import type { DetailedState, SelectionItem } from "@/shared/api";
import { useGameContext } from "./game-context";
import { usePromptContext } from "./prompt-context";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PromptHandler } from "../prompt-handler/prompt-handler";
import { useLanguageContext } from "@/components/contexts/language-context";

export enum SpecialGlobalIds {
  Loot = -1,
  Treasure = -2,
  Monster = -3,
}

export const stackElementIdShift = 10_000;

export type GlobalId = number;

export interface BoardSelectionState {
  isSelectable: boolean;
  isSelected: boolean;
  selectionItem: SelectionItem;
  optionIndex: number;
  selectionIndex?: number;
}

interface BoardSelectionContextProps {
  boardSelectionState: Map<GlobalId, BoardSelectionState> | undefined;
  isBoardSelectionActive: boolean;
  toggleSelection: (selectionItem: SelectionItem) => void;
}

const BoardSelectionContext = createContext<BoardSelectionContextProps>({
  boardSelectionState: undefined,
  isBoardSelectionActive: false,
  toggleSelection: () => {},
});

export const BoardSelectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { t } = useLanguageContext();
  const gameContext = useGameContext();
  const state = gameContext.state as DetailedState | undefined;
  const { prompt } = usePromptContext();

  const convertDeckToGlobalId = (deck: string): GlobalId => {
    switch (deck) {
      case "loot":
        return SpecialGlobalIds.Loot;
      case "treasure":
        return SpecialGlobalIds.Treasure;
      case "monster":
        return SpecialGlobalIds.Monster;
      default:
        throw new Error(t("error.invalidDeckType", { deckType: deck }));
    }
  };

  const [selectedOptions, setSelectedOptions] = useState<SelectionItem[]>([]);

  useEffect(() => {
    if (!prompt) {
      setSelectedOptions([]);
    }
  }, [prompt]);

  const isGlobalIdOnBoard = useCallback(
    (id: GlobalId) => {
      if (!state) return false;
      return (
        [state.me, ...state.players].some(
          (p) =>
            p.inPlay.some((i) => i.globalId === id) ||
            p.character.globalId === id,
        ) ||
        state.me.hand.some((i) => i.globalId === id) ||
        state.monsters.inPlay.some((i) => i.top.globalId === id) ||
        state.treasure.inPlay.some((i) => i.globalId === id)
      );
    },
    [state],
  );

  const boardSelectionState = useMemo(() => {
    if (prompt === undefined) {
      return undefined;
    }

    if (prompt.canUseOnBoardSelection === false) {
      return undefined;
    }

    if (!prompt.options.every(isSupportedSelectionItem)) {
      return undefined;
    }

    if (
      !prompt.options.every((o) =>
        o.type === "deck" || o.type === "stackElement"
          ? true
          : isGlobalIdOnBoard(o.payload.globalId),
      )
    ) {
      return undefined;
    }

    const sortedOptions = prompt.options.every((o) => o.type === "stackElement")
      ? prompt.options.toReversed()
      : prompt.options;

    return new Map(
      sortedOptions.map((o, index) => {
        const key =
          o.type === "deck"
            ? convertDeckToGlobalId(o.payload)
            : o.type === "stackElement"
              ? o.payload.id + stackElementIdShift
              : o.payload.globalId;

        const selectionIndex = selectedOptions.indexOf(o);
        const isSelected = selectionIndex >= 0;
        const isIndexVisible = isSelected && prompt.maxCount > 1;

        const canAddMore = selectedOptions.length < prompt.maxCount;
        const isSingularSelection = prompt.maxCount === 1;

        return [
          key,
          {
            isSelectable: isSelected || canAddMore || isSingularSelection,
            isSelected: selectedOptions.some((s) => s === o),
            selectionItem: o,
            optionIndex: index,
            selectionIndex: isIndexVisible ? selectionIndex + 1 : undefined,
          },
        ];
      }),
    );
  }, [selectedOptions, isGlobalIdOnBoard, prompt]);

  const toggleSelection = useCallback(
    (selectionItem: SelectionItem) => {
      if (prompt === undefined) {
        return;
      }

      setSelectedOptions((current) => {
        const canAddMore = current.length < prompt.maxCount;
        const isSingularSelection = prompt.maxCount === 1;

        const isSelected = current.some((s) => s === selectionItem);

        if (isSelected) {
          return current.filter((s) => s !== selectionItem);
        } else if (canAddMore) {
          return [...current, selectionItem];
        } else if (isSingularSelection) {
          return [selectionItem];
        }
        return current;
      });
    },
    [prompt],
  );

  return (
    <BoardSelectionContext.Provider
      value={{
        boardSelectionState,
        isBoardSelectionActive:
          boardSelectionState !== undefined && prompt !== undefined,
        toggleSelection,
      }}>
      {children}
      {prompt && (
        <PromptHandler
          key={prompt.promptId}
          areOptionsOnBoard={boardSelectionState !== undefined}
          prompt={prompt}
          setSelectedOptions={setSelectedOptions}
          selectedOptions={selectedOptions}
        />
      )}
    </BoardSelectionContext.Provider>
  );
};

export const useBoardSelectionContext = () => {
  return useContext(BoardSelectionContext);
};

const isSupportedSelectionItem = (
  selectionItem: SelectionItem,
): selectionItem is Extract<
  SelectionItem,
  { type: "card" | "player" | "monster" | "deck" | "stackElement" }
> => {
  return (
    selectionItem.type === "card" ||
    selectionItem.type === "player" ||
    selectionItem.type === "monster" ||
    selectionItem.type === "deck" ||
    selectionItem.type === "stackElement"
  );
};
