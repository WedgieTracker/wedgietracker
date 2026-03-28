import { SidebarTrigger } from "~/components/ui/sidebar";
import { LogoComponent } from "~/components/shared/Logo";
import { SignOut } from "~/components/admin/auth";

export function AdminHeader() {
  return (
    <div className="border-yellow bg-darkpurple flex items-center justify-between border-b-2 px-4 py-4 shadow-xs md:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger
          variant={"secondary"}
          className="bg-yellow hover:bg-yellow/80 text-black"
        />
        <LogoComponent />
      </div>

      <SignOut />
    </div>
  );
}
