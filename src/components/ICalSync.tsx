import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarSync {
  id: string;
  platform: string;
  ical_url: string;
  last_synced_at: string | null;
  is_active: boolean;
}

export function ICalSync() {
  const [syncs, setSyncs] = useState<CalendarSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    loadSyncs();
  }, []);

  const loadSyncs = async () => {
    const { data, error } = await supabase
      .from("calendar_sync")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar sincronizações");
    } else {
      setSyncs(data || []);
    }
    setLoading(false);
  };

  const addSync = async () => {
    if (!newPlatform.trim() || !newUrl.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const { error } = await supabase.from("calendar_sync").insert({
      platform: newPlatform,
      ical_url: newUrl,
    });

    if (error) {
      toast.error("Erro ao adicionar sincronização");
    } else {
      toast.success("Sincronização adicionada com sucesso");
      setNewPlatform("");
      setNewUrl("");
      loadSyncs();
    }
  };

  const removeSync = async (id: string) => {
    const { error } = await supabase
      .from("calendar_sync")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao remover sincronização");
    } else {
      toast.success("Sincronização removida");
      loadSyncs();
    }
  };

  const syncNow = async (id: string) => {
    toast.info("Sincronização iniciada... (funcionalidade em desenvolvimento)");
    // TODO: Implement actual iCal sync logic
    await supabase
      .from("calendar_sync")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", id);
    loadSyncs();
  };

  return (
    <Card className="glass-ocean border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Sincronização de Calendários
        </CardTitle>
        <CardDescription>
          Sincronize com Airbnb, Booking.com e outras plataformas via iCal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new sync */}
        <div className="space-y-3 p-4 rounded-lg bg-background/50">
          <Input
            placeholder="Plataforma (ex: Airbnb, Booking.com)"
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
          />
          <Input
            placeholder="URL do iCal"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <Button onClick={addSync} className="w-full">
            Adicionar Calendário
          </Button>
        </div>

        {/* Existing syncs */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando...</p>
          ) : syncs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum calendário sincronizado
            </p>
          ) : (
            syncs.map((sync) => (
              <div
                key={sync.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{sync.platform}</p>
                    <Badge variant={sync.is_active ? "default" : "secondary"}>
                      {sync.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {sync.ical_url}
                  </p>
                  {sync.last_synced_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Última sincronização:{" "}
                      {format(new Date(sync.last_synced_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => syncNow(sync.id)}
                    title="Sincronizar agora"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removeSync(sync.id)}
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
