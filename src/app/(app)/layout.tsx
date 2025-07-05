import { AppSidebar } from '@/components/common/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ReactNode } from 'react';

export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
