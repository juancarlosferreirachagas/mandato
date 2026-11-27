/**
 * ============================================================================
 * VISUALIZAÇÕES INTERATIVAS MODERNAS (RECHARTS)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * Gráficos responsivos com tooltips executivos, gradientes da paleta oficial
 * de Guarulhos (#162b4d, #1e5fa8, #059669, #d4a017) e interação por clique.
 * ============================================================================
 */

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DespesaPorArea, PontoMensal } from '@/repositories/despesasRepository';
import { PLATAFORMA } from '@/domain/plataforma';
import { brl, brlCompacto, inteiro, mesAbrev, mesNome } from '../format';

const CORES_AREAS = [
  '#162b4d',
  '#1e5fa8',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#c5221f',
  '#475569',
];

function formatarEixoY(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace('.', ',')} bi`;
  if (Math.abs(v) >= 1_000_000) return `${Math.round(v / 1_000_000)} mi`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)} mil`;
  return String(Math.round(v));
}

function TooltipPadrao({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  return (
    <div className="fg-chart-tooltip">
      <div className="fg-chart-tooltip__title">{row?.tituloCompleto || label}</div>
      {payload.map((entry, idx) => (
        <div key={idx} className="fg-chart-tooltip__row">
          <span className="fg-chart-tooltip__dot" style={{ background: entry.color }} />
          <span className="fg-chart-tooltip__lbl">{entry.name}:</span>
          <strong className="fg-chart-tooltip__val">{brl(Number(entry.value || 0))}</strong>
        </div>
      ))}
      {row?.qtd != null && (
        <div className="fg-chart-tooltip__meta">{inteiro(row.qtd)} pagamentos liquidados</div>
      )}
      {row?.saldo != null && (
        <div className="fg-chart-tooltip__meta">
          Saldo no mês: <strong>{brlCompacto(row.saldo)}</strong>
        </div>
      )}
    </div>
  );
}

/** Gráfico de Área interativo de gastos mês a mês (suporta 1 ano ou série 2025–2026). */
export function GraficoAreaMensal({
  pontos,
  onSelecionarMes,
  altura = 270,
}: {
  pontos: PontoMensal[];
  onSelecionarMes?: (mes: number, exercicio: number) => void;
  altura?: number;
}) {
  const dados = useMemo(() => {
    const multiAno = new Set(pontos.map((p) => p.exercicio)).size > 1;
    return pontos.map((p) => ({
      mes: p.mes,
      exercicio: p.exercicio,
      label: multiAno ? `${mesAbrev(p.mes)}/${String(p.exercicio).slice(2)}` : mesAbrev(p.mes),
      tituloCompleto: `${mesNome(p.mes)} de ${p.exercicio}`,
      valor: p.total_liquido,
      qtd: p.qtd,
    }));
  }, [pontos]);

  if (dados.length === 0) return <p className="muted">Sem dados para o período.</p>;

  return (
    <div className="fg-recharts-box" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={dados}
          margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
          onClick={(st: any) => {
            const p = st?.activePayload?.[0]?.payload;
            if (p && onSelecionarMes) onSelecionarMes(p.mes, p.exercicio);
          }}
        >
          <defs>
            <linearGradient id="fgAreaAzul" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1e5fa8" stopOpacity={0.34} />
              <stop offset="95%" stopColor="#1e5fa8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatarEixoY}
            tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip content={<TooltipPadrao />} />
          <Area
            type="monotone"
            dataKey="valor"
            name="Total pago"
            stroke="#162b4d"
            strokeWidth={2.6}
            fill="url(#fgAreaAzul)"
            activeDot={{ r: 6, fill: '#c5221f', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Gráfico de Barras Agrupadas Receita Arrecadada x Despesa Paga mês a mês. */
export function GraficoReceitaDespesaModerno({
  rec,
  desp,
  onSelecionarMes,
  altura = 290,
}: {
  rec: { exercicio: number; mes: number; v: number }[];
  desp: { exercicio: number; mes: number; v: number }[];
  onSelecionarMes?: (mes: number, exercicio: number) => void;
  altura?: number;
}) {
  const dados = useMemo(() => {
    const mapa = new Map<string, { exercicio: number; mes: number; receita: number; despesa: number }>();
    for (const r of rec) {
      const k = `${r.exercicio}-${r.mes}`;
      const it = mapa.get(k) ?? { exercicio: r.exercicio, mes: r.mes, receita: 0, despesa: 0 };
      it.receita = r.v;
      mapa.set(k, it);
    }
    for (const d of desp) {
      const k = `${d.exercicio}-${d.mes}`;
      const it = mapa.get(k) ?? { exercicio: d.exercicio, mes: d.mes, receita: 0, despesa: 0 };
      it.despesa = Math.max(0, d.v);
      mapa.set(k, it);
    }
    const lista = [...mapa.values()].sort((a, b) => a.exercicio - b.exercicio || a.mes - b.mes);
    const multiAno = new Set(lista.map((x) => x.exercicio)).size > 1;
    return lista.map((x) => ({
      ...x,
      label: multiAno ? `${mesAbrev(x.mes)}/${String(x.exercicio).slice(2)}` : mesAbrev(x.mes),
      tituloCompleto: `${mesNome(x.mes)} de ${x.exercicio}`,
      saldo: Math.round((x.receita - x.despesa) * 100) / 100,
    }));
  }, [rec, desp]);

  if (dados.length === 0) return <p className="muted">Sem dados para o período.</p>;

  return (
    <div className="fg-recharts-box" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dados}
          margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
          barGap={3}
          onClick={(st: any) => {
            const p = st?.activePayload?.[0]?.payload;
            if (p && onSelecionarMes) onSelecionarMes(p.mes, p.exercicio);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatarEixoY}
            tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip content={<TooltipPadrao />} />
          <Legend
            wrapperStyle={{ fontSize: '0.78rem', paddingTop: 6 }}
            iconType="circle"
          />
          <Bar dataKey="receita" name="Dinheiro que entrou" fill="#059669" radius={[5, 5, 0, 0]} maxBarSize={24} />
          <Bar dataKey="despesa" name="Dinheiro gasto" fill="#162b4d" radius={[5, 5, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Gráfico Donut interativo mostrando a fatia de cada área da cidade. */
export function GraficoRoscaAreas({
  areas,
  onSelecionarArea,
}: {
  areas: DespesaPorArea[];
  onSelecionarArea?: (area: DespesaPorArea) => void;
}) {
  const total = useMemo(() => areas.reduce((s, a) => s + Math.max(0, a.total_liquido), 0), [areas]);
  const dados = useMemo(
    () =>
      areas.map((a, idx) => ({
        ...a,
        valor: Math.max(0, a.total_liquido),
        pct: total > 0 ? Math.round((a.total_liquido / total) * 1000) / 10 : 0,
        cor: CORES_AREAS[idx % CORES_AREAS.length],
      })),
    [areas, total]
  );

  if (dados.length === 0) return null;

  return (
    <div className="fg-donut-layout">
      <div className="fg-donut-chart-wrap">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="area"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={98}
              paddingAngle={2}
              onClick={(entry: any) => {
                if (onSelecionarArea && entry?.area) onSelecionarArea(entry);
              }}
              style={{ cursor: onSelecionarArea ? 'pointer' : 'default' }}
            >
              {dados.map((d) => (
                <Cell key={d.area} fill={d.cor} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any) => [brl(Number(val)), 'Pago']}
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                boxShadow: '0 8px 24px rgba(15,23,42,0.14)',
                fontSize: '0.82rem',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="fg-donut-center" aria-hidden>
          <span>Total pago</span>
          <strong>{brlCompacto(total)}</strong>
          <small>R$ {inteiro(Math.round(total / PLATAFORMA.populacao))}/hab</small>
        </div>
      </div>

      <div className="fg-donut-legend">
        {dados.map((d) => (
          <button
            key={d.area}
            type="button"
            className="fg-donut-legend__item"
            onClick={() => onSelecionarArea?.(d)}
          >
            <span className="fg-donut-legend__dot" style={{ background: d.cor }} />
            <span className="fg-donut-legend__name">{d.area}</span>
            <span className="fg-donut-legend__pct">{d.pct.toLocaleString('pt-BR')}%</span>
            <strong className="fg-donut-legend__val">{brlCompacto(d.valor)}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Gráfico Comparativo Real 2025 vs 2026 mês a mês para a ficha individual de cada empresa. */
export function GraficoCredorComparativo({
  meses2025,
  meses2026,
  altura = 260,
}: {
  meses2025: number[];
  meses2026: number[];
  altura?: number;
}) {
  const dados = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => ({
        mes: idx + 1,
        label: mesAbrev(idx + 1),
        tituloCompleto: `${mesNome(idx + 1)} (comparativo 2025 × 2026)`,
        v2025: Number(meses2025[idx] || 0),
        v2026: idx < meses2026.length ? Number(meses2026[idx] || 0) : 0,
      })),
    [meses2025, meses2026]
  );

  const tem25 = meses2025.some((v) => v > 0);
  const tem26 = meses2026.some((v) => v > 0);

  return (
    <div className="fg-recharts-box" style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatarEixoY}
            tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<TooltipPadrao />} />
          <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: 4 }} iconType="circle" />
          {tem25 && <Bar dataKey="v2025" name="Recebido em 2025" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={18} />}
          {tem26 && <Bar dataKey="v2026" name="Recebido em 2026" fill="#1e5fa8" radius={[4, 4, 0, 0]} maxBarSize={18} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
