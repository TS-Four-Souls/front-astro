import type { SelectionItem } from "@/shared/api";
import { createContext, useContext, useRef, useState } from "react";
import { PromptPopup } from "../prompt-popup";

interface Prompt<T extends SelectionItem = SelectionItem> {
  promptId: string;
  /**
   * If the prompt is unique, no other prompt with the same promptId can be added
   */
  isUnique: boolean;
  /**
   * The prompt to display to the user
   */
  prompt: string;
  /**
   * The options to select from
   */
  options: T[];
  /**
   * The minimum number of targets to select
   */
  minCount: number;
  /**
   * The maximum number of targets to select
   */
  maxCount: number;
  /**
   * The function to call when the user submits the prompt
   */
  onSubmit: (selections: T[]) => void;
  /**
   * If the user cancels the prompt, this function will be called
   * If not provided, we consider the prompt is not cancellable
   */
  onCancel?: () => void;
  /**
   * Optional callback to switch from menu selection to board selection
   */
  onSwitchToBoardSelection?: () => void;
}

interface PromptContextProps {
  prompts: Map<string, Prompt>;
  addPrompt<T extends SelectionItem = SelectionItem>(prompt: Prompt<T>): void;
  removePrompt: (promptId: string) => void;
}

const PromptContext = createContext<PromptContextProps>({
  prompts: new Map(),
  addPrompt: () => {},
  removePrompt: () => {},
});

export const PromptProvider = ({ children }: { children: React.ReactNode }) => {
  const [prompts, setPrompts] = useState<Map<string, Prompt<any>>>(new Map());
  const blockedPrompts = useRef<Set<string>>(new Set());

  const addPrompt = <T extends SelectionItem = SelectionItem>(
    prompt: Prompt<T>,
  ): void => {
    // Check if a prompt with the same ID already exists
    if (prompts.has(prompt.promptId)) {
      console.warn(`Prompt with ID ${prompt.promptId} already exists`);
      return;
    }
    // Check if the prompt already blocked
    if (blockedPrompts.current.has(prompt.promptId)) {
      console.warn(
        `Prompt with ID ${prompt.promptId} is unique and already exists`,
      );
      return;
    }
    // If the prompt is unique, block future prompts with the same ID
    if (prompt.isUnique) {
      blockedPrompts.current.add(prompt.promptId);
    }
    setPrompts((current) => {
      const newMap = new Map(current);
      newMap.set(prompt.promptId, prompt);
      return newMap;
    });
  };

  const removePrompt = (promptId: string) => {
    setPrompts((current) => {
      const newMap = new Map(current);
      newMap.delete(promptId);
      return newMap;
    });
  };

  const nextPrompt = prompts.values().next().value;

  return (
    <PromptContext.Provider value={{ prompts, addPrompt, removePrompt }}>
      {children}
      {nextPrompt && <PromptPopup {...nextPrompt} />}
    </PromptContext.Provider>
  );
};

export const usePromptContext = () => {
  return useContext(PromptContext);
};
