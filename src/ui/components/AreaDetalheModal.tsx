import { Link } from 'react-router-dom';
import { despesasRepository, type DespesaPorArea } from '@/repositories/despesasRepository';
import { useAsync } from '../hooks/useAsync';
import { brl, brlCompacto, dataBr, formatarCnpj, inteiro, nomeLegivel } from '../format';

const POPULACAO_GUARULHOS = 1291771;

export function AreaDetalheModal({
  area,
  ano,
  mes,
  onClose,
}: {
  area: DespesaPorArea;
  ano: number;
  mes?: number | null;
  onClose: () => void;
}) {
  const { data, loading, error } = useAsync(
    () => despesasRepository.credoresPorArea(area.area, { ano, mes }, 30),
    [area.area, ano, mes]
  );

  const porMorador = Math.round(area.total_liquido / POPULACAO_GUARULHOS);
  const maxVal = Math.max(...(data?.map((c) => c.total_liquido) ?? [1]), 1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhamento de ${area.area}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 21, 43, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 820,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(9, 21, 43, 0.35)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* Cabeçalho escuro estilo Crachá Politicômetro */}
        <div
          style={{
            background: 'linear-gradient(135deg, #09152b 0%, #0f2547 100%)',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div>
            <span className="fg-eyebrow" style={{ marginBottom: 6 }}>
              {area.icone} RAIO-X COMPLETO DA ÁREA · CONFERIR ATÉ O FIM
            </span>
            <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 800, margin: '4px 0' }}>
              {area.area}
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              {area.explicacao_pratica}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              width: 34,
              height: 34,
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Fechar janela"
          >
            ✕
          </button>
        </div>

        {/* Faixa de Resumo da Área */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Total Pago na Área
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#09152b' }}>
              {brlCompacto(area.total_liquido)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{brl(area.total_liquido)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Custo por Morador
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669' }}>
              R$ {inteiro(porMorador)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>por habitante em {ano}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Ordens Bancárias
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7' }}>
              {inteiro(area.qtd_pagamentos)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>pagamentos liquidados</div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Empresas / Órgãos
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
              {inteiro(area.qtd_credores)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>recebedores diferentes</div>
          </div>
        </div>

        {/* Lista de Quem Recebeu o Dinheiro nesta Área */}
        <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>
              🔍 Quem recebeu o dinheiro desta área (toque para ver cada nota de empenho):
            </strong>
            <span className="muted small">Top {data?.length ?? 0} maiores recebedores</span>
          </div>

          {loading && <p className="muted">Buscando todas as empresas e pagamentos desta área...</p>}
          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{error.message}</p>}

          {data && (
            <div style={{ display: 'grid', gap: 8 }}>
              {data.map((c, idx) => {
                const pctArea = area.total_liquido > 0 ? ((c.total_liquido / area.total_liquido) * 100).toFixed(1) : '0';
                const largura = Math.max(3, Math.round((c.total_liquido / maxVal) * 100));
                return (
                  <Link
                    key={c.chave}
                    to={`/despesas/credor/${c.chave}`}
                    onClick={onClose}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>
                        {idx + 1}. {nomeLegivel(c.credor)}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#09152b', whiteSpace: 'nowrap' }}>
                        {brlCompacto(c.total_liquido)}
                      </div>
                    </div>

                    <div
                      style={{
                        height: 5,
                        borderRadius: 999,
                        background: '#f1f5f9',
                        margin: '5px 0',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${largura}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                        fontSize: '0.74rem',
                        color: '#64748b',
                      }}
                    >
                      <span>
                        {c.cnpj_credor ? `CNPJ: ${formatarCnpj(c.cnpj_credor)} · ` : ''}
                        {inteiro(c.qtd)} pagamentos · {pctArea}% da área · Último: {dataBr(c.ultimo_pagamento)}
                      </span>
                      <span style={{ color: '#0284c7', fontWeight: 800 }}>
                        Ver todos os empenhos e pagamentos →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

