import { useEffect, useState } from "react";
import { JoinForm } from "./join-form";
import type { Issuer } from "../types/api";
import { StartStep } from "./start-step";
import { Board } from "./board";

export const Main = () => {
  const [issuer, setIssuer] = useState<Issuer | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/sse").then((response) => console.log(response)); }, []);

  if (!issuer) {
    return <JoinForm onJoin={setIssuer} />;
  } else if (!hasStarted) {
    return <StartStep onStart={() => setHasStarted(true)} issuer={issuer} />;
  } else {
    return <Board issuer={issuer} />;
  }
};
