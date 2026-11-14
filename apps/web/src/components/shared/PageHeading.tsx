/**
 * A page title in sentence case, with an optional figure beside it in a small
 * badge-gradient chip (e.g. how many wedgies there are). `badgeAction` sits on
 * the chip's corner, out of the flow, so showing it never moves the heading.
 */
export function PageHeading({
  title,
  badge,
  badgeAction,
}: {
  title: string;
  badge?: React.ReactNode;
  badgeAction?: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-3">
      <h1 className="text-cream text-[34px] leading-none font-black tracking-[-0.03em] md:text-5xl">
        {title}
      </h1>
      {badge !== undefined && badge !== null && (
        <span className="bg-button text-cream text-shadow-badge relative rounded-xl px-2.5 py-1 text-[22px] leading-none font-black italic md:text-3xl">
          {badge}
          {badgeAction}
        </span>
      )}
    </div>
  );
}
