import { Navigation } from "@/components/Navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DashboardCalendar } from "@/components/DashboardCalendar";
import { ICalSync } from "@/components/ICalSync";

export default function Dashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    checkOwnerAndLoadBookings();
  }, []);

  const checkOwnerAndLoadBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_owner")
      .eq("id", user.id)
      .single();

    if (!profile?.is_owner) {
      toast.error("Acesso negado. Apenas o proprietário pode acessar o dashboard.");
      navigate("/");
      return;
    }

    setIsOwner(true);
    loadBookings();
  };

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar reservas");
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };


  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold mb-12 text-gradient">Dashboard</h1>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-ocean border-primary/20">
              <CardHeader>
                <CardTitle>Total de Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{bookings.length}</p>
              </CardContent>
            </Card>

            <Card className="glass-ocean border-primary/20">
              <CardHeader>
                <CardTitle>Reservas Confirmadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">
                  {bookings.filter((b) => b.status === "confirmed").length}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-ocean border-primary/20">
              <CardHeader>
                <CardTitle>Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">
                  R${" "}
                  {bookings
                    .filter((b) => b.status === "confirmed" || b.status === "completed")
                    .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0)
                    .toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          <DashboardCalendar bookings={bookings} onUpdate={loadBookings} />

          <ICalSync />
        </div>
      </div>
    </div>
  );
}
