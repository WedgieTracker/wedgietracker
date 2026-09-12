import { cn } from "~/lib/utils";

export function VisuallyHidden({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "absolute h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap",
        "clip-path-[inset(50%)] -m-px",
        className,
      )}
      {...props}
    />
  );
}
