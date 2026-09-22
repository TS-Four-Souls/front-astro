import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type DefaultMenu = "board" | "popup";

interface DisplayOptionContextProps {
  defaultMenu: DefaultMenu;
  setDefaultMenu: (defaultMenu: DefaultMenu) => void;
}

const DISPLAY_OPTIONS_STORAGE_KEY = "display-options";

const DEFAULT_DISPLAY_OPTIONS = {
  defaultMenu: "board" as DefaultMenu,
};

const DisplayOptionContext = createContext<
  DisplayOptionContextProps | undefined
>(undefined);

function readDisplayOptions(): typeof DEFAULT_DISPLAY_OPTIONS {
  if (typeof window === "undefined") {
    return DEFAULT_DISPLAY_OPTIONS;
  }

  try {
    const storedValue = window.localStorage.getItem(
      DISPLAY_OPTIONS_STORAGE_KEY,
    );

    if (!storedValue) {
      return DEFAULT_DISPLAY_OPTIONS;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (
      typeof parsedValue === "object" &&
      parsedValue !== null &&
      "defaultMenu" in parsedValue &&
      (parsedValue.defaultMenu === "board" ||
        parsedValue.defaultMenu === "popup")
    ) {
      return {
        defaultMenu: parsedValue.defaultMenu,
      };
    }
  } catch {
    // Ignore malformed or inaccessible localStorage data.
  }

  return DEFAULT_DISPLAY_OPTIONS;
}

export const DisplayOptionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [defaultMenu, setDefaultMenuState] = useState<DefaultMenu>(
    DEFAULT_DISPLAY_OPTIONS.defaultMenu,
  );

  useEffect(() => {
    setDefaultMenuState(readDisplayOptions().defaultMenu);
  }, []);

  const setDefaultMenu = useCallback((value: DefaultMenu) => {
    setDefaultMenuState(value);

    try {
      window.localStorage.setItem(
        DISPLAY_OPTIONS_STORAGE_KEY,
        JSON.stringify({ defaultMenu: value }),
      );
    } catch {
      // The UI should still work if storage is unavailable.
    }
  }, []);

  return (
    <DisplayOptionContext.Provider
      value={{
        defaultMenu,
        setDefaultMenu,
      }}>
      {children}
    </DisplayOptionContext.Provider>
  );
};

export const useDisplayOptionContext = (): DisplayOptionContextProps => {
  const context = useContext(DisplayOptionContext);

  if (!context) {
    throw new Error(
      "useDisplayOptionContext must be used within a DisplayOptionProvider.",
    );
  }

  return context;
};
