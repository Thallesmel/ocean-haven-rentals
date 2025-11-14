import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { parse, eachDayOfInterval, format } from 'date-fns';
import type { DateRange, SelectRangeEventHandler } from 'react-day-picker';

function parseICS(icsText: string): DateRange[] {
  const lines = icsText.split(/\r?\n/);
  const ranges: DateRange[] = [];
  let current: { dtstart?: Date; dtend?: Date } = {};

  const parseIcsDate = (value: string): Date => {
    if (/^\d{8}$/.test(value)) {
      return parse(value, 'yyyyMMdd', new Date());
    }
    if (/^\d{8}T\d{6}Z$/.test(value)) {
      const year = Number(value.slice(0, 4));
      const month = Number(value.slice(4, 6)) - 1;
      const day = Number(value.slice(6, 8));
      const hour = Number(value.slice(9, 11));
      const minute = Number(value.slice(11, 13));
      const second = Number(value.slice(13, 15));
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
    return new Date(value);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('BEGIN:VEVENT')) {
      current = {};
      continue;
    }
    if (line.startsWith('DTSTART')) {
      const [, val] = line.split(':');
      current.dtstart = parseIcsDate(val);
      continue;
    }
    if (line.startsWith('DTEND')) {
      const [, val] = line.split(':');
      current.dtend = parseIcsDate(val);
      continue;
    }
    if (line.startsWith('END:VEVENT')) {
      if (current.dtstart && current.dtend) {
        const inclusiveEnd = new Date(current.dtend);
        inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
        ranges.push({ from: current.dtstart, to: inclusiveEnd });
      }
      current = {};
      continue;
    }
  }
  return ranges;
}

export function ICSCalendarPreview() {
  const [disabledRanges, setDisabledRanges] = useState<DateRange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(1);
  const [selected, setSelected] = useState<DateRange | undefined>();
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    const loadIcs = async () => {
      try {
        const res = await fetch('/export.ics');
        if (!res.ok) {
          setError('Arquivo export.ics não encontrado');
          return;
        }
        const text = await res.text();
        const ranges = parseICS(text);
        setDisabledRanges(ranges);
        setError(null);
      } catch (e) {
        setError('Falha ao ler export.ics');
      }
    };
    loadIcs();
  }, []);

  useEffect(() => {
    const updateMonths = () => {
      const w = window.innerWidth;
      if (w >= 1024) {
        setMonths(2);
      } else {
        setMonths(1);
      }
    };
    updateMonths();
    window.addEventListener('resize', updateMonths);
    return () => window.removeEventListener('resize', updateMonths);
  }, []);

  const disabled = useMemo(() => disabledRanges, [disabledRanges]);
  const unavailableDates = useMemo(() => {
    return Object.entries(availability)
      .filter(([, avail]) => avail === false)
      .map(([dateStr]) => new Date(dateStr));
  }, [availability]);
  const notedDates = useMemo(
    () => Object.keys(notes).map((d) => new Date(d)),
    [notes]
  );

  const applyAvailability = (isAvailable: boolean) => {
    if (!selected?.from || !selected?.to) return;
    const days = eachDayOfInterval({ start: selected.from, end: selected.to });
    const updates: Record<string, boolean> = {};
    for (const day of days) {
      updates[format(day, 'yyyy-MM-dd')] = isAvailable;
    }
    setAvailability((prev) => ({ ...prev, ...updates }));
  };

  const blockSelectedRange = () => {
    if (!selected?.from || !selected?.to) return;
    setDisabledRanges((prev) => [
      ...prev,
      { from: selected.from, to: selected.to },
    ]);
  };

  const saveNotesForSelection = () => {
    if (!selected?.from || !selected?.to || !noteDraft.trim()) return;
    const days = eachDayOfInterval({ start: selected.from, end: selected.to });
    const updates: Record<string, string> = {};
    for (const day of days) {
      updates[format(day, 'yyyy-MM-dd')] = noteDraft.trim();
    }
    setNotes((prev) => ({ ...prev, ...updates }));
    setNoteDraft('');
  };

  const handleRangeSelect: SelectRangeEventHandler = (range) => {
    setSelected(range);
  };

  return (
    <Card className='glass-ocean border-primary/20 mb-8 min-h-[60vh]'>
      <CardHeader>
        <CardTitle>Calendário</CardTitle>
        <CardDescription>
          Datas ocupadas são carregadas de um arquivo ICS (export.ics)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-2 mb-4'>
          <Badge>Ocupado</Badge>
          {disabledRanges.length > 0 && (
            <p className='text-sm text-muted-foreground'>
              {disabledRanges.length} intervalo(s) bloqueado(s)
            </p>
          )}
          {error && <p className='text-sm text-destructive'>{error}</p>}
        </div>
        <div className='mb-4'>
          <input
            type='file'
            accept='.ics,text/calendar'
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const ranges = parseICS(text);
                setDisabledRanges(ranges);
                setError(null);
              } catch {
                setError('Falha ao processar o arquivo ICS');
              }
            }}
            className='text-sm'
          />
          <p className='text-xs text-muted-foreground mt-1'>
            Carregue um arquivo .ics para atualizar as datas ocupadas
          </p>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4'>
          <div className='w-full min-w-0 overflow-hidden'>
            <Calendar
              className='w-full'
              disabled={disabled}
              showOutsideDays
              numberOfMonths={months}
              mode='range'
              selected={selected}
              onSelect={handleRangeSelect}
              modifiers={{ unavailable: unavailableDates, noted: notedDates }}
              modifiersClassNames={{
                unavailable: 'bg-destructive/30 text-destructive-foreground',
                noted: 'ring-2 ring-accent',
              }}
              classNames={{
                months: 'grid grid-cols-1 md:grid-cols-2 gap-4',
                month: 'space-y-4',
                caption_label: 'text-base md:text-lg font-semibold',
                head_cell:
                  'text-muted-foreground rounded-md w-10 sm:w-12 md:w-14 font-normal text-[0.8rem]',
                cell: 'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-center text-sm p-0 relative',
                day: 'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 p-0 font-normal',
              }}
            />
          </div>

          <div className='w-full min-w-0'>
            <Card className='bg-background/50 border-gradient-ocean rounded-2xl lg:sticky lg:top-24'>
              <CardHeader>
                <CardTitle>Gerenciar Período</CardTitle>
                <CardDescription>
                  Selecione um intervalo e aplique as regras
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Disponível</span>
                  <Switch
                    className='scale-90'
                    checked={(() => {
                      if (!selected?.from || !selected?.to) return true;
                      const days = eachDayOfInterval({
                        start: selected.from,
                        end: selected.to,
                      });
                      const vals = days.map(
                        (d) => availability[format(d, 'yyyy-MM-dd')] ?? true
                      );
                      return vals.every((v) => v);
                    })()}
                    onCheckedChange={(checked) => applyAvailability(checked)}
                  />
                </div>

                <Button
                  variant='gradient'
                  size='sm'
                  className='shadow-ocean'
                  onClick={blockSelectedRange}
                  disabled={!selected?.from || !selected?.to}
                >
                  Bloquear período selecionado
                </Button>

                <div className='space-y-2'>
                  <span className='text-sm'>Notas</span>
                  <Textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder='Adicione uma nota para as datas selecionadas'
                    rows={2}
                  />
                  <Button
                    size='sm'
                    variant='gradient'
                    className='shadow-ocean'
                    onClick={saveNotesForSelection}
                    disabled={
                      !selected?.from || !selected?.to || !noteDraft.trim()
                    }
                  >
                    Salvar notas para o período
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ICSCalendarPreview;