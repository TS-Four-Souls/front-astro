import type { SerializedTranslation } from "@/shared/api";
import { cn } from "@/utils/cn";
import { createContext, useContext } from "react";
import toastLib, { Toaster, type ToastOptions } from "react-hot-toast";
import { t as trans} from "../../translation/translate";

type ToastType = "info" | "error" | "success" | "warning" | "victory";

const Icon = ({ type, className }: { type: ToastType; className?: string }) => {
  switch (type) {
    case "success":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          viewBox="0 0 24 24"
          className={className}>
          <path
            fill="currentColor"
            d="m10.6 16.6l7.05-7.05l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"></path>
        </svg>
      );
    case "error":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          viewBox="0 0 24 24"
          className={className}>
          <path
            fill="currentColor"
            d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"></path>
        </svg>
      );
    case "info":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          viewBox="0 0 24 24"
          className={className}>
          <path
            fill="currentColor"
            d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"></path>
        </svg>
      );
    case "warning":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={28}
          height={28}
          viewBox="0 0 24 24"
          className={className}>
          <path
            fill="currentColor"
            d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
          />
        </svg>
      );
    case "victory":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={30}
          height={30}
          viewBox="0 0 24 24"
          className={className}>
          <path
            fill="currentColor"
            d="M12 2l2.5 6.5L21 9l-5 3.6L17 20l-5-3-5 3 1-7.4L3 9l6.5-.5L12 2z"
          />
        </svg>
      );
  }
};

interface ToastContextProps {
  toast: (
    type: ToastType,
    title: SerializedTranslation,
    message: SerializedTranslation,
    options?: ToastOptions,
  ) => string;
  dismiss: (toastId: string) => void;
  /**
   * Block the action if the message is not true.
   * @param title - The title of the toast.
   * @param capable - The message of the toast. If true, the action is not blocked.
   * @param callback - The callback to call if the action is not blocked.
   */
  block: (title: SerializedTranslation, capable: SerializedTranslation | true, callback: () => void) => void;
}

const ToastContext = createContext<ToastContextProps>({
  toast: () => "",
  dismiss: () => {},
  block: () => {},
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const addToast = (
    type: ToastType,
    title: SerializedTranslation,
    message: SerializedTranslation,
    options?: ToastOptions,
  ) => {
    return toastLib.custom(
      (t) => (
        <div
          className={cn(
            "relative flex items-center gap-4 overflow-hidden rounded-lg bg-taupe-600 p-4 pr-8 text-white",
            t.visible ? "animate-in-right" : "animate-out-right",
          )}>
          <Icon type={type} className="size-8 shrink-0" />
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-bold">{trans(title)}</h1>
            <p className="text-sm">{trans(message)}</p>
          </div>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 touch-none",
              type === "error" && "bg-red-600/20",
              type === "success" && "bg-green-600/20",
              type === "info" && "bg-blue-600/20",
              type === "warning" && "bg-[#eed202]/40",
              type === "victory" &&
                "bg-linear-to-r from-amber-400/40 to-mist-400/40",
            )}
          />
        </div>
      ),
      options,
    );
  };

  const dismiss = (toastId: string) => {
    toastLib.dismiss(toastId);
  };

  const block = (
    title: SerializedTranslation,
    capable: SerializedTranslation | true,
    callback: () => void,
  ) => {
    if (typeof capable === "string") {
      return addToast("error", title, capable);
    }
    callback();
  };

  return (
    <ToastContext.Provider value={{ toast: addToast, dismiss, block }}>
      {children}
      <Toaster position="top-right" />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  return useContext(ToastContext);
};
