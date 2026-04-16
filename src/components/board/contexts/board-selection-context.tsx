import type { SelectionItem } from "@/shared/api";
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

export enum SpecialGlobalIds {
  Loot = -1,
  Treasure = -2,
  Monster = -3,
}

export type GlobalId = number;

export interface BoardSelectionState {
  isSelectable: boolean;
  isSelected: boolean;
  selectionItem: SelectionItem;
  optionIndex: number;
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
  const { state } = useGameContext();
  const { prompt } = usePromptContext();

  const [selectedOptions, setSelectedOptions] = useState<SelectionItem[]>([]);

  useEffect(() => {
    if (!prompt) {
      setSelectedOptions([]);
    }
  }, [prompt]);

  const isGlobalIdOnBoard = useCallback(
    (id: GlobalId) => {
      return (
        [state.me, ...state.players].some((p) =>
          p.inPlay.some((i) => i.globalId === id),
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
      console.log("prompt is undefined");
      return undefined;
    }

    if (!prompt.options.every(isSupportedSelectionItem)) {
      console.log("prompt.options.every(isSupportedSelectionItem) is false");
      return undefined;
    }

    if (
      !prompt.options.every((o) =>
        o.type === "deck" ? true : isGlobalIdOnBoard(o.payload.globalId),
      )
    ) {
      console.log(
        "prompt.options.every((o) => isGlobalIdOnBoard(o.payload.globalId)) is false",
      );
      return undefined;
    }

    console.log("prompt.options", prompt.options);

    return new Map(
      prompt.options.map((o, index) => [
        o.type === "deck"
          ? convertDeckToGlobalId(o.payload)
          : o.payload.globalId,
        {
          isSelectable: true,
          isSelected: selectedOptions.some((s) => s === o),
          selectionItem: o,
          optionIndex: index,
        },
      ]),
    );
  }, [selectedOptions, isGlobalIdOnBoard, prompt]);

  console.log("boardSelectionState", boardSelectionState);
  console.log("selectedOptions", selectedOptions);

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
          console.log("isSelected", isSelected);
          return current.filter((s) => s !== selectionItem);
        } else if (canAddMore) {
          console.log("canAddMore", canAddMore);
          return [...current, selectionItem];
        } else if (isSingularSelection) {
          console.log("isSingularSelection", isSingularSelection);
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
  { type: "card" | "player" | "monster" | "deck" }
> => {
  return (
    selectionItem.type === "card" ||
    selectionItem.type === "player" ||
    selectionItem.type === "monster" ||
    selectionItem.type === "deck"
  );
};

const convertDeckToGlobalId = (deck: string): GlobalId => {
  switch (deck) {
    case "loot":
      return SpecialGlobalIds.Loot;
    case "treasure":
      return SpecialGlobalIds.Treasure;
    case "monster":
      return SpecialGlobalIds.Monster;
    default:
      throw new Error(`Invalid deck: ${deck}`);
  }
};
