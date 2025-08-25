
export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Vue d'ensemble de votre activité.</p>
                </div>
            </header>
            <div className="flex h-[400px] items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">Le contenu du dashboard arrive bientôt.</p>
            </div>
        </div>
    </div>
  );
}
