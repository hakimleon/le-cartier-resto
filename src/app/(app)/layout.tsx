
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { NotebookText, Carrot, LayoutDashboard, Settings, ChefHat, FlaskConical, CookingPot, Banknote, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import FloatingAssistant from '@/app/(app)/assistant/FloatingAssistant';

const Logo = () => (
    <svg role="img" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="hsl(var(--primary-foreground))">
        <path d="M50 10 C 40 10, 30 20, 30 30 C 30 40, 40 50, 50 50 C 60 50, 70 40, 70 30 C 70 20, 60 10, 50 10 Z M 50 15 C 57 15, 65 23, 65 30 C 65 37, 57 45, 50 45 C 43 45, 35 37, 35 30 C 35 23, 43 15, 50 15 Z" />
        <path d="M40 55 L 40 90 L 45 90 L 45 60 C 45 57.5, 47.5 55, 50 55 C 52.5 55, 55 57.5, 55 60 L 55 90 L 60 90 L 60 55 L 40 55 Z" />
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
      <div className="flex min-h-screen bg-background ">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-lg bg-primary">
                    <Logo />
                </Button>
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Le Cartier</h2>
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
              
              <SidebarSeparator className="my-2" />
              
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/cash-register')}
                  tooltip="Caisse"
                >
                  <Link href="/cash-register">
                    <Banknote />
                    <span>Caisse</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/sales')}
                  tooltip="Ventes"
                >
                  <Link href="/sales">
                    <Receipt />
                    <span>Ventes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarSeparator className="my-2" />

              {/* Groupe Plats */}
              <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/workshop')} tooltip="Atelier Plats">
                    <Link href="/workshop">
                      <FlaskConical />
                      <span>Atelier Plats</span>
                    </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/menu')} tooltip="Menu">
                  <Link href="/menu">
                    <ChefHat />
                    <span>Menu & Plats</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarSeparator className="my-2" />

              {/* Groupe Préparations */}
              <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/preparations/workshop')} tooltip="Atelier Préparations">
                    <Link href="/preparations/workshop">
                      <FlaskConical />
                      <span>Atelier Préparations</span>
                    </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/preparations-base')} tooltip="Préparations de Base">
                  <Link href="/preparations-base">
                    <NotebookText />
                    <span>Préparations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarSeparator className="my-2" />

              {/* Groupe Garnitures */}
               <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/garnishes/workshop')} tooltip="Atelier Garnitures">
                  <Link href="/garnishes/workshop">
                    <FlaskConical />
                    <span>Atelier Garnitures</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/garnishes') && !pathname.includes('workshop')} tooltip="Garnitures">
                  <Link href="/garnishes">
                    <CookingPot />
                    <span>Garnitures</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
             
              <SidebarSeparator className="my-2" />

              {/* Section Ingrédients */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/ingredients')} tooltip="Ingrédients">
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
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-card/80 px-4 backdrop-blur-sm sm:justify-end">
             <SidebarTrigger className="md:hidden"/>
             {/* Future Header Content */}
          </header>
          <main className={cn("flex-1 overflow-y-auto", "p-4 md:p-8 pt-6")}>
             {children}
          </main>
           <FloatingAssistant />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
