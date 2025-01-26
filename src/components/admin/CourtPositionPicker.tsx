"use client";

interface CourtPositionPickerProps {
  position: { x: number; y: number };
  onChange: (position: { x: number; y: number }) => void;
}

export function CourtPositionPicker({
  position,
  onChange,
}: CourtPositionPickerProps) {
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    onChange({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    });
  };

  return (
    <div className="relative mx-auto w-full max-w-[250px]">
      {/* Aspect ratio container */}
      <div
        style={{ paddingBottom: "73.3%" }}
        className="relative border-2 border-white/10"
      >
        {/* Court background - Click handler moved here */}
        <div
          className="absolute inset-0 cursor-crosshair"
          onClick={handleClick}
          style={{
            backgroundImage: `url(https://res.cloudinary.com/wedgietracker/image/upload/v1735557904/assets/court_aazejm.svg)`,
            backgroundSize: "contain",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Position marker */}
        <div
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow shadow-lg"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
          }}
        >
          <div className="absolute left-1/2 top-1/2 h-[calc(100%-0.2rem)] w-[calc(100%-0.2rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-darkpurple bg-yellow" />
        </div>
      </div>

      <div className="mt-2 text-center text-sm text-white">
        Position: x: {position.x}, y: {position.y}
      </div>
    </div>
  );
}
