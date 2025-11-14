import { Navigation } from "@/components/Navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";

export default function MyBooking() {
  const navigate = useNavigate();
  type Booking = {
    id: string;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    check_in: string;
    check_out: string;
    number_of_guests: number;
    total_price: number | string;
  };
  type Message = {
    id: string;
    booking_id: string;
    sender_id: string | null;
    message: string;
    is_from_owner: boolean;
    created_at: string;
  };
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBookingAndMessages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (bookingData) {
      setBooking(bookingData as Booking);
      loadMessages(bookingData.id);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadBookingAndMessages();
  }, [loadBookingAndMessages]);

  

  const loadMessages = async (bookingId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !booking) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("messages").insert({
      booking_id: booking.id,
      sender_id: user?.id,
      message: newMessage,
      is_from_owner: false,
    });

    if (error) {
      toast.error("Erro ao enviar mensagem");
    } else {
      setNewMessage("");
      loadMessages(booking.id);
      toast.success("Mensagem enviada!");
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
    const variants: Record<Booking["status"], "secondary" | "default" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };
    const labels: Record<Booking["status"], string> = {
      pending: "Pendente",
      confirmed: "Confirmada",
      cancelled: "Cancelada",
      completed: "Concluída",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Nenhuma reserva encontrada</h1>
            <p className="text-muted-foreground mb-8">Você ainda não tem reservas.</p>
            <Button onClick={() => navigate("/#book")}>Fazer uma Reserva</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold mb-12 text-gradient">Minha Reserva</h1>

          <Card className="glass-ocean border-primary/20 mb-8">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Detalhes da Reserva</CardTitle>
                  <CardDescription>Código: {booking.id.slice(0, 8)}</CardDescription>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-bold">
                    {format(new Date(booking.check_in), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-bold">
                    {format(new Date(booking.check_out), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hóspedes</p>
                  <p className="font-bold">{booking.number_of_guests}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-primary text-xl">
                    R$ {(
                      typeof booking.total_price === "string"
                        ? parseFloat(booking.total_price)
                        : booking.total_price
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-ocean border-primary/20">
            <CardHeader>
              <CardTitle>Mensagens</CardTitle>
              <CardDescription>Entre em contato conosco sobre sua reserva</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma mensagem ainda. Envie uma mensagem se tiver alguma dúvida!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.is_from_owner ? "bg-primary/10" : "bg-accent/10"
                      }`}
                    >
                      <p className="font-bold text-sm mb-1">
                        {msg.is_from_owner ? "Proprietário" : "Você"}
                      </p>
                      <p>{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <Button onClick={sendMessage} className="bg-gradient-ocean">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
