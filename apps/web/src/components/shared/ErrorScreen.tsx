import { Loader } from "~/components/shared/Loader";

/**
 * The 404 and error screens: the wedgie hoop animation (the ball stuck
 * between rim and board), the status code, a sentence-case line and one
 * sticker button.
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
      <div className="mr-[-20px] w-44 md:w-56" aria-hidden="true">
        <Loader />
      </div>
      <span className="text-violet font-numerals text-2xl leading-none font-normal">
        {code}
      </span>
      <h1 className="text-cream text-[34px] leading-none font-black tracking-[-0.03em] md:text-5xl">
        {title}
      </h1>
      {children}
    </div>
  );
}
