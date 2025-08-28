
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { NotebookText, Carrot, LayoutDashboard, Settings, ChefHat } from 'lucide-react';

const Logo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
);


export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-lg">
                    <Logo />
                </Button>
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Le Singulier</h2>
                </div>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard'}
                  tooltip="Tableau de bord"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/menu')}
                  tooltip="Menu"
                >
                  <Link href="/menu">
                    <ChefHat />
                    <span>Menu</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/recipes')}
                  tooltip="Recettes"
                >
                  <Link href="/recipes">
                    <NotebookText />
                    <span>Recettes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/ingredients')}
                  tooltip="Ingrédients"
                >
                  <Link href="/ingredients">
                    <Carrot />
                    <span>Ingrédients</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
             <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/settings')}
                    tooltip="Paramètres"
                    >
                    <Link href="/settings">
                        <Settings />
                        <span>Paramètres</span>
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-card/80 px-4 backdrop-blur-sm sm:px-6 md:justify-end">
             <SidebarTrigger className="md:hidden"/>
             {/* Future Header Content */}
          </header>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
