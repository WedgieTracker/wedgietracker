import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// --- Mocks ----------------------------------------------------------------

const push = vi.fn();
const refresh = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, back }),
}));

const createMutate = vi.fn();
const updateMutate = vi.fn();
vi.mock("~/trpc/react", () => ({
  api: {
    wedgie: {
      create: { useMutation: () => ({ mutateAsync: createMutate }) },
      update: { useMutation: () => ({ mutateAsync: updateMutate }) },
    },
  },
}));

// Stub the heavy child components to bare inputs/buttons. The form tests are
// about state + submit wiring, not the children's internals (they have their
// own seams to test separately).
vi.mock("./PlayerSearchInput", () => ({
  PlayerSearchInput: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      data-testid="player-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock("./TeamSearchInput", () => ({
  TeamSearchInput: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      data-testid="team-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock("./GameSearchInput", () => ({
  GameSearchInput: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      data-testid="game-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock("./TypeSearchInput", () => ({
  TypeSearchInput: ({
    value,
  }: {
    value: string[];
    onChange: (v: string[]) => void;
  }) => <div data-testid="type-input">{value.join(",")}</div>,
}));
vi.mock("./CourtPositionPicker", () => ({
  CourtPositionPicker: ({
    position,
  }: {
    position: { x: number; y: number };
    onChange: (p: { x: number; y: number }) => void;
  }) => (
    <div data-testid="court-position">
      {position.x},{position.y}
    </div>
  ),
}));
vi.mock("~/components/admin/WedgieSocialShareWrapper", () => ({
  WedgieSocialShareWrapper: () => <div data-testid="social-share" />,
}));
vi.mock("~/components/admin/CloudinaryUpload", () => ({
  CloudinaryUpload: ({ initialUrl }: { initialUrl?: string }) => (
    <div data-testid="cloudinary-upload">{initialUrl}</div>
  ),
}));

const { WedgieFormPage } = await import("./WedgieFormPage");

// --- Fixtures -------------------------------------------------------------

const existingWedgie = {
  id: 42,
  playerName: "LeBron",
  teamName: "Lakers",
  teamAgainstName: "Celtics",
  number: 100,
  seasonName: "2025/26",
  wedgieDate: "2026-01-15T20:00:00.000Z",
  position: { x: 0.5, y: 0.6 },
  videoUrl: { youtube: "https://yt/x", cloudinary: "https://cdn/x" },
  types: [{ id: 1, name: "clutch", createdAt: "", updatedAt: "" }],
  gameName: "LAL @ BOS",
  createdAt: "",
  updatedAt: "",
} as never;

// --- Tests ----------------------------------------------------------------

describe("WedgieFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMutate.mockResolvedValue({ id: 99 });
    updateMutate.mockResolvedValue({ id: 42 });
  });

  describe("create mode", () => {
    it("shows the create heading and submit label", () => {
      render(<WedgieFormPage currentSeason="2025/26" />);
      expect(screen.getByText("Create New Wedgie")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create wedgie/i }),
      ).toBeInTheDocument();
    });

    it("seeds seasonName from currentSeason prop", () => {
      render(<WedgieFormPage currentSeason="2025/26" />);
      expect(screen.getByDisplayValue("2025/26")).toBeInTheDocument();
    });

    it("submits via createMutation and navigates on success", async () => {
      render(<WedgieFormPage currentSeason="2025/26" />);

      fireEvent.change(screen.getByTestId("player-input"), {
        target: { value: "Curry" },
      });
      fireEvent.change(screen.getByLabelText("Wedgie Number"), {
        target: { value: "12" },
      });

      fireEvent.click(screen.getByRole("button", { name: /create wedgie/i }));
      await Promise.resolve(); // let the async submit handler settle

      expect(createMutate).toHaveBeenCalledOnce();
      expect(updateMutate).not.toHaveBeenCalled();
      const arg = createMutate.mock.calls[0]?.[0] as {
        playerName: string;
        number: number;
      };
      expect(arg.playerName).toBe("Curry");
      expect(arg.number).toBe(12);

      expect(push).toHaveBeenCalledWith("/admin/wedgies");
      expect(refresh).toHaveBeenCalledOnce();
    });

    it("does not render the social share section without an existing wedgie", () => {
      render(<WedgieFormPage currentSeason="2025/26" />);
      expect(screen.queryByTestId("social-share")).not.toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    it("shows the edit heading and prefills fields from the wedgie", () => {
      render(<WedgieFormPage wedgie={existingWedgie} />);

      expect(screen.getByText("Edit Wedgie")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /update wedgie/i }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("player-input")).toHaveValue("LeBron");
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2025/26")).toBeInTheDocument();
      expect(screen.getByTestId("type-input")).toHaveTextContent("clutch");
      expect(screen.getByTestId("court-position")).toHaveTextContent("0.5,0.6");
      expect(screen.getByTestId("social-share")).toBeInTheDocument();
    });

    it("submits via updateMutation with the wedgie id", async () => {
      render(<WedgieFormPage wedgie={existingWedgie} />);

      fireEvent.click(screen.getByRole("button", { name: /update wedgie/i }));
      await Promise.resolve();

      expect(updateMutate).toHaveBeenCalledOnce();
      expect(createMutate).not.toHaveBeenCalled();
      const arg = updateMutate.mock.calls[0]?.[0] as {
        id: number;
        data: { playerName: string };
      };
      expect(arg.id).toBe(42);
      expect(arg.data.playerName).toBe("LeBron");

      expect(push).toHaveBeenCalledWith("/admin/wedgies");
    });
  });

  describe("error handling", () => {
    it("does not navigate when the mutation rejects", async () => {
      const errorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      createMutate.mockRejectedValueOnce(new Error("boom"));

      render(<WedgieFormPage currentSeason="2025/26" />);
      fireEvent.click(screen.getByRole("button", { name: /create wedgie/i }));
      await new Promise((r) => setTimeout(r, 0));

      expect(push).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("navigation buttons", () => {
    it("Back and Cancel both call router.back()", () => {
      render(<WedgieFormPage currentSeason="2025/26" />);
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(back).toHaveBeenCalledTimes(2);
    });
  });
});
