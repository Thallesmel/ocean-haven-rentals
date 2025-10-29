import { Navigation } from "@/components/Navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import livingRoomImg from "@/assets/living-room.jpg";
import bedroomImg from "@/assets/bedroom.jpg";
import kitchenImg from "@/assets/kitchen.jpg";

const defaultRooms = [
  { id: "1", name: "Sala de Estar", room_type: "living_room", image_url: livingRoomImg, description: "Ampla sala com vista para o mar" },
  { id: "2", name: "Quarto Master", room_type: "bedroom", image_url: bedroomImg, description: "Quarto principal com varanda" },
  { id: "3", name: "Cozinha Gourmet", room_type: "kitchen", image_url: kitchenImg, description: "Cozinha moderna totalmente equipada" },
];

export default function Gallery() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("order_index");

    if (data && data.length > 0) {
      setRooms(data);
    } else {
      setRooms(defaultRooms);
    }
    setLoading(false);
  };

  const roomTypes = [
    { value: "all", label: "Todos" },
    { value: "living_room", label: "Sala de Estar" },
    { value: "bedroom", label: "Quartos" },
    { value: "bathroom", label: "Banheiros" },
    { value: "kitchen", label: "Cozinha" },
    { value: "outdoor", label: "Área Externa" },
  ];

  const filteredRooms = (type: string) => 
    type === "all" ? rooms : rooms.filter((room) => room.room_type === type);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold text-center mb-4 text-gradient animate-fade-in">
            Galeria da Casa
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-12">
            Explore cada cômodo do nosso paraíso à beira-mar
          </p>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-center mb-8 bg-card/50">
              {roomTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {roomTypes.map((type) => (
              <TabsContent key={type.value} value={type.value}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRooms(type.value).map((room, index) => (
                    <Card
                      key={room.id}
                      className="overflow-hidden glass-ocean border-primary/20 hover:shadow-ocean transition-all duration-300 hover:scale-105 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-0">
                        <div className="relative h-64 overflow-hidden">
                          <img
                            src={room.image_url}
                            alt={room.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-2xl font-bold text-white mb-2">
                              {room.name}
                            </h3>
                            <p className="text-white/90">{room.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
