import { NavLink, useMatch } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shadcn/ui/sidebar";

const navItems = [
  { to: "/", label: "Plan", end: true },
  { to: "/history", label: "History", end: true },
] as const;

function NavItem({
  to,
  label,
  end,
}: {
  to: string;
  label: string;
  end: boolean;
}) {
  const match = useMatch({ path: to, end });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<NavLink to={to} end={end} />}
        isActive={match != null}
      >
        {label}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto flex flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Chat temporarily disabled
          </p>
          <p className="text-xs text-muted-foreground/80">
            Needs a secure context (HTTPS or localhost). Use the plan tracker
            while debugging Tailscale over http.
          </p>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
