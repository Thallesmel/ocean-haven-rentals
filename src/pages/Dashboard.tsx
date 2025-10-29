import { Navigation } from "@/components/Navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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

  const updateBookingStatus = async (
    bookingId: string,
    status: "pending" | "confirmed" | "cancelled" | "completed"
  ) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success("Status atualizado com sucesso");
      loadBookings();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };
    const labels: any = {
      pending: "Pendente",
      confirmed: "Confirmada",
      cancelled: "Cancelada",
      completed: "Concluída",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
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

          <Card className="glass-ocean border-primary/20">
            <CardHeader>
              <CardTitle>Todas as Reservas</CardTitle>
              <CardDescription>Gerencie suas reservas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hóspede</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.guest_name}</TableCell>
                      <TableCell>
                        {format(new Date(booking.check_in), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.check_out), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>R$ {parseFloat(booking.total_price).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {booking.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "confirmed")}
                            >
                              Confirmar
                            </Button>
                          )}
                          {booking.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateBookingStatus(booking.id, "cancelled")}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
