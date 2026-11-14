import { cn } from "~/lib/utils";

/**
 * The half court, drawn from the same artwork the positions were recorded
 * against (1024 by 751, baseline at the bottom), so a stored position lands
 * where it was logged. Lines are cream; the rim and backboard sit at their
 * regulation distance from the baseline.
 */
const COURT_PATHS = [
  "M491.59476,522.51978l1.591-7.55518a121.08956,121.08956,0,0,1-41.27444-17.01611l-4.21116,6.47317A128.8079,128.8079,0,0,0,491.59476,522.51978Z",
  "M623.929,469.69574a118.08679,118.08679,0,0,0,17.772-44.10013l-7.5929-1.39493a110.443,110.443,0,0,1-16.61834,41.2349Z",
  "M542.96729,523.06262a126.63653,126.63653,0,0,0,44.17175-17.444l-4.132-6.52218a118.91431,118.91431,0,0,1-41.48749,16.38085Z",
  "M411.17969,468.2518l6.43924-4.26016a112.9939,112.9939,0,0,1-16.87848-41.16895l-7.58158,1.459A120.65368,120.65368,0,0,0,411.17969,468.2518Z",
  "M164.0005,391.324c-55.03511,93.6574-66.84291,188.63815-66.956,189.58627L97.01807,751.143H926.90674V579.38147l-.03015-.23566c-.11689-.94439-12.40534-95.53869-71.09925-188.79461-54.26977-86.22855-160.355-189.017-357.55288-189.017C314.25943,201.33424,214.93193,304.65244,164.0005,391.324ZM360.65543,743.422V406.83585H672.82837V743.422ZM849.093,394.2269c56.479,89.614,69.39709,180.47409,70.09265,185.64664V743.422H680.54938V399.11478H643.454a120.04956,120.04956,0,0,0-24.88226-68.368,129.44106,129.44106,0,0,0-176.66431-26.6222c-27.08023,19.27814-44.675,47.69489-49.544,80.01551a119.21152,119.21152,0,0,0-1.20782,14.97464H352.93439V743.42194H104.73913V581.60767c.65411-5.09333,13.02363-96.46988,66.04743-186.591C220.7001,310.18121,318.0257,209.05531,498.2244,209.05531,691.76532,209.05531,795.85437,309.7533,849.093,394.2269ZM398.8493,399.11475A112.3861,112.3861,0,0,1,399.99777,385.29c4.55609-30.232,21.02933-56.82218,46.38663-74.87692a121.71965,121.71965,0,0,1,166.05347,25.0256,112.43208,112.43208,0,0,1,23.3078,63.67612Z",
] as const;

const VIEW_W = 1023.9248;
const VIEW_H = 751.14307;

interface CourtPositionDiagramProps {
  position: { x: number; y: number };
  /** Size of the shot marker; the rings scale with it. */
  dotClassName?: string;
}

export function CourtPositionDiagram({
  position,
  dotClassName = "size-3",
}: CourtPositionDiagramProps) {
  return (
    <>
      <div
        aria-hidden="true"
        style={{ width: "100%", paddingBottom: `${(VIEW_H / VIEW_W) * 100}%` }}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        aria-hidden="true"
        className="text-cream/55 absolute inset-0 size-full"
      >
        {COURT_PATHS.map((d) => (
          <path key={d.slice(0, 12)} d={d} fill="currentColor" />
        ))}
        <path
          d="M460 676H573"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle
          cx="516.7"
          cy="652"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
        />
      </svg>
      <span
        aria-hidden="true"
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff6fd8] shadow-[0_0_6px_#ff6fd8]",
          dotClassName,
        )}
        style={{ left: `${position.x}%`, top: `${position.y}%` }}
      >
        <span className="absolute -inset-[60%] rounded-full border-2 border-[#ff6fd8]/70" />
        <span className="absolute -inset-[130%] rounded-full border-[1.5px] border-[#ff6fd8]/35" />
      </span>
    </>
  );
}
