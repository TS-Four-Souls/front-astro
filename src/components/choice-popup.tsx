interface ChoicePopupProps {
    description: string;
    choices: string[];
    onChoice: (choice: string) => void;
}

export const ChoicePopup = ({ description, choices, onChoice }: ChoicePopupProps) => {
    return (
        <div className="popup">
            <div>
                <h3>{description}</h3>
                <div className="grid">
                    {choices.map((choice, index) => (
                        <button key={index} onClick={() => onChoice(choice)}>{choice}</button>
                    ))}
                </div>
            </div>
        </div>
    );
}