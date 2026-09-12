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
        className="block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
      />
      {value && (
        <span className="absolute top-2 right-2 rounded bg-green-500 px-2 py-1 text-xs font-bold text-black">
          {badge}
        </span>
      )}
    </div>
  );
}
