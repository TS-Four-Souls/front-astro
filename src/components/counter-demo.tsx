import { useState } from "react";

export const Main = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Main</h1>
      <button onClick={() => setCount(count + 1)}>Click me</button>
      <p>Value: {count}</p>
    </div>
  );
};