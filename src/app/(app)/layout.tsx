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
import { NotebookText, Carrot, LayoutDashboard, Settings, ChefHat, FlaskConical, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const Logo = () => (
    <svg role="img" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" fill="hsl(var(--primary-foreground))" stroke="hsl(var(--primary-foreground))" >
      <path d="M60.6,102.5a2.5,2.5,0,0,0,5,0V50.1a2.5,2.5,0,0,0-5,0V102.5Z" stroke="none"/>
      <path d="M54.5,44.7v-5a2.5,2.5,0,0,1,5,0v5a2.5,2.5,0,0,1-5,0Z" stroke="none"/>
      <path d="M60.6,39.7a2.5,2.5,0,0,1,0-5h2.5a2.5,2.5,0,0,1,0,5Z" stroke="none"/>
      <path d="M74.4,39.7a2.5,2.5,0,0,1,0-5h2.5a2.5,2.5,0,0,1,0,5Z" stroke="none"/>
      <path d="M96.9,49.8V102.5a2.5,2.5,0,0,1-5,0V49.8a7.5,7.5,0,0,0-7.5-7.5H91A2.5,2.5,0,0,1,91,37.3h1a12.5,12.5,0,0,1,12.5,12.5v52.7a2.5,2.5,0,0,1-5,0V50.1a7.5,7.5,0,0,0-7.5-7.5H91A2.5,2.5,0,0,1,91,37.3h.9A12.5,12.5,0,0,1,96.9,49.8Z" stroke="none"/>
      <path d="M80,22.3a42.5,42.5,0,0,0-42.5,42.5V110a5,5,0,0,0,5,5H117.5a5,5,0,0,0,5-5V64.8A42.5,42.5,0,0,0,80,22.3Zm40,87.7H40a2.5,2.5,0,0,1-2.5-2.5V64.8A40,40,0,0,1,80,24.8a40,40,0,0,1,40,40Z" stroke-width="3" fill="none"/>
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
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-lg bg-primary">
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
                  isActive={pathname.startsWith('/preparations')}
                  tooltip="Préparations"
                >
                  <Link href="/preparations">
                    <NotebookText />
                    <span>Préparations</span>
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
                <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/workshop')}
                  tooltip="Atelier des Recettes"
                >
                  <Link href="/workshop">
                    <FlaskConical />
                    <span>Atelier</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/assistant')}
                  tooltip="Assistant IA"
                >
                  <Link href="/assistant">
                    <Bot />
                    <span>Assistant</span>
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
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-card/80 px-4 backdrop-blur-sm sm:justify-end">
             <SidebarTrigger className="md:hidden"/>
             {/* Future Header Content */}
          </header>
          <main className={cn("flex-1 overflow-y-auto", "p-4 md:p-8 pt-6")}>
             {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
