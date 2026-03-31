interface SelectionStateLike {
  selected: boolean;
  selectable: boolean;
}

interface SelectionClassNameOptions {
  selectedClassName?: string;
  selectableClassName?: string;
}

interface SelectionStateResolver {
  selected: boolean;
  selectable: boolean;
  selectionOrder?: number;
}

interface ResolveActiveSelectionTargetParams {
  targetIds: Array<string | undefined>;
  fallbackTargetId: string;
  getTargetSelectionState: (targetId: string) => SelectionStateResolver;
  getTargetSelectionHotkey: (targetId: string) => string | undefined;
}

interface ActiveSelectionTargetResolution {
  targetId: string;
  selectionState: SelectionStateResolver;
  selectionHotkey: string | undefined;
}

const isDefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
};

export const DEFAULT_SELECTED_SELECTION_CLASS_NAME =
  "outline-[0.2em] outline-green-300 glow-5";

export const DEFAULT_SELECTABLE_SELECTION_CLASS_NAME =
  "outline-[0.15em] outline-green-500/70";

export const getSelectionClassName = (
  selectionState: SelectionStateLike,
  options?: SelectionClassNameOptions,
): string | undefined => {
  const selectedClassName =
    options?.selectedClassName ?? DEFAULT_SELECTED_SELECTION_CLASS_NAME;
  const selectableClassName =
    options?.selectableClassName ?? DEFAULT_SELECTABLE_SELECTION_CLASS_NAME;

  if (selectionState.selected) {
    return selectedClassName;
  }

  if (selectionState.selectable) {
    return selectableClassName;
  }

  return undefined;
};

export const resolveActiveSelectionTarget = ({
  targetIds,
  fallbackTargetId,
  getTargetSelectionState,
  getTargetSelectionHotkey,
}: ResolveActiveSelectionTargetParams): ActiveSelectionTargetResolution => {
  const candidates = targetIds.filter(isDefined);

  const targetId =
    candidates.find((candidate) => getTargetSelectionState(candidate).selected) ??
    candidates.find((candidate) => getTargetSelectionState(candidate).selectable) ??
    fallbackTargetId;

  return {
    targetId,
    selectionState: getTargetSelectionState(targetId),
    selectionHotkey: getTargetSelectionHotkey(targetId),
  };
};
