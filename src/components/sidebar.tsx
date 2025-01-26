import { Home, Settings, LoaderPinwheel, User, Users } from "lucide-react";

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
    <Sidebar className="border-r-2 border-yellow bg-yellow">
      <SidebarContent className="bg-yellow text-black">
        <SidebarGroup>
          <SidebarGroupLabel className="inline-block bg-darkpurple px-4 py-2 text-center font-bold uppercase text-yellow">
            Admin Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-4">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-black/20">
                    <a href={item.url}>
                      <item.icon />
                      <span className="font-bold text-black">{item.title}</span>
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
