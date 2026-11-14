import type { VideoFormat } from "./stats-video-helpers";

interface StatsVideoFormatToggleProps {
  value: VideoFormat;
  onChange: (next: VideoFormat) => void;
}

const OPTIONS: {
  value: VideoFormat;
  label: string;
  size: string;
  hint: string;
  shape: string;
}[] = [
  {
    value: "portrait",
    label: "Vertical",
    size: "1080×1920",
    hint: "Reels, Shorts, TikTok",
    shape: "h-9 w-5",
  },
  {
    value: "landscape",
    label: "Landscape",
    size: "1920×1080",
    hint: "YouTube, X",
    shape: "h-5 w-9",
  },
];

/** Native radios styled as cards, so arrow keys and screen readers just work. */
export function StatsVideoFormatToggle({
  value,
  onChange,
}: StatsVideoFormatToggleProps) {
  return (
    <fieldset className="grid grid-cols-2 gap-3">
      <legend className="text-cream/70 mb-2 text-xs font-bold tracking-wider uppercase">
        Format
      </legend>
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className="bg-panel border-violet/20 has-checked:border-cream has-focus-visible:outline-cream text-cream relative flex cursor-pointer items-center gap-3 rounded-[16px] border-2 px-4 py-3 transition-[border-color,box-shadow] has-checked:shadow-[4px_4px_0_hsl(var(--violet))] has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
        >
          <input
            type="radio"
            name="stats-video-format"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={`bg-badge peer-checked:border-cream border-cream/40 grid shrink-0 place-items-center rounded-[4px] border-2 ${option.shape}`}
          />
          <span className="flex flex-col text-base leading-tight font-black">
            {option.label}
            <span className="text-cream/60 text-xs font-bold">
              {option.size}
            </span>
            <span className="text-cream/80 mt-0.5 text-xs font-semibold">
              {option.hint}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
