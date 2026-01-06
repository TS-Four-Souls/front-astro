interface ChoicePopupProps {
  description: string;
  choices: ({ label: string; value: string | number } | string)[];
  onChoice: (choice: any) => void;
  onCancel: () => void;
  selectedChoices?: string[];
  validateLabel?: string;
  canValidate?: boolean;
  maxSelections?: number;
}

export const ChoicePopup = ({
  description,
  choices,
  onChoice,
  onCancel,
  selectedChoices = [],
  validateLabel = "Cancel",
  canValidate = true,
  maxSelections,
}: ChoicePopupProps) => {
  const isMaxReached = maxSelections !== undefined && selectedChoices.length >= maxSelections;
  const showOrder = maxSelections !== undefined && maxSelections > 1;
  
  return (
    <div className="popup">
      <div>
        <h3>{description}</h3>
        <div className="grid">
          {choices.map((choice, index) => {
            const value = typeof choice === "string" ? choice : choice.value;
            const label = typeof choice === "string" ? choice : choice.label;
            const isSelected = selectedChoices.includes(String(value));
            const selectionOrder = isSelected ? selectedChoices.indexOf(String(value)) + 1 : null;
            const isDisabled = !isSelected && isMaxReached;
            
            return (
              <button
                key={index}
                onClick={() => onChoice(value)}
                disabled={isDisabled}
                style={{ 
                  opacity: isSelected ? 0.7 : isDisabled ? 0.3 : 1,
                  backgroundColor: isSelected ? '#4a5568' : undefined,
                  position: 'relative'
                }}
              >
                {label}
                {showOrder && selectionOrder && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: '#2d3748',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {selectionOrder}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="separator"></div>
        <button onClick={onCancel} disabled={!canValidate}>{validateLabel}</button>
      </div>
    </div>
  );
};
