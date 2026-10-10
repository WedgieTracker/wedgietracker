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
        className="border-yellow/60 text-yellow hover:bg-yellow hover:text-darkpurple flex size-7 items-center justify-center rounded-md border transition-all duration-300 sm:size-8"
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
      <DialogContent className="bg-darkpurple border-yellow max-w-[90vw] rounded-xl border-2 text-white sm:max-w-md">
        <DialogClose className="border-yellow bg-yellow text-darkpurple hover:bg-darkpurple hover:text-yellow absolute top-3 right-3 rounded-full border transition-all duration-300">
          <Cross2Icon className="size-6 p-1" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogTitle className="text-yellow pr-8 font-black uppercase">
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
      className="space-y-4"
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
        <legend className="mb-2 text-xs font-bold tracking-wider text-white/60 uppercase">
          What did we get wrong?
        </legend>
        <div className="flex flex-wrap gap-2">
          {WEDGIE_REPORT_FIELDS.map((f) => (
            <label
              key={f}
              className={`cursor-pointer rounded-md border px-3 py-1 text-sm font-bold transition-colors ${
                field === f
                  ? "border-yellow bg-yellow text-darkpurple"
                  : "hover:border-yellow border-white/30 text-white"
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
          className="mb-2 block text-xs font-bold tracking-wider text-white/60 uppercase"
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
          className="focus:border-yellow w-full rounded-md border border-white/30 bg-white/5 p-2 text-sm text-white outline-none"
        />
        <p className="text-right text-xs text-white/40">
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
        <p className="text-pink text-sm">
          Something went wrong, please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={!field || report.isPending}
        className="bg-yellow text-darkpurple hover:bg-yellow/80 w-full rounded-md px-3 py-2 text-sm font-bold uppercase transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {report.isPending ? "Sending..." : "Send challenge"}
      </button>
    </form>
  );
}
