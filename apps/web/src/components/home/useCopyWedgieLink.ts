import { buildAllWedgiesQuery } from "@wedgietracker/core/utils/allWedgiesUrl";
import { useToast } from "~/hooks/use-toast";

interface CopyableWedgie {
  seasonName?: string;
  number?: number;
}

export function buildShareParams(wedgie: CopyableWedgie) {
  return new URLSearchParams(
    buildAllWedgiesQuery({
      season: wedgie.seasonName ?? "",
      wedgie: wedgie.number ?? null,
    }),
  );
}

export function useCopyWedgieLink(wedgie: CopyableWedgie) {
  const { toast } = useToast();

  return async () => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/all-wedgies?${buildShareParams(wedgie).toString()}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Link copied!",
        description: "The wedgie link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };
}
