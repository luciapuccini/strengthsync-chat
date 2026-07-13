import { AppSidebar } from "@/shadcn/app-sidebar";
import { ChartAreaInteractive } from "@/shadcn/chart-area-interactive";
import { DataTable } from "@/shadcn/data-table";
import { SectionCards } from "@/shadcn/section-cards";
import { SiteHeader } from "@/shadcn/site-header";
import { SidebarInset, SidebarProvider } from "@/shadcn/ui/sidebar";

import data from "../app/dashboard/data.json";

export default function App() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
