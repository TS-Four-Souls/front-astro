import type { SelectionItem } from "@/shared/api";

type StartBoardSelection = (params: {
  requestId: string;
  prompt: string;
  minCount: number;
  maxCount: number;
  options: SelectionItem[];
  onSubmit: (selections: SelectionItem[]) => void;
  onCancel?: () => void;
  onSwitchToMenu?: () => void;
}) => boolean;

type AddPrompt = (prompt: {
  promptId: string;
  isUnique: boolean;
  prompt: string;
  options: SelectionItem[];
  minCount: number;
  maxCount: number;
  onSubmit: (selections: SelectionItem[]) => void;
  onCancel?: () => void;
  onSwitchToBoardSelection?: () => void;
}) => void;

interface StartHybridSelectionFlowParams {
  requestId: string;
  prompt: string;
  options: SelectionItem[];
  minCount: number;
  maxCount: number;
  /**
   * Called when the user confirms a selection, regardless of current mode.
   */
  onSubmit: (selections: SelectionItem[]) => void;
  /**
   * Optional side-effect hook when cancelling from either mode.
   */
  onCancel?: () => void;
  isUniquePrompt?: boolean;
  addPrompt: AddPrompt;
  removePrompt: (promptId: string) => void;
  clearBoardSelection: () => void;
  canStartBoardSelection: (params: { options: SelectionItem[] }) => boolean;
  tryStartBoardSelection: StartBoardSelection;
}

/**
 * Starts a hybrid target selection flow that can switch between:
 *  - board selection (direct card clicks)
 *  - menu selection (popup options)
 *
 * This keeps behavior consistent across play-card and activate-card flows.
 */
export const startHybridSelectionFlow = ({
  requestId,
  prompt,
  options,
  minCount,
  maxCount,
  onSubmit,
  onCancel,
  isUniquePrompt = false,
  addPrompt,
  removePrompt,
  clearBoardSelection,
  canStartBoardSelection,
  tryStartBoardSelection,
}: StartHybridSelectionFlowParams) => {
  const boardSelectionAvailable = canStartBoardSelection({ options });

  const cancelAndClose = () => {
    clearBoardSelection();
    onCancel?.();
    removePrompt(requestId);
  };

  const submitAndClose = (selections: SelectionItem[]) => {
    clearBoardSelection();
    onSubmit(selections);
    removePrompt(requestId);
  };

  const showMenuPrompt = () => {
    addPrompt({
      promptId: requestId,
      isUnique: isUniquePrompt,
      prompt,
      options,
      minCount,
      maxCount,
      onSubmit: submitAndClose,
      onCancel: cancelAndClose,
      onSwitchToBoardSelection: boardSelectionAvailable
        ? () => {
            removePrompt(requestId);
            if (!tryBoardSelection()) {
              showMenuPrompt();
            }
          }
        : undefined,
    });
  };

  const tryBoardSelection = () => {
    return tryStartBoardSelection({
      requestId,
      prompt,
      options,
      minCount,
      maxCount,
      onSubmit: submitAndClose,
      onCancel: cancelAndClose,
      onSwitchToMenu: () => {
        clearBoardSelection();
        showMenuPrompt();
      },
    });
  };

  if (boardSelectionAvailable && tryBoardSelection()) {
    removePrompt(requestId);
    return;
  }

  showMenuPrompt();
};
