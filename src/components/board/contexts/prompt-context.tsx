import type { SelectionItem } from "@/shared/api";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export interface Prompt<T extends SelectionItem = SelectionItem> {
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
   * Whether board selection is allowed for this prompt
   * @default true
   */
  canUseOnBoardSelection?: boolean;
  /**
   * The function to call when the user submits the prompt
   */
  onSubmit: (selections: T[]) => void;
  /**
   * If the user cancels the prompt, this function will be called
   * If not provided, we consider the prompt is not cancellable
   */
  onCancel?: () => void;
}

interface PromptContextProps {
  prompt: Prompt | undefined;
  prompts: Map<string, Prompt>;
  addPrompt<T extends SelectionItem = SelectionItem>(prompt: Prompt<T>): void;
  removePrompt: (promptId: string) => void;
  clearPrompts: () => void;
}

const PromptContext = createContext<PromptContextProps>({
  prompt: undefined,
  prompts: new Map(),
  addPrompt: () => {},
  removePrompt: () => {},
  clearPrompts: () => {},
});

export const PromptProvider = ({ children }: { children: React.ReactNode }) => {
  const [prompts, setPrompts] = useState<Map<string, Prompt<any>>>(new Map());
  const blockedPrompts = useRef<Set<string>>(new Set());

  const addPrompt = useCallback(
    <T extends SelectionItem = SelectionItem>(prompt: Prompt<T>): void => {
      setPrompts((current) => {
        if (current.has(prompt.promptId)) {
          console.warn(`Prompt with ID ${prompt.promptId} already exists`);
          return current;
        }

        if (prompt.isUnique) {
          blockedPrompts.current.add(prompt.promptId);
        }

        const newMap = new Map(current);
        newMap.set(prompt.promptId, prompt);
        return newMap;
      });
    },
    [],
  );

  const removePrompt = useCallback((promptId: string) => {
    setPrompts((current) => {
      const prompt = current.get(promptId);
      if (!prompt) {
        return current;
      }

      if (prompt.isUnique) {
        blockedPrompts.current.delete(prompt.promptId);
      }
      const newMap = new Map(current);
      newMap.delete(promptId);
      return newMap;
    });
  }, []);

  const clearPrompts = useCallback(() => {
    setPrompts(new Map());
  }, []);

  const nextPrompt = prompts.values().next().value;

  const contextValue = useMemo(
    () => ({
      prompt: nextPrompt,
      prompts,
      addPrompt,
      removePrompt,
      clearPrompts,
    }),
    [nextPrompt, prompts, addPrompt, removePrompt, clearPrompts],
  );

  return (
    <PromptContext.Provider value={contextValue}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePromptContext = () => {
  return useContext(PromptContext);
};
