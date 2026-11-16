"use client";

interface VideoUrlInputProps {
  placeholder: string;
  badge: string;
  value: string;
  onChange: (value: string) => void;
}

export function VideoUrlInput({
  placeholder,
  badge,
  value,
  onChange,
}: VideoUrlInputProps) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-violet/30 bg-panel text-cream block w-full rounded-md p-2"
      />
      {value && (
        <span className="bg-violet text-night absolute top-2 right-2 rounded px-2 py-1 text-xs font-bold">
          {badge}
        </span>
      )}
    </div>
  );
}
