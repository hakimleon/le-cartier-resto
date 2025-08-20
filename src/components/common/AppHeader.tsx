
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "../ui/button";

type AppHeaderProps = {
  title: string;
  children?: React.ReactNode;
}

export function AppHeader({ title, children }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 p-4 lg:px-6 lg:py-4 border-b border-border/20 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div>
            <h1 className="text-2xl font-bold font-headline tracking-tight">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </header>
  )
}
