"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";
import {
  WEDGIE_REPORT_FIELDS,
  type WedgieReportField,
} from "@wedgietracker/core/types/report";
import { isGemsDate } from "@wedgietracker/core/utils/formatDate";
import {
  isRealTeam,
  specialMatchup,
} from "@wedgietracker/core/utils/teamAliases";

/** Each choice: its label, a line for when there's no value to show, and the step-two question. */
const FIELDS: Record<
  WedgieReportField,
  { label: string; line: string; question: string; placeholder: string }
> = {
  player: {
    label: "Player",
    line: "Wrong player credited",
    question: "Who was it?",
    placeholder: "e.g. it was Jokic, not Murray",
  },
  teams: {
    label: "Teams",
    line: "Wrong matchup or side",
    question: "Which teams was it?",
    placeholder: "e.g. it was SAC getting wedged",
  },
  date: {
    label: "Date",
    line: "Wrong day or game",
    question: "When was it?",
    placeholder: "e.g. it was the 14th",
  },
  type: {
    label: "Type",
    line: "Wrong kind of wedgie",
    question: "What kind was it?",
    placeholder: "e.g. a layup, not a dunk",
  },
  video: {
    label: "Video",
    line: "Wrong clip, or it won't play",
    question: "What's wrong with the clip?",
    placeholder: "e.g. it shows a different play",
  },
  position: {
    label: "Court position",
    line: "The dot is in the wrong spot",
    question: "Where on the court was it?",
    placeholder: "e.g. left block, not the middle",
  },
  other: {
    label: "Something else",
    line: "Anything we haven't listed",
    question: "What did we get wrong?",
    placeholder: "Tell us what you spotted",
  },
};

const NOTE_MAX = 500;
const INK = "#2a1660";

interface ReportedWedgie {
  id: number;
  number: number;
  playerName?: string | null;
  teamName?: string | null;
  teamAgainstName?: string | null;
  seasonName?: string | null;
  wedgieDate?: string | Date | null;
  types?: { name: string }[];
}

interface ReportWedgieButtonProps {
  wedgie: ReportedWedgie;
}

/** What we have on file for a choice, so people can see what they're challenging. */
function currentValue(
  field: WedgieReportField,
  w: ReportedWedgie,
): string | null {
  switch (field) {
    case "player":
      return w.playerName ?? null;
    case "teams": {
      if (!w.teamName) return null;
      const special = specialMatchup({
        teamName: w.teamName,
        seasonName: w.seasonName,
      });
      if (special) return special.label;
      return w.teamAgainstName && isRealTeam(w.teamAgainstName)
        ? `${w.teamName} vs ${w.teamAgainstName}`
        : w.teamName;
    }
    case "date": {
      if (!w.wedgieDate) return null;
      const d = new Date(w.wedgieDate);
      if (Number.isNaN(d.getTime()) || isGemsDate(d)) return null;
      // The dialog only renders in the browser, so the visitor's locale is safe here.
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    }
    case "type":
      return w.types?.length ? w.types.map((t) => t.name).join(", ") : null;
    default:
      return null;
  }
}

function hintFor(field: WedgieReportField, w: ReportedWedgie): string {
  const value = currentValue(field, w);
  return value ? `We have ${value}` : FIELDS[field].line;
}

