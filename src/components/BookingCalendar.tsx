import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { addDays, differenceInDays } from "date-fns";

const PRICE_PER_NIGHT = 500; // R$ 500 por noite

export const BookingCalendar = () => {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalNights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = totalNights * PRICE_PER_NIGHT;

  const handleBooking = async () => {
    if (!checkIn || !checkOut) {
      toast.error("Selecione as datas de check-in e check-out");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Faça login para continuar com a reserva");
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          check_in: checkIn.toISOString().split("T")[0],
          check_out: checkOut.toISOString().split("T")[0],
          number_of_guests: numberOfGuests,
          total_price: totalPrice,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Create Stripe payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        "create-payment",
        {
          body: {
            bookingId: data.id,
            amount: totalPrice * 100, // Convert to cents
          },
        }
      );

      if (paymentError) throw paymentError;

      // Redirect to Stripe Checkout
      window.open(paymentData.url, "_blank");
      toast.success("Reserva criada! Redirecionando para pagamento...");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar reserva");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="book" className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
          Reserve Sua Estadia
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="glass-ocean border-primary/20">
            <CardHeader>
              <CardTitle>Selecione as Datas</CardTitle>
              <CardDescription>Escolha check-in e check-out</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="range"
                selected={{ from: checkIn, to: checkOut }}
                onSelect={(range) => {
                  setCheckIn(range?.from);
                  setCheckOut(range?.to);
                }}
                disabled={(date) => date < new Date()}
                className="rounded-md border-primary/20 pointer-events-auto"
              />
            </CardContent>
          </Card>

          <Card className="glass-ocean border-primary/20">
            <CardHeader>
              <CardTitle>Informações do Hóspede</CardTitle>
              <CardDescription>Preencha seus dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Número de Hóspedes</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="10"
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                />
              </div>

              {totalNights > 0 && (
                <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Noites:</span>
                    <span className="font-bold">{totalNights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Preço por noite:</span>
                    <span className="font-bold">R$ {PRICE_PER_NIGHT}</span>
                  </div>
                  <div className="flex justify-between text-lg border-t border-primary/20 pt-2">
                    <span>Total:</span>
                    <span className="font-bold text-primary">R$ {totalPrice}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleBooking}
                disabled={loading || !checkIn || !checkOut || !guestName || !guestEmail}
                className="w-full bg-gradient-ocean"
              >
                {loading ? "Processando..." : "Confirmar Reserva"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
