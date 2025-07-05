import { SidebarTrigger } from "@/components/ui/sidebar"

type AppHeaderProps = {
  title: string;
  children?: React.ReactNode;
}

export function AppHeader({ title, children }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 p-4 lg:p-6 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-2xl font-bold font-headline tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </header>
  )
}
