import type { SelectionItem } from "@/shared/api";
import { createContext, useContext, useState } from "react";
import { PromptPopup } from "../prompt-popup";

interface Prompt {
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
  prompts: Prompt[];
  addPrompt: (prompt: Prompt) => void;
  removePrompt: () => void;
}

const PromptContext = createContext<PromptContextProps>({
  prompts: [],
  addPrompt: () => {},
  removePrompt: () => {},
});

export const PromptProvider = ({ children }: { children: React.ReactNode }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const addPrompt = (prompt: Prompt) => {
    setPrompts((current) => [...current, prompt]);
  };
  const removePrompt = () => {
    setPrompts((current) => [...current.slice(0, -1)]);
  };
  return (
    <PromptContext.Provider value={{ prompts, addPrompt, removePrompt }}>
      {children}
      {prompts.length > 0 && <PromptPopup {...prompts[prompts.length - 1]} />}
    </PromptContext.Provider>
  );
};

export const usePromptContext = () => {
  return useContext(PromptContext);
};
