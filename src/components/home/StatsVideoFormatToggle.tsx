import { RectangleHorizontal, RectangleVertical } from "lucide-react";
import type { VideoType } from "./useStatsVideo";

interface StatsVideoFormatToggleProps {
  value: VideoType;
  onChange: (next: VideoType) => void;
}

interface FormatOptionProps {
  active: boolean;
  onClick: () => void;
  Icon: typeof RectangleHorizontal;
  label: string;
  hint: string;
}

function FormatOption({
  active,
  onClick,
  Icon,
  label,
  hint,
}: FormatOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition-all ${
        active ? "bg-pink text-darkpurple" : "text-pink hover:bg-pink/10"
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
        <span className="text-xs opacity-75">{hint}</span>
      </div>
    </button>
  );
}

export function StatsVideoFormatToggle({
  value,
  onChange,
}: StatsVideoFormatToggleProps) {
  return (
    <div className="border-pink flex w-full items-center justify-center gap-4 rounded-full border-2 p-2">
      <FormatOption
        active={value === "desktop"}
        onClick={() => onChange("desktop")}
        Icon={RectangleHorizontal}
        label="Landscape (16:9)"
        hint="YouTube • Twitter"
      />
      <FormatOption
        active={value === "mobile"}
        onClick={() => onChange("mobile")}
        Icon={RectangleVertical}
        label="Portrait (9:16)"
        hint="Instagram • TikTok"
      />
    </div>
  );
}
