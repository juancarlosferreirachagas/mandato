import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import { despesasRepository, type DespesaPorArea } from '@/repositories/despesasRepository';
import { useAsync } from '../hooks/useAsync';
import { PLATAFORMA } from '@/domain/plataforma';
import { brl, brlCompacto, dataBr, formatarCnpj, inteiro, nomeLegivel } from '../format';
import { IconeArea } from './AreasOrcamento';

export function AreaDetalheModal({
  area,
  ano,
  mes,
  onClose,
}: {
  area: DespesaPorArea;
  ano: number | null;
  mes?: number | null;
  onClose: () => void;
}) {
  const { data, loading, error } = useAsync(
    () => despesasRepository.credoresPorArea(area.area, { ano, mes }, 30),
    [area.area, ano, mes]
  );

  useEffect(() => {
    document.body.classList.add('fg-lock');
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.classList.remove('fg-lock');
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [onClose]);

  const porMorador = Math.round(area.total_liquido / PLATAFORMA.populacao);
  const maxVal = Math.max(...(data?.map((c) => c.total_liquido) ?? [1]), 1);
  const periodoTxt = ano ? `em ${ano}` : 'em 2025 e 2026';

  return (
    <div
      className="fg-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes da área ${area.area}`}
      onClick={onClose}
    >
      <div className="fg-modal__dialog fg-modal__dialog--wide" onClick={(e) => e.stopPropagation()}>
        <div className="fg-modal__head">
          <div>
            <span className="fg-eyebrow" style={{ marginBottom: 6 }}>
              <IconeArea area={area.area} size={14} />
              <span>Detalhes da área</span>
            </span>
            <h2 className="fg-modal__title">{area.area}</h2>
            <p className="fg-modal__sub">{area.explicacao_pratica}</p>
          </div>
          <button type="button" className="fg-modal__close" onClick={onClose} aria-label="Fechar janela">
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="fg-modal__kpis">
          <div>
            <div className="fg-modal__kpi-lbl">Total pago</div>
            <div className="fg-modal__kpi-val">{brlCompacto(area.total_liquido)}</div>
            <div className="fg-modal__kpi-hint">{brl(area.total_liquido)}</div>
          </div>
          <div>
            <div className="fg-modal__kpi-lbl">Por morador</div>
            <div className="fg-modal__kpi-val fg-modal__kpi-val--green">R$ {inteiro(porMorador)}</div>
            <div className="fg-modal__kpi-hint">{periodoTxt}</div>
          </div>
          <div>
            <div className="fg-modal__kpi-lbl">Pagamentos</div>
            <div className="fg-modal__kpi-val fg-modal__kpi-val--blue">{inteiro(area.qtd_pagamentos)}</div>
            <div className="fg-modal__kpi-hint">pagamentos realizados</div>
          </div>
          <div>
            <div className="fg-modal__kpi-lbl">Fornecedores</div>
            <div className="fg-modal__kpi-val">{inteiro(area.qtd_credores)}</div>
            <div className="fg-modal__kpi-hint">empresas ou órgãos</div>
          </div>
        </div>

        <div className="fg-modal__body">
          <div className="fg-modal__list-head">
            <strong>Quem mais recebeu nesta área</strong>
            <span className="muted small">Top {data?.length ?? 0} maiores recebedores</span>
          </div>

          {loading && <p className="muted">Carregando fornecedores desta área…</p>}
          {error && <p className="alert alert--error">{error.message}</p>}

          {data && (
            <div className="fg-modal__list">
              {data.map((c, idx) => {
                const pctArea = area.total_liquido > 0 ? ((c.total_liquido / area.total_liquido) * 100).toFixed(1) : '0';
                const largura = Math.max(3, Math.round((c.total_liquido / maxVal) * 100));
                return (
                  <Link
                    key={c.chave}
                    to={`/despesas/credor/${c.chave}`}
                    onClick={onClose}
                    className="fg-modal__item"
                  >
                    <div className="fg-modal__item-top">
                      <span className="fg-modal__item-name">
                        {idx + 1}. {nomeLegivel(c.credor)}
                      </span>
                      <span className="fg-modal__item-val">{brlCompacto(c.total_liquido)}</span>
                    </div>

                    <div className="fg-modal__bar" aria-hidden>
                      <div className="fg-modal__bar-fill" style={{ width: `${largura}%` }} />
                    </div>

                    <div className="fg-modal__item-meta">
                      <span>
                        {c.cnpj_credor ? `CNPJ: ${formatarCnpj(c.cnpj_credor)} · ` : ''}
                        {inteiro(c.qtd)} pagamentos · {pctArea}% da área · Último: {dataBr(c.ultimo_pagamento)}
                      </span>
                      <span className="fg-modal__item-cta">
                        Ver pagamentos <ArrowUpRight size={13} aria-hidden />
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
