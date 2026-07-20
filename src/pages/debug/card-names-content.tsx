import { CardImage } from "@/components/board/card";
import { useLanguageContext } from "@/components/contexts/language-context";

export const CardNamesContent = () => {
  const { boxes } = useLanguageContext();
  return (
    <div className="bg-space-500 p-8">
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6 gap-y-8">
        {Object.entries(boxes).map(([slug]) => (
          <div className="relative h-8 overflow-hidden">
            <CardImage sizes="180px" card={{ slug }} className="absolute" />
            <p className="absolute top-0 right-7 left-7 h-6 overflow-auto border bg-white pt-1 text-center font-main text-[69%] leading-none uppercase">
              {
                // @ts-ignore
                t(`cardNames.${slug}`)
              }
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
