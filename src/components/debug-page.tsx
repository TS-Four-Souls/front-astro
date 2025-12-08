import { useState } from "react";
import type { Issuer } from "../types/api";
import { Board } from "./board";

export const DebugPage = () => {
  const [issuer, setIssuer] = useState<Issuer | null>(null);

  const reset = () => {
    fetch("http://localhost:3000/debug", {
      method: "POST",
    });
  };

  return (
    <>
      {!issuer ? (
        <>
          <button onClick={reset}>Reset</button>
          <button
            onClick={() =>
              setIssuer({
                id: "DrMint",
                secret: "",
              })
            }
          >
            Join as DrMint
          </button>
          <button
            onClick={() =>
              setIssuer({
                id: "slichau",
                secret: "",
              })
            }
          >
            Join as slichau
          </button>
        </>
      ) : (
        <Board issuer={issuer} />
      )}
    </>
  );
};
