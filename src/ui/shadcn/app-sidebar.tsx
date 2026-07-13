import * as React from "react"

import ChatPanel from "@/ChatPanel/ChatPanel"
import { Sidebar, SidebarContent } from "@/shadcn/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <ChatPanel />
      </SidebarContent>
    </Sidebar>
  )
}
