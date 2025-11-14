import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

// 🔹 Importa automaticamente todas as imagens por pasta
const imageImports = import.meta.glob("@/assets/images/**/*.{jpg,jpeg,png,webp}", {
  eager: true,
});

type RoomType =
  | "all"
  | "Entrance"
  | "KitchenLaundry"
  | "LivingRoom"
  | "PoolBar"
  | "Restroom"
  | "Rooms";

interface RoomGallery {
  name: string;
  key: RoomType;
  images: string[];
  description: string;
}

// 🔹 Agrupa automaticamente as imagens por pasta
const groupImagesByFolder = (): Record<string, string[]> => {
  const grouped: Record<string, string[]> = {};
  Object.keys(imageImports).forEach((path) => {
    const match = path.match(/images\/([^/]+)\//);
    if (match) {
      const folder = match[1];
      if (!grouped[folder]) grouped[folder] = [];
      // @ts-expect-error: Vite ESM glob generates modules with a default export
      grouped[folder].push(imageImports[path].default);
    }
  });
  return grouped;
};

const groupedImages = groupImagesByFolder();

const roomSections: RoomGallery[] = [
  { name: "Entrada", key: "Entrance", images: groupedImages.Entrance || [], description: "Entrada principal e áreas de acesso" },
  { name: "Cozinha e Lavanderia", key: "KitchenLaundry", images: groupedImages.KitchenLaundry || [], description: "Cozinha gourmet e lavanderia completa" },
  { name: "Sala de Estar", key: "LivingRoom", images: groupedImages.LivingRoom || [], description: "Ambiente social com vista e conforto" },
  { name: "Área da Piscina e Bar", key: "PoolBar", images: groupedImages.PoolBar || [], description: "Espaço externo com piscina e bar molhado" },
  { name: "Banheiros", key: "Restroom", images: groupedImages.Restroom || [], description: "Banheiros modernos e bem iluminados" },
  { name: "Quartos", key: "Rooms", images: groupedImages.Rooms || [], description: "Suítes confortáveis e elegantes" },
];

export default function Gallery() {
  const [active, setActive] = useState<RoomType>("all");

  const filteredImages =
    active === "all"
      ? roomSections.flatMap((r) => r.images.map((img) => ({ ...r, image: img })))
      : roomSections
          .find((r) => r.key === active)
          ?.images.map((img) => ({ ...roomSections.find((r) => r.key === active)!, image: img })) || [];

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

          <Tabs value={active} onValueChange={(v) => setActive(v as RoomType)} className="w-full">
            <TabsList className="flex flex-wrap justify-center mb-8 bg-card/40 backdrop-blur-sm p-2 rounded-2xl">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {roomSections.map((room) => (
                <TabsTrigger key={room.key} value={room.key}>
                  {room.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={active}>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredImages.map((room, i) => (
                  <Card
                    key={i}
                    className="overflow-hidden glass-ocean border-primary/20 hover:shadow-ocean transition-all duration-300 hover:scale-105"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <CardContent className="p-0">
                      <div className="relative h-60 overflow-hidden">
                        <img
                          src={room.image}
                          alt={room.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <h3 className="text-lg font-bold text-white">{room.name}</h3>
                          <p className="text-sm text-white/90">{room.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
