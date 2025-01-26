import { cn } from "~/lib/utils";

export function VisuallyHidden({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0",
        "clip-path-[inset(50%)] -m-px",
        className,
      )}
      {...props}
    />
  );
}
