import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { mesAbrev, mesNome, brl, brlCompacto } from '../format';
import type { PontoMensal } from '@/repositories/despesasRepository';

interface BarrasProps {
  pontos: PontoMensal[];
  /** Mês (1-12) destacado, se houver filtro ativo. */
  selecionado?: number | null;
  onSelecionar?: (mes: number, exercicio?: number) => void;
}

/** Barras verticais por mês, em CSS puro. Suporta série de 1 ano ou multi-ano com scroll horizontal suave. */
export function BarrasMensais({ pontos, selecionado, onSelecionar }: BarrasProps) {
  if (pontos.length === 0) return <p className="muted">Sem dados para o período.</p>;
  const max = Math.max(...pontos.map((p) => p.total_liquido), 1);
  const multiAno = new Set(pontos.map((p) => p.exercicio)).size > 1;

  const barras = (
    <div
      className={`fg-bars${multiAno ? ' fg-bars--multi' : ''}`}
      style={multiAno ? ({ '--cols': pontos.length } as CSSProperties) : undefined}
      role="img"
      aria-label="Total pago por mês"
    >
      {pontos.map((p) => {
        const alt = Math.max((Math.max(p.total_liquido, 0) / max) * 100, 1.5);
        const sel = selecionado === p.mes && !multiAno;
        const titulo = `${mesNome(p.mes)}/${p.exercicio}: ${brl(p.total_liquido)} · ${p.qtd} pagamentos`;
        const rotulo = multiAno
          ? `${mesAbrev(p.mes)}/${String(p.exercicio).slice(2)}`
          : mesAbrev(p.mes);
        const conteudo = (
          <>
            <span className="fg-bars__val">{brlCompacto(p.total_liquido).replace('R$ ', '')}</span>
            <div className="fg-bars__bar" style={{ height: `${alt}%` }} />
            <span className="fg-bars__lbl">{rotulo}</span>
          </>
        );
        const cls = `fg-bars__col${sel ? ' is-sel' : ''}`;
        return onSelecionar ? (
          <button
            key={`${p.exercicio}-${p.mes}`}
            type="button"
            className={cls}
            title={titulo}
            aria-pressed={sel}
            onClick={() => onSelecionar(p.mes, p.exercicio)}
          >
            {conteudo}
          </button>
        ) : (
          <div key={`${p.exercicio}-${p.mes}`} className={cls} title={titulo}>
            {conteudo}
          </div>
        );
      })}
    </div>
  );

  return multiAno ? <div className="fg-bars-scroll">{barras}</div> : barras;
}

interface HBarProps {
  nome: string;
  valor: number;
  max: number;
  meta?: string;
  to?: string;
  accent?: boolean;
}

/** Linha com barra horizontal proporcional; vira link quando `to` é informado. */
export function BarraHorizontal({ nome, valor, max, meta, to, accent }: HBarProps) {
  const pct = max > 0 ? Math.max((valor / max) * 100, 1) : 0;
  const corpo = (
    <>
      <div className="fg-hbar__top">
        <span className="fg-hbar__name">{nome}</span>
        <span className="fg-hbar__val">{brlCompacto(valor)}</span>
      </div>
      <div className="fg-hbar__track" aria-hidden>
        <div className={`fg-hbar__fill${accent ? ' fg-hbar__fill--accent' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      {meta && <div className="fg-hbar__meta">{meta}</div>}
    </>
  );
  return to ? (
    <Link className="fg-hbar" to={to}>
      {corpo}
    </Link>
  ) : (
    <div className="fg-hbar">{corpo}</div>
  );
}
