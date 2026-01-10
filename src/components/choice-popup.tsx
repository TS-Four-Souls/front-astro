import { useEffect, useRef, useState } from "react";

interface ChoicePopupProps {
  description: string;
  choices: ({ label: string; value: string | number } | string)[];
  count: number;
  asMany: boolean;
  cancellable: boolean;
  onChoice: (choices: any[]) => void;
  onCancel: () => void;
}

export const ChoicePopup = ({
  description,
  choices,
  count,
  asMany,
  cancellable,
  onChoice,
  onCancel,
}: ChoicePopupProps) => {
  const [selectedChoices, setSelectedChoices] = useState<any[]>([]);

  useEffect(() => {
    setSelectedChoices([]);
  }, [choices]);

  const isSingularChoice = count === 1 && !asMany;

  useEffect(() => {
    if (isSingularChoice && selectedChoices.length === 1) {
      handleValidate();
    }
  }, [selectedChoices, isSingularChoice]);

  const handleChoice = (choice: any) => {
    if (selectedChoices.includes(choice)) {
      setSelectedChoices(selectedChoices.filter((c) => c !== choice));
      return;
    }

    console.log("selectedChoices", selectedChoices);
    if (selectedChoices.length === count) {
      return;
    }
    setSelectedChoices([...selectedChoices, choice]);
  };

  const handleValidate = () => {
    if (selectedChoices.length > count) {
      throw new Error(`Cannot select more than ${count} choices`);
    }

    if (selectedChoices.length < count && !asMany) {
      return;
    }

    onChoice(selectedChoices);
  };

  const indication =
    (asMany ? "Select up to" : "Select") +
    " " +
    count +
    " option" +
    (count > 1 ? "s" : "") +
    " (" +
    selectedChoices.length +
    "/" +
    count +
    " selected)";

  return (
    <div className="popup">
      <div>
        <h3>{description}</h3>
        {!isSingularChoice && <p>{indication}</p>}
        <div className="grid">
          {choices.length === 0 && <p>Oops, no choices available</p>}
          {choices.map((choice, index) => {
            const label = typeof choice === "string" ? choice : choice.label;
            const value = typeof choice === "string" ? choice : choice.value;

            return (
              <button
                key={index}
                data-selected={selectedChoices.includes(value)}
                onClick={() => handleChoice(value)}
              >
                {label}
                {count > 1 && selectedChoices.includes(value) && (
                  <span className="count">
                    {selectedChoices.indexOf(value) + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="separator"></div>
        {!isSingularChoice && (
          <button onClick={handleValidate}>Validate</button>
        )}
        {cancellable && <button onClick={onCancel}>Cancel</button>}
      </div>
    </div>
  );
};
