"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Warehouse,
  Sparkles,
  DollarSign,
  MessageSquare,
  ChefHat,
  LogOut,
  Settings,
  BarChart3,
  Wand2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/menu", icon: BookOpen, label: "Menu Digital" },
  { href: "/reservations", icon: Calendar, label: "Réservations" },
  { href: "/inventory", icon: Warehouse, label: "Inventaire" },
  { href: "/menu-performance", icon: BarChart3, label: "Analyse Menu" },
  { href: "/ai-menu-optimizer", icon: Sparkles, label: "Optimiseur IA" },
  { href: "/ai-pricing-tool", icon: DollarSign, label: "Prix Dynamique IA" },
  { href: "/daily-menu-generator", icon: Wand2, label: "Générateur de Menu" },
  { href: "/feedback", icon: MessageSquare, label: "Avis Clients" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl font-headline group-data-[collapsible=icon]:hidden">Le Singulier</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <div className="flex flex-col gap-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Paramètres">
                        <Settings />
                        <span>Paramètres</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Déconnexion">
                        <LogOut />
                        <span>Déconnexion</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <div className="border-t my-2 border-border/50"></div>
            <div className="flex items-center gap-3 px-2">
                <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="Chef" data-ai-hint="chef portrait" />
                    <AvatarFallback>C</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="font-semibold text-sm">Chef Auguste</span>
                    <span className="text-xs text-muted-foreground">Propriétaire</span>
                </div>
            </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
