import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ICalSync } from '@/components/ICalSync';
import { ICSCalendarPreview } from '@/components/ICSCalendarPreview';

export default function Dashboard() {
  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <div className='pt-24 pb-12 px-4'>
        <div className='container mx-auto'>
          <h1 className='text-5xl font-bold mb-12 text-gradient'>Dashboard</h1>

          <div className='grid md:grid-cols-3 gap-6 mb-8'>
            <Card className='glass-ocean border-primary/20'>
              <CardHeader>
                <CardTitle>Total de Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-4xl font-bold text-primary'>example</p>
              </CardContent>
            </Card>

            <Card className='glass-ocean border-primary/20'>
              <CardHeader>
                <CardTitle>Reservas Confirmadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-4xl font-bold text-primary'>example</p>
              </CardContent>
            </Card>

            <Card className='glass-ocean border-primary/20'>
              <CardHeader>
                <CardTitle>Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-4xl font-bold text-primary'>R$ example</p>
              </CardContent>
            </Card>
          </div>

          <ICSCalendarPreview />
          <ICalSync />
        </div>
      </div>
    </div>
  );
}