export function ReportWedgieButton({ wedgie }: ReportWedgieButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Challenge: report wrong info"
        title="Challenge"
        className="border-cream/60 text-cream hover:bg-cream hover:text-night focus-visible:outline-cream flex size-7 items-center justify-center rounded-md border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 sm:size-8"
      >
        <svg
          className="size-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {/* Referee whistle: body, mouthpiece, pea, and a couple of "tweet" lines */}
          <g strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
            <circle cx="9" cy="15" r="5" />
            <path d="M9 10h12v4h-7.4" />
            <path d="M14 6.5 15 4M18 7l1.8-2" />
          </g>
          <circle cx="9" cy="15" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </DialogTrigger>
      <DialogContent className="bg-panel border-violet/30 text-cream max-w-[90vw] gap-0 overflow-y-auto rounded-[22px] border p-5 shadow-[0_14px_30px_rgb(5_2_20/0.6)] sm:max-w-md sm:rounded-[22px] md:p-6">
        <DialogClose className="border-cream/30 bg-night/35 text-cream hover:bg-cream hover:text-night focus-visible:outline-cream absolute top-4 right-4 grid size-9 place-items-center rounded-full border transition-colors duration-200 focus-visible:outline-2 md:top-5 md:right-5">
          <Cross2Icon className="size-5" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogTitle className="text-cream pr-11 text-[22px] leading-tight font-black tracking-[-0.03em]">
          Coach&apos;s challenge on #{wedgie.number}
        </DialogTitle>
        <ReportForm wedgie={wedgie} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

/** "Step 1 of 2" with two little bars, the first or both lit. */
function StepMeta({ step }: { step: 1 | 2 }) {
  return (
    <p className="mt-1.5 mb-3.5 flex items-center gap-2 text-[11.5px] font-black tracking-[0.12em] text-white/70 uppercase">
      <span
        aria-hidden="true"
        className="bg-violet h-[5px] w-[18px] rounded-[3px]"
      />
      <span
        aria-hidden="true"
        className={`h-[5px] w-[18px] rounded-[3px] ${step === 2 ? "bg-violet" : "bg-cream/20"}`}
      />
      Step {step} of 2
    </p>
  );
}

/** A ticked or empty box for a step-one row; drawn, not an icon. */
function TickBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`ml-auto grid size-6 shrink-0 place-items-center rounded-[7px] border-2 transition-colors duration-150 ${
        checked ? "border-[#2a1660] bg-[#2a1660]" : "border-violet/70"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
          <path
            d="M3 8.5 6.5 12 13 4.5"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-cream"
          />
        </svg>
      )}
    </span>
  );
}

// Kept separate so the mutation hook only mounts while the dialog is open.
function ReportForm({
  wedgie,
  onDone,
}: {
  wedgie: ReportedWedgie;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [ticked, setTicked] = useState<Set<WedgieReportField>>(() => new Set());
  const [step, setStep] = useState<1 | 2>(1);
  // Kept per field, so a note survives going back to the list and unticking it for a moment.
  const [notes, setNotes] = useState<
    Partial<Record<WedgieReportField, string>>
  >({});
  const [website, setWebsite] = useState("");
  const ids = useId();
  const firstQuestionRef = useRef<HTMLHeadingElement>(null);
  const boxRefs = useRef<
    Partial<Record<WedgieReportField, HTMLInputElement | null>>
  >({});
  // Move focus only after someone steps, not when the dialog first opens.
  const [stepped, setStepped] = useState(false);

  // Always in the list's order, whatever order they were ticked in.
  const picked = WEDGIE_REPORT_FIELDS.filter((f) => ticked.has(f));

  const report = api.report.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Thanks, got it",
        description: "We'll check the footage and fix it if we got it wrong.",
      });
      onDone();
    },
  });

  useEffect(() => {
    if (!stepped) return;
    if (step === 2) {
      firstQuestionRef.current?.focus();
      return;
    }
    const first = WEDGIE_REPORT_FIELDS.find((f) => ticked.has(f));
    if (first) boxRefs.current[first]?.focus();
    // Focus follows the step, not every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, stepped]);

  const toggle = (f: WedgieReportField) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  const goTo = (to: 1 | 2) => {
    setStepped(true);
    setStep(to);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 1) {
          if (picked.length) goTo(2);
          return;
        }
        if (!picked.length) return;
        report.mutate({
          wedgieId: wedgie.id,
          items: picked.map((field) => {
            const note = notes[field]?.trim();
            return { field, note: note === "" ? undefined : note };
          }),
          website: website || undefined,
        });
      }}
    >
      {step === 2 && picked.length ? (
        <div
          key="step-2"
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-200"
        >
          <StepMeta step={2} />
          <div className="mb-2 flex items-center gap-3">
            <h3
              id={`${ids}-picked`}
              className="text-cream text-[15px] font-black"
            >
              You&apos;re challenging
            </h3>
            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label="Change what's wrong"
              className="border-cream/60 text-cream hover:bg-cream hover:text-night focus-visible:outline-cream ml-auto min-h-9 shrink-0 rounded-[10px] border-2 px-3 text-[12.5px] font-black transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Change
            </button>
          </div>
          <ul
            aria-labelledby={`${ids}-picked`}
            className="flex flex-col gap-1.5"
          >
            {picked.map((f) => (
              <li
                key={f}
                className="bg-cream flex min-w-0 items-baseline gap-2 rounded-[12px] px-3 py-2"
                style={{ color: INK }}
              >
                <span className="shrink-0 text-[14.5px] font-black">
                  {FIELDS[f].label}
                </span>
                <span className="truncate text-[12.5px] font-bold opacity-75">
                  {hintFor(f, wedgie)}
                </span>
              </li>
            ))}
          </ul>

          {picked.map((f, i) => {
            const note = notes[f] ?? "";
            return (
              <div key={f}>
                <h3
                  id={`${ids}-q-${f}`}
                  ref={i === 0 ? firstQuestionRef : undefined}
                  tabIndex={i === 0 ? -1 : undefined}
                  className="text-cream mt-[18px] mb-2.5 text-lg font-black outline-none"
                >
                  {FIELDS[f].question}
                </h3>
                <textarea
                  aria-labelledby={`${ids}-q-${f}`}
                  aria-describedby={`${ids}-opt-${f}`}
                  value={note}
                  maxLength={NOTE_MAX}
                  rows={picked.length > 1 ? 2 : 3}
                  placeholder={FIELDS[f].placeholder}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [f]: e.target.value }))
                  }
                  className="bg-night focus-visible:outline-violet w-full rounded-xl px-4 py-3 text-[15px] font-bold text-white outline-none placeholder:text-white/40 focus-visible:outline-2"
                />
                <p className="mt-1 flex justify-between text-xs font-bold text-white/50">
                  <span id={`${ids}-opt-${f}`}>Optional</span>
                  <span>
                    {note.length}/{NOTE_MAX}
                  </span>
                </p>
              </div>
            );
          })}

          {report.isError && (
            <p role="alert" className="text-violet mt-3 text-sm font-bold">
              Something went wrong, please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={report.isPending}
            className="btn-sticker mt-[18px] min-h-12 w-full px-5 text-[15px] [--sticker-off:4px] disabled:pointer-events-none disabled:opacity-50"
          >
            {report.isPending ? "Sending..." : "Send challenge"}
          </button>
        </div>
      ) : (
        <div
          key="step-1"
          className={
            stepped
              ? "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-4 motion-safe:duration-200"
              : undefined
          }
        >
          <StepMeta step={1} />
          <h3 id={`${ids}-list`} className="text-cream mb-1 text-lg font-black">
            What did we get wrong?
          </h3>
          <p className="mb-2.5 text-[13px] font-semibold text-white">
            Tick everything that looks off.
          </p>
          <div
            role="group"
            aria-labelledby={`${ids}-list`}
            className="flex flex-col gap-1.5"
          >
            {WEDGIE_REPORT_FIELDS.map((f) => {
              const checked = ticked.has(f);
              return (
                <label
                  key={f}
                  className={`group flex min-h-[54px] w-full cursor-pointer items-center gap-3 rounded-[14px] border px-3.5 py-2 text-left transition-colors duration-150 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[hsl(var(--cream))] ${
                    checked
                      ? "bg-cream border-cream"
                      : "bg-night/45 border-violet/30 hover:border-cream hover:bg-cream/5 text-white"
                  }`}
                  style={checked ? { color: INK } : undefined}
                >
                  <input
                    type="checkbox"
                    ref={(el) => {
                      boxRefs.current[f] = el;
                    }}
                    checked={checked}
                    onChange={() => toggle(f)}
                    aria-labelledby={`${ids}-${f}-label`}
                    aria-describedby={`${ids}-${f}`}
                    className="sr-only"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span
                      id={`${ids}-${f}-label`}
                      className="text-[15.5px] font-black"
                    >
                      {FIELDS[f].label}
                    </span>
                    <span
                      id={`${ids}-${f}`}
                      className={`truncate text-[12.5px] font-semibold ${checked ? "opacity-75" : "text-white"}`}
                    >
                      {hintFor(f, wedgie)}
                    </span>
                  </span>
                  <TickBox checked={checked} />
                </label>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => goTo(2)}
            disabled={!picked.length}
            className="btn-sticker mt-[18px] min-h-12 w-full px-5 text-[15px] [--sticker-off:4px] disabled:pointer-events-none disabled:opacity-50"
          >
            {picked.length ? `Next, ${picked.length} picked` : "Next"}
          </button>
        </div>
      )}

      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
      />
    </form>
  );
}
