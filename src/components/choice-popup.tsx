interface ChoicePopupProps {
  description: string;
  choices: ({ label: string; value: string | number } | string)[];
  onChoice: (choice: any) => void;
  onCancel: () => void;
}

export const ChoicePopup = ({
  description,
  choices,
  onChoice,
  onCancel,
}: ChoicePopupProps) => {
  return (
    <div className="popup">
      <div>
        <h3>{description}</h3>
        <div className="grid">
          {choices.map((choice, index) => (
            <button
              key={index}
              onClick={() =>
                onChoice(typeof choice === "string" ? choice : choice.value)
              }
            >
              {typeof choice === "string" ? choice : choice.label}
            </button>
          ))}
        </div>
        <div className="separator"></div>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};
