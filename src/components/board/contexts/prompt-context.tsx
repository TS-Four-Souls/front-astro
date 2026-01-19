import type { SelectionItem } from "@/shared/api";
import { createContext, useContext, useState } from "react";
import { PromptPopup } from "../prompt-popup";

interface Prompt {
  promptId: string;
  /**
   * The prompt to display to the user
   */
  prompt: string;
  /**
   * The options to select from
   */
  options: SelectionItem[];
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
  onSubmit: (selections: SelectionItem[]) => void;
  /**
   * If the user cancels the prompt, this function will be called
   * If not provided, we consider the prompt is not cancellable
   */
  onCancel?: () => void;
}

interface PromptContextProps {
  prompts: Map<string, Prompt>;
  addPrompt: (prompt: Prompt) => void;
  removePrompt: (promptId: string) => void;
}

const PromptContext = createContext<PromptContextProps>({
  prompts: new Map(),
  addPrompt: () => {},
  removePrompt: () => {},
});

export const PromptProvider = ({ children }: { children: React.ReactNode }) => {
  const [prompts, setPrompts] = useState<Map<string, Prompt>>(new Map());

  const addPrompt = (prompt: Prompt) => {
    // Check if a prompt with the same ID already exists
    if (prompts.has(prompt.promptId)) {
      console.warn(`Prompt with ID ${prompt.promptId} already exists`);
      return;
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
