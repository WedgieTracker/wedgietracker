import { cn } from "~/lib/utils";

interface CourtPositionDiagramProps {
  position: { x: number; y: number };
  dotClassName?: string;
}

export function CourtPositionDiagram({
  position,
  dotClassName = "h-3 w-3",
}: CourtPositionDiagramProps) {
  return (
    <>
      <div
        style={{
          position: "relative",
          top: "0",
          left: "0",
          width: "100%",
          paddingBottom: "73.3%",
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundImage: `url(https://res.cloudinary.com/wedgietracker/image/upload/v1735557904/assets/court_aazejm.svg)`,
          backgroundSize: "contain",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className={cn(
          "bg-yellow absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg",
          dotClassName,
        )}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
        }}
      >
        <div className="border-darkpurple bg-yellow absolute top-1/2 left-1/2 h-[calc(100%-0.2rem)] w-[calc(100%-0.2rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border" />
      </div>
    </>
  );
}
