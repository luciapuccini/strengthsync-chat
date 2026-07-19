import * as React from "react";

import { Sidebar, SidebarContent } from "@/shadcn/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
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
