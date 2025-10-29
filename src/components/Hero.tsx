import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import heroImage from "@/assets/beach-house-hero.jpg";

export const Hero = () => {
  const scrollToBooking = () => {
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 animate-float"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
      </div>

      {/* Floating Water Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-ripple" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-ripple animation-delay-1000" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in text-white drop-shadow-2xl">
          Seu Paraíso na Praia
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl text-white/90 drop-shadow-lg animate-fade-in animation-delay-200">
          Luxo, conforto e vista para o mar. Reserve agora sua experiência inesquecível.
        </p>
        <Button
          onClick={scrollToBooking}
          size="lg"
          className="bg-gradient-ocean text-white shadow-ocean hover:scale-105 transition-transform animate-fade-in animation-delay-400"
        >
          Reservar Agora
        </Button>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-white/80" />
      </div>
    </section>
  );
};
