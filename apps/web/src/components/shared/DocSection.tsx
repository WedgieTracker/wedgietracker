/** Classes for the pieces inside a DocSection, so pages share one look. */
export const docList = "marker:text-violet list-disc space-y-2 pl-5";
export const docSubheading =
  "text-cream text-[17px] leading-tight font-black tracking-[-0.02em]";
export const docLink =
  "text-cream underline decoration-cream/40 underline-offset-4 hover:decoration-cream";

/**
 * One titled block of a text page (privacy, support): a panel card with a
 * sentence-case heading and bold cream copy, like the Stats for nerds tiles.
 */
export function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-panel border-violet/20 rounded-[22px] border p-5 md:p-7">
      <h2 className="text-cream text-[22px] leading-tight font-black tracking-[-0.03em] md:text-2xl">
        {title}
      </h2>
      <div className="text-cream/75 [&_strong]:text-cream mt-3 space-y-4 text-[15px] leading-relaxed font-bold">
        {children}
      </div>
    </section>
  );
}
