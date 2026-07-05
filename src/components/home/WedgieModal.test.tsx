import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const toast = vi.fn();
vi.mock("~/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

vi.mock("~/components/shared/ShareButtons", () => ({
  ShareButtons: ({ url, title }: { url: string; title: string }) => (
    <div data-testid="share-buttons" data-url={url} data-title={title} />
  ),
}));

vi.mock("./CourtPositionDiagram", () => ({
  CourtPositionDiagram: () => <div data-testid="court-diagram" />,
}));

const { WedgieModal } = await import("./WedgieModal");

const noop = vi.fn();

const baseWedgie = {
  id: 1,
  number: 42,
  playerName: "LeBron",
  teamName: "Lakers",
  teamAgainstName: "Celtics",
  seasonName: "2025/26",
  wedgieDate: "2026-01-15T20:00:00.000Z",
  position: { x: 0.5, y: 0.6 },
  videoUrl: { youtube: "https://www.youtube.com/watch?v=abcdefghijk&t=30" },
  types: [{ name: "clutch" }],
  createdAt: "",
  updatedAt: "",
  gameName: "",
} as unknown as Parameters<typeof WedgieModal>[0]["wedgie"];

let writeText = vi.fn<(text: string) => Promise<void>>();
function setClipboard(impl: (text: string) => Promise<void>) {
  writeText = vi.fn(impl);
  Object.assign(navigator, { clipboard: { writeText } });
}

describe("WedgieModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setClipboard(() => Promise.resolve());
    Object.defineProperty(window, "location", {
      writable: true,
      value: { origin: "https://wedgietracker.test" },
    });
  });

  describe("rendering", () => {
    it("shows player, teams, type, and number", () => {
      render(<WedgieModal wedgie={baseWedgie} isOpen onClose={noop} />);

      // "LeBron" / "Lakers" appear in both the sr-only DialogTitle and the
      // visible info panel — use *AllBy* to confirm presence in either.
      expect(screen.getAllByText("LeBron").length).toBeGreaterThan(0);
      expect(screen.getByText("Lakers")).toBeInTheDocument(); // visible <span>
      expect(screen.getAllByText(/vs Celtics/).length).toBeGreaterThan(0);
      expect(screen.getByText("clutch")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("renders 'No video' fallback when videoUrl is null", () => {
      const wedgie = { ...baseWedgie, videoUrl: null };
      render(<WedgieModal wedgie={wedgie} isOpen onClose={noop} />);
      expect(screen.getByText("No video")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
      render(<WedgieModal wedgie={baseWedgie} isOpen={false} onClose={noop} />);
      expect(screen.queryByText("LeBron")).not.toBeInTheDocument();
    });

    it("hides 'vs <opponent>' in the visible panel when opponent contains 'Unknown'", () => {
      const wedgie = { ...baseWedgie, teamAgainstName: "Unknown Team" };
      render(<WedgieModal wedgie={wedgie} isOpen onClose={noop} />);
      // The sr-only DialogTitle still includes the opponent for screen
      // readers; the visible Teams row should drop the "vs ..." suffix.
      const lakersSpan = screen.getByText("Lakers");
      const teamsParagraph = lakersSpan.parentElement!;
      expect(teamsParagraph.textContent).not.toMatch(/Unknown/);
    });
  });

  describe("video source selection", () => {
    it("converts a YouTube watch URL to an embed URL preserving start time", () => {
      render(<WedgieModal wedgie={baseWedgie} isOpen onClose={noop} />);
      const iframe = screen.getByTitle("Video player") as HTMLIFrameElement;
      expect(iframe.src).toBe(
        "https://www.youtube.com/embed/abcdefghijk?start=30",
      );
    });

    it("falls back through the priority list (cloudinary when youtube missing)", () => {
      const wedgie = {
        ...baseWedgie,
        videoUrl: { cloudinary: "https://cdn/example.mp4" },
      };
      render(<WedgieModal wedgie={wedgie} isOpen onClose={noop} />);
      const iframe = screen.getByTitle("Video player") as HTMLIFrameElement;
      expect(iframe.src).toBe("https://cdn/example.mp4");
    });

    it("appends 'embed' for instagram URLs", () => {
      const wedgie = {
        ...baseWedgie,
        videoUrl: { instagram: "https://instagram.com/p/xyz/" },
      };
      render(<WedgieModal wedgie={wedgie} isOpen onClose={noop} />);
      const iframe = screen.getByTitle("Video player") as HTMLIFrameElement;
      expect(iframe.src).toBe("https://instagram.com/p/xyz/embed");
    });

    it("clicking the NoDunks tab switches the iframe source", () => {
      const wedgie = {
        ...baseWedgie,
        videoUrl: {
          youtube: "https://www.youtube.com/watch?v=abcdefghijk",
          youtubeNoDunks: "https://www.youtube.com/watch?v=zzzzzzzzzzz",
        },
      };
      render(<WedgieModal wedgie={wedgie} isOpen onClose={noop} />);

      fireEvent.click(screen.getByRole("button", { name: "NoDunks" }));

      const iframe = screen.getByTitle("Video player") as HTMLIFrameElement;
      expect(iframe.src).toBe("https://www.youtube.com/embed/zzzzzzzzzzz");
    });
  });

  describe("copy link", () => {
    it("writes the share URL to the clipboard and toasts on success", async () => {
      render(<WedgieModal wedgie={baseWedgie} isOpen onClose={noop} />);

      fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
      await Promise.resolve();
      await Promise.resolve();

      expect(writeText).toHaveBeenCalledWith(
        "https://wedgietracker.test/all-wedgies?ws=2025%2F26&wn=42",
      );
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Link copied!" }),
      );
    });

    it("logs and does not toast when clipboard rejects", async () => {
      const errorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      setClipboard(() => Promise.reject(new Error("denied")));

      render(<WedgieModal wedgie={baseWedgie} isOpen onClose={noop} />);
      fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
      await new Promise((r) => setTimeout(r, 0));

      expect(toast).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("navigation", () => {
    it("calls onPrevious / onNext when their guards are true", () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      render(
        <WedgieModal
          wedgie={baseWedgie}
          isOpen
          onClose={noop}
          onPrevious={onPrevious}
          onNext={onNext}
          hasPrevious
          hasNext
        />,
      );

      // The arrow buttons have no accessible name; they're the last two
      // buttons in the document. Use screen so we cross the Radix portal.
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[buttons.length - 2]!);
      fireEvent.click(buttons[buttons.length - 1]!);

      expect(onPrevious).toHaveBeenCalledOnce();
      expect(onNext).toHaveBeenCalledOnce();
    });

    it("does not call onPrevious / onNext when their guards are false", () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      render(
        <WedgieModal
          wedgie={baseWedgie}
          isOpen
          onClose={noop}
          onPrevious={onPrevious}
          onNext={onNext}
        />,
      );

      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[buttons.length - 2]!);
      fireEvent.click(buttons[buttons.length - 1]!);

      expect(onPrevious).not.toHaveBeenCalled();
      expect(onNext).not.toHaveBeenCalled();
    });
  });

  describe("share section", () => {
    it("passes the correct share URL and title to ShareButtons", () => {
      render(<WedgieModal wedgie={baseWedgie} isOpen onClose={noop} />);
      const share = screen.getByTestId("share-buttons");
      expect(share.getAttribute("data-url")).toBe(
        "/all-wedgies?ws=2025%2F26&wn=42",
      );
      expect(share.getAttribute("data-title")).toContain("LeBron");
    });
  });
});
