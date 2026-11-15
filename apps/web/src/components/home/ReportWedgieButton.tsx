"use client";

import { useState } from "react";
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

const FIELD_LABELS: Record<WedgieReportField, string> = {
  player: "Player",
  teams: "Teams",
  date: "Date",
  type: "Type",
  video: "Video",
  position: "Court position",
  other: "Something else",
};

const NOTE_MAX = 500;

interface ReportWedgieButtonProps {
  wedgie: { id: number; number: number };
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
      <DialogContent className="bg-panel border-violet/30 text-cream max-w-[90vw] rounded-[22px] border p-5 shadow-[0_14px_30px_rgb(5_2_20/0.6)] sm:max-w-md sm:rounded-[22px] md:p-6">
        <DialogClose className="border-cream/30 bg-night/35 text-cream hover:bg-cream hover:text-night focus-visible:outline-cream absolute top-4 right-4 grid size-9 place-items-center rounded-full border transition-colors duration-200 focus-visible:outline-2 md:top-5 md:right-5">
          <Cross2Icon className="size-5" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogTitle className="text-cream pr-11 text-[22px] leading-tight font-black tracking-[-0.03em]">
          Coach&apos;s challenge on #{wedgie.number}
        </DialogTitle>
        <ReportForm wedgieId={wedgie.id} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

// Kept separate so the mutation hook only mounts while the dialog is open.
function ReportForm({
  wedgieId,
  onDone,
}: {
  wedgieId: number;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [field, setField] = useState<WedgieReportField | null>(null);
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");

  const report = api.report.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Thanks, got it",
        description: "We'll check the footage and fix it if we got it wrong.",
      });
      onDone();
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!field) return;
        report.mutate({
          wedgieId,
          field,
          note: note.trim() || undefined,
          website: website || undefined,
        });
      }}
    >
      <fieldset>
        <legend className="text-cream/60 mb-2.5 text-[11.5px] font-black tracking-[0.12em] uppercase">
          What did we get wrong?
        </legend>
        <div className="flex flex-wrap gap-2">
          {WEDGIE_REPORT_FIELDS.map((f) => (
            <label
              key={f}
              className={`has-focus-visible:outline-cream flex min-h-9 cursor-pointer items-center rounded-full border px-3.5 text-[13.5px] font-extrabold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 ${
                field === f
                  ? "bg-cream border-cream text-night"
                  : "bg-night/40 border-violet/30 text-cream hover:border-cream/60"
              }`}
            >
              <input
                type="radio"
                name="field"
                value={f}
                checked={field === f}
                onChange={() => setField(f)}
                className="sr-only"
              />
              {FIELD_LABELS[f]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="report-note"
          className="text-cream/60 mb-2.5 block text-[11.5px] font-black tracking-[0.12em] uppercase"
        >
          Details (optional)
        </label>
        <textarea
          id="report-note"
          value={note}
          maxLength={NOTE_MAX}
          rows={3}
          placeholder="e.g. it was Jokic, not Murray"
          onChange={(e) => setNote(e.target.value)}
          className="bg-night text-cream placeholder:text-cream/40 focus-visible:outline-violet w-full rounded-xl px-4 py-3 text-[15px] font-bold outline-none focus-visible:outline-2"
        />
        <p className="text-cream/45 mt-1 text-right text-xs font-bold">
          {note.length}/{NOTE_MAX}
        </p>
      </div>

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

      {report.isError && (
        <p className="text-violet text-sm font-bold">
          Something went wrong, please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={!field || report.isPending}
        className="btn-sticker min-h-12 w-full px-5 text-[15px] [--sticker-off:4px] disabled:pointer-events-none disabled:opacity-50"
      >
        {report.isPending ? "Sending..." : "Send challenge"}
      </button>
    </form>
  );
}
