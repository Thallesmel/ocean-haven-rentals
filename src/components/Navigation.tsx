import { Button } from "./ui/button";
import { Waves, Calendar, Image, LayoutDashboard, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOwnerStatus(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOwnerStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOwnerStatus = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("is_owner")
      .eq("id", userId)
      .single();
    setIsOwner(data?.is_owner || false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-ocean border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Waves className="h-8 w-8 text-primary animate-wave" />
            <span className="text-2xl font-bold text-gradient">Casa Pura Vida</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/gallery">
              <Button variant="ghost" size="sm" className="gap-2">
                <Image className="h-4 w-4" />
                Galeria
              </Button>
            </Link>
            <Link to="/#book">
              <Button variant="ghost" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Reservar
              </Button>
            </Link>
            {user ? (
              <>
                {isOwner && (
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Link to="/my-booking">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Minhas Reservas
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button> 
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="gap-2 hover:bg-green-400">
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
