import { DashboardSidebar } from "@/components/dashboard/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
        <div className="relative flex h-screen w-full">
            <DashboardSidebar />
            <SidebarInset className="flex flex-col">
                {children}
            </SidebarInset>
        </div>
    </SidebarProvider>
  );
}
