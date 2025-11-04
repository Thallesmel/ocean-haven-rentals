import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  number_of_guests: number;
}

interface DashboardCalendarProps {
  bookings: Booking[];
  onUpdate: () => void;
}

export function DashboardCalendar({ bookings, onUpdate }: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week (0 = Sunday)
  const firstDayOfMonth = monthStart.getDay();
  const emptyCells = Array(firstDayOfMonth).fill(null);

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking) => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      return isWithinInterval(day, { start: checkIn, end: checkOut });
    });
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
      setShowDialog(false);
      onUpdate();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
      confirmed: "bg-primary/20 text-primary",
      cancelled: "bg-destructive/20 text-destructive",
      completed: "bg-green-500/20 text-green-700 dark:text-green-300",
    };
    return colors[status] || "";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmada",
      cancelled: "Cancelada",
      completed: "Concluída",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date())}
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="glass-ocean border-primary/20 p-6">
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="text-center font-semibold text-sm py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {emptyCells.map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[120px] p-2 rounded-lg" />
          ))}

          {/* Calendar days */}
          {daysInMonth.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toString()}
                className={`min-h-[120px] p-2 rounded-lg border transition-all ${
                  isCurrentDay
                    ? "bg-primary/10 border-primary"
                    : "bg-background/50 border-border/50 hover:border-primary/30"
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${isCurrentDay ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayBookings.map((booking) => {
                    const isCheckIn = format(parseISO(booking.check_in), "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
                    const isCheckOut = format(parseISO(booking.check_out), "yyyy-MM-dd") === format(day, "yyyy-MM-dd");

                    return (
                      <Button
                      variant="ghost" 
                        key={booking.id}
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDialog(true);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-xs ${getStatusColor(
                          booking.status
                        )} hover:opacity-80 transition-opacity`}
                      >
                        <div className="font-medium truncate">
                          {isCheckIn && "→ "}
                          {booking.guest_name}
                          {isCheckOut && " ←"}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="glass-ocean border-primary/20">
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Hóspede</p>
                <p className="font-semibold">{selectedBooking.guest_name}</p>
                <p className="text-sm">{selectedBooking.guest_email}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-semibold">
                    {format(parseISO(selectedBooking.check_in), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-semibold">
                    {format(parseISO(selectedBooking.check_out), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hóspedes</p>
                  <p className="font-semibold">{selectedBooking.number_of_guests}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold">R$ {parseFloat(selectedBooking.total_price).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Badge className={getStatusColor(selectedBooking.status)}>
                  {getStatusLabel(selectedBooking.status)}
                </Badge>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedBooking.status === "pending" && (
                  <Button
                    onClick={() => updateBookingStatus(selectedBooking.id, "confirmed")}
                    className="flex-1"
                  >
                    Confirmar
                  </Button>
                )}
                {selectedBooking.status !== "cancelled" && (
                  <Button
                    variant="destructive"
                    onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
