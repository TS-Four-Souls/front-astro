import { useState } from "react";
import type { Issuer } from "../types/api";
import { Board } from "./board";
import { BASE_URL } from "astro:env/client";

export const DebugPage = () => {
  const [issuer, setIssuer] = useState<Issuer | null>(null);

  const reset = () => {
    fetch(`${BASE_URL}/debug`, {
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
