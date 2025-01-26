import { SidebarTrigger } from "~/components/ui/sidebar";
import { LogoComponent } from "~/components/logo";
import { SignOut } from "~/components/admin/auth";

export function AdminHeader() {
  return (
    <div className="flex items-center justify-between border-b-2 border-yellow bg-darkpurple px-4 py-4 shadow-sm md:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger
          variant={"secondary"}
          className="bg-yellow text-black hover:bg-yellow/80"
        />
        <LogoComponent />
      </div>

      <SignOut />
    </div>
  );
}
