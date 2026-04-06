import type { SelectionItem } from "@/shared/api";
import { Button } from "../button";
import { HotkeyScope } from "@/utils/hotkey";
import { useEffect } from "react";
import { useHotkeysContext } from "react-hotkeys-hook";

interface PromptBoardSelectionProps {
  onCancel?: () => void | undefined;
  prompt: string;
  minCount: number;
  maxCount: number;
  selectedOptions: SelectionItem[];
  onSubmit: (selections: SelectionItem[]) => void;
  toggleMode?: () => void | undefined;
}

export const PromptBoardSelection = ({
  onCancel,
  prompt,
  minCount,
  maxCount,
  selectedOptions,
  onSubmit,
  toggleMode,
}: PromptBoardSelectionProps) => {
  const context = useHotkeysContext();

  useEffect(() => {
    const enableSelectionScope = () => {
      context.disableScope(HotkeyScope.Main);
      context.enableScope(HotkeyScope.Selection);
    };

    const resetScopes = () => {
      context.enableScope(HotkeyScope.Main);
      context.disableScope(HotkeyScope.Selection);
    };

    enableSelectionScope();
    return resetScopes;
  }, []);

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex justify-center p-6">
      <div className="pointer-events-auto flex items-center gap-4 rounded-2xl border-2 border-stone-700 bg-stone-900/95 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col">
          <p className="font-main text-lg font-bold">{prompt}</p>
          <p className="text-sm text-stone-400">
            {selectedOptions.length} selected
            {maxCount > 1 ? ` (min ${minCount}, max ${maxCount})` : ""}
          </p>
        </div>
        {toggleMode && (
          <Button
            label="Use menu selection"
            onClick={toggleMode}
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
          onClick={() => onSubmit(selectedOptions)}
          disabled={
            selectedOptions.length < minCount ||
            selectedOptions.length > maxCount
          }
          hotkey="enter"
          hotkeyScope={[HotkeyScope.Selection]}
        />
      </div>
    </div>
  );
};
