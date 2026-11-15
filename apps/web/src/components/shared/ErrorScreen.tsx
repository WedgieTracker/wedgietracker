/**
 * The 404 and error screens: the status code as a big italic number on a
 * badge-gradient tile, a sentence-case line under it and one sticker button.
 */
export function ErrorScreen({
  code,
  title,
  children,
}: {
  code: string;
  title: string;
  /** The way out, a btn-sticker link or button. */
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-7 px-[18px] py-16 text-center">
      <div className="bg-badge grain rounded-[22px] border-2 border-[rgb(240_225_182/0.35)] px-7 py-5 shadow-[0_12px_28px_rgb(5_2_20/0.45)]">
        <span className="text-cream text-shadow-badge block pr-[0.1em] text-[96px] leading-none font-black italic md:text-[128px]">
          {code}
        </span>
      </div>
      <h1 className="text-cream text-[34px] leading-none font-black tracking-[-0.03em] md:text-5xl">
        {title}
      </h1>
      {children}
    </div>
  );
}
