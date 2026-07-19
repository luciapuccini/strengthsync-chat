import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppSidebar } from "@/shadcn/app-sidebar";
import { SiteHeader } from "@/shadcn/site-header";
import { SidebarInset, SidebarProvider } from "@/shadcn/ui/sidebar";
import { Toaster } from "@/shadcn/ui/sonner";
import History from "./History/History";
import Plan from "./Plan/Plan";

export default function App() {
  return (
    <BrowserRouter>
      <SidebarProvider
        defaultOpen={false}
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
              <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
                <Routes>
                  <Route path="/" element={<Plan />} />
                  <Route path="/history" element={<History />} />
                </Routes>
              </div>
            </div>
          </div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </BrowserRouter>
  );
}
