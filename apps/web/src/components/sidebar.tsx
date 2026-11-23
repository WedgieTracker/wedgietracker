import {
  Coffee,
  Flag,
  Home,
  LoaderPinwheel,
  Settings,
  User,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Wedgies",
    url: "/admin/wedgies",
    icon: LoaderPinwheel,
  },
  {
    title: "Reports",
    url: "/admin/reports",
    icon: Flag,
  },
  {
    title: "Coffee names",
    url: "/admin/coffees",
    icon: Coffee,
  },
  {
    title: "Players",
    url: "/admin/players",
    icon: User,
  },
  {
    title: "Teams",
    url: "/admin/teams",
    icon: Users,
  },
  {
    title: "Globals",
    url: "/admin/globals",
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-violet/25 bg-panel border-r">
      <SidebarContent className="bg-panel text-cream">
        <SidebarGroup>
          <SidebarGroupLabel className="bg-cream text-night inline-block h-auto rounded-xl px-4 py-2.5 text-center text-[15px] leading-none font-black tracking-[-0.02em]">
            Admin dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-4">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="text-cream/85 hover:bg-violet/15 hover:text-cream active:bg-violet/25 active:text-cream h-10 rounded-xl"
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span className="font-extrabold">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
