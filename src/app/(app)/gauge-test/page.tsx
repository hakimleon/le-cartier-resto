
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GaugeTestPage() {
  const mockData = [
    { name: 'Exceptionnel', value: 20, label: "Food Cost < 25%" },
    { name: 'Excellent', value: 28, label: "Food Cost 25-30%" },
    { name: 'Bon', value: 33, label: "Food Cost 30-35%" },
    { name: 'Moyen', value: 38, label: "Food Cost 35-40%" },
    { name: 'Mauvais', value: 45, label: "Food Cost > 40%" },
  ];

  return (
    <div className="container mx-auto py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Test de la Jauge</h1>
        <p className="text-muted-foreground">
          Cette page sert à tester le composant GaugeChart avec différentes valeurs.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockData.map((data) => (
          <Card key={data.name}>
            <CardHeader>
              <CardTitle>{data.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <GaugeChart
                value={data.value}
                label={data.label}
                unit="%"
              />
            </CardContent>
          </Card>
        ))}
         <Card>
            <CardHeader>
              <CardTitle>Cas Limite: 0%</CardTitle>
            </CardHeader>
            <CardContent>
              <GaugeChart
                value={0}
                label={"Food Cost 0%"}
                unit="%"
              />
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Cas Limite: 100%</CardTitle>
            </CardHeader>
            <CardContent>
              <GaugeChart
                value={100}
                label={"Food Cost 100%"}
                unit="%"
              />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
