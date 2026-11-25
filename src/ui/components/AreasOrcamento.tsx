import {
  ArrowUpRight,
  Bus,
  GraduationCap,
  Handshake,
  HardHat,
  HeartPulse,
  Landmark,
  Shield,
  Wallet,
} from 'lucide-react';
import type { DespesaPorArea } from '@/repositories/despesasRepository';
import { brlCompacto, inteiro } from '../format';

function normalizar(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function IconeArea({ area, size = 20 }: { area: string; size?: number }) {
  const a = normalizar(area);
  if (a.includes('saude') || a.includes('hospital')) return <HeartPulse size={size} aria-hidden />;
  if (a.includes('educa') || a.includes('creche')) return <GraduationCap size={size} aria-hidden />;
  if (a.includes('transport') || a.includes('transito')) return <Bus size={size} aria-hidden />;
  if (a.includes('limpeza') || a.includes('obra')) return <HardHat size={size} aria-hidden />;
  if (a.includes('previden') || a.includes('iprem')) return <Wallet size={size} aria-hidden />;
  if (a.includes('assistencia') || a.includes('cidadania')) return <Handshake size={size} aria-hidden />;
  if (a.includes('seguranca') || a.includes('guarda')) return <Shield size={size} aria-hidden />;
  return <Landmark size={size} aria-hidden />;
}

export function GradeAreas({
  areas,
  totalBase,
  onSelecionar,
}: {
  areas: DespesaPorArea[];
  totalBase: number;
  onSelecionar: (area: DespesaPorArea) => void;
}) {
  return (
    <div className="fg-bento-areas">
      {areas.map((a) => {
        const percentual = totalBase > 0 ? Math.round((a.total_liquido / totalBase) * 1000) / 10 : 0;
        return (
          <button
            key={a.area}
            type="button"
            className="fg-area-card"
            onClick={() => onSelecionar(a)}
            aria-label={`${a.area}: ${brlCompacto(a.total_liquido)}. Ver quem mais recebeu`}
            style={{ font: 'inherit', width: '100%' }}
          >
            <div>
              <div className="fg-area-card__head">
                <span className="fg-area-card__icon" aria-hidden>
                  <IconeArea area={a.area} size={20} />
                </span>
                <span className="fg-area-card__pct">{percentual.toLocaleString('pt-BR')}% do total</span>
              </div>
              <h3 className="fg-area-card__title" style={{ marginTop: 8 }}>
                {a.area}
              </h3>
              <div className="fg-area-card__val" style={{ marginTop: 4 }}>
                {brlCompacto(a.total_liquido)}
              </div>
              <div className="fg-area-card__bar" style={{ marginTop: 6 }}>
                <div
                  className="fg-area-card__fill"
                  style={{ width: `${Math.min(100, Math.max(4, percentual * 2.4))}%` }}
                />
              </div>
              <p className="fg-area-card__desc" style={{ marginTop: 8 }}>
                {a.explicacao_pratica}
              </p>
            </div>
            <div>
              <div className="fg-area-card__meta">
                <span>{inteiro(a.qtd_pagamentos)} pagamentos</span>
                <span>{inteiro(a.qtd_credores)} fornecedores</span>
              </div>
              <div className="fg-area-card__cta">
                <span>Ver quem recebeu</span>
                <ArrowUpRight size={14} aria-hidden />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
