import type { Issuer } from "../types/api";

interface StartStepProps {
    onStart: () => void;
    issuer: Issuer;
}

export const StartStep = ({ onStart, issuer }: StartStepProps) => {
    
    const requestStart = async () => {
        const response = await fetch("http://localhost:3000/start", {
            method: "POST",
            body: JSON.stringify({ issuer }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            onStart();
        } else {
            console.error("Failed to start the game");
        }
    }
    return <div>
        <h1>Start step</h1>
        <button onClick={requestStart}>Start</button>
        <button onClick={onStart}>Trust me bro, it's started</button>
    </div>;
}