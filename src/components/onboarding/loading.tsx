export const Loading = () => {
  return (
    <div className="flex h-screen gap-8">
      <div className="planetarium flex flex-2 flex-col">
        <div className="flex flex-1 place-content-center place-items-center">
          <img src="/logo.png" alt="Logo" className="mb-16a w-[30vw]" />
        </div>
        <p className="mx-16 mb-4 text-center font-alt-stats text-blue-200/60">
          This is an unofficial, fan-made website and is not affiliated with
          <br /> or endorsed by Maestro Media and Edmund McMillen.
        </p>
      </div>
      <div className="flex flex-1 flex-col place-content-center place-items-center gap-8 font-main text-3xl">
        Loading...
      </div>
    </div>
  );
};
