
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
import Image from 'next/image';

const Logo = () => (
    <Image src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgdmlld0JveD0iMCAwIDE1IDE1Ij48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0xMi4wMTcgMTIuNUgxNC41TDEyIDE1di0yLjQ4M2ExLjYyIDEuNjIgMCAwIDEtMS4xMzcuNDhhMS42IDEuNiAwIDAgMS0uOTkzLS4zNDVhNi43ODQgNi43ODQgMCAwIDEgLjAwOC0xMC4zMWExLjYyIDEuNjIgMCAwIDEgMi4xMjIuMTJWMGwyLjUgMi41aC0yLjQ2NGEyIDIgMCAwIDEgLjEyMy4xMjlhMS42MjQgMS42MjQgMCAwIDEtLjI4OCAyLjI4YTMuNTIgMy41MiAwIDAgMC0xLjEyMSAyLjU4NmEzLjU2IDMuNTYgMCAwIDAgMS4xNDcgMi42MTZhMS42MzUgMS42MzUgMCAwIDEgLjIzMiAyLjI3OWMtLjAzNC4wNDEtLjA3NS4wNzItLjExMi4xMU0yLjUwNCAwbC0xIDUuNWMtLjE0Ni44MDUgMS43ODEgMS4xODEgMS43NSAybC0uMjUgNi41YS45NjMuOTYzIDAgMCAwIDEgMWEuOTYzLjk2MyAwIDAgMCAxLTFsLS4yNS02LjVjLS4wMzEtLjgxOCAxLjczMy0xLjE4IDEuNzUtMmwtMS01LjVoLS41bC4yNSA0bC0uNzUuNWwtLjI1LTQuNWgtLjVsLS4yNSA0LjVsLS43NS0uNWwuMjUtNFoiLz48L3N2Zz4=" alt="Le Cartier Logo" width={40} height={40} />
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
                <div className="h-10 w-10 shrink-0">
                    <Logo />
                </div>
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
