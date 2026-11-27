/**
 * ============================================================================
 * COMPONENTE UNIVERSAL DE PAGINAÇÃO MODERNA + EXPORTAÇÃO CSV
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { inteiro } from '../format';

interface PaginacaoModernaProps {
  pagina: number;
  totalItens: number;
  itensPorPagina: number;
  rotuloItem?: string;
  opcoesPorPagina?: number[];
  onMudarPagina: (novaPagina: number) => void;
  onMudarItensPorPagina?: (novaQtd: number) => void;
  onExportarCsv?: () => void;
  rotuloExportar?: string;
}

function gerarJanelaPaginas(atual: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const paginas: (number | 'ellipsis')[] = [1];
  const ini = Math.max(2, atual - 1);
  const fim = Math.min(total - 1, atual + 1);
  if (ini > 2) paginas.push('ellipsis');
  for (let p = ini; p <= fim; p++) paginas.push(p);
  if (fim < total - 1) paginas.push('ellipsis');
  paginas.push(total);
  return paginas;
}

export function PaginacaoModerna({
  pagina,
  totalItens,
  itensPorPagina,
  rotuloItem = 'registros',
  opcoesPorPagina = [20, 30, 50, 100],
  onMudarPagina,
  onMudarItensPorPagina,
  onExportarCsv,
  rotuloExportar = 'Baixar CSV',
}: PaginacaoModernaProps) {
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  const pagSegura = Math.min(Math.max(1, pagina), totalPaginas);
  const [irPara, setIrPara] = useState('');

  if (totalItens === 0) return null;

  const inicio = (pagSegura - 1) * itensPorPagina + 1;
  const fim = Math.min(pagSegura * itensPorPagina, totalItens);
  const janela = gerarJanelaPaginas(pagSegura, totalPaginas);

  const irDireto = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(irPara);
    if (Number.isFinite(num) && num >= 1 && num <= totalPaginas) {
      onMudarPagina(Math.floor(num));
      setIrPara('');
    }
  };

  return (
    <div className="fg-pager-modern" role="navigation" aria-label="Paginação de resultados">
      <div className="fg-pager-modern__info">
        <span>
          Mostrando <strong>{inteiro(inicio)}</strong>–<strong>{inteiro(fim)}</strong> de{' '}
          <strong>{inteiro(totalItens)}</strong> {rotuloItem}
        </span>

        <div className="fg-pager-modern__tools">
          {onMudarItensPorPagina && (
            <label className="fg-pager-modern__size">
              <span>Por página:</span>
              <select
                value={itensPorPagina}
                onChange={(e) => onMudarItensPorPagina(Number(e.target.value))}
                aria-label="Quantidade de itens por página"
              >
                {opcoesPorPagina.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </label>
          )}

          {onExportarCsv && (
            <button type="button" className="fg-btn fg-btn--sm" onClick={onExportarCsv}>
              <Download size={13} aria-hidden />
              <span>{rotuloExportar}</span>
            </button>
          )}
        </div>
      </div>

      {totalPaginas > 1 && (
        <div className="fg-pager-modern__controls">
          <div className="fg-pager-modern__pages">
            <button
              type="button"
              className="fg-page-btn"
              disabled={pagSegura <= 1}
              onClick={() => onMudarPagina(1)}
              aria-label="Primeira página"
              title="Primeira página"
            >
              <ChevronsLeft size={15} aria-hidden />
            </button>
            <button
              type="button"
              className="fg-page-btn"
              disabled={pagSegura <= 1}
              onClick={() => onMudarPagina(pagSegura - 1)}
              aria-label="Página anterior"
              title="Anterior"
            >
              <ChevronLeft size={15} aria-hidden />
            </button>

            {janela.map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`el-${idx}`} className="fg-page-ellipsis" aria-hidden>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`fg-page-btn fg-page-btn--num${item === pagSegura ? ' is-active' : ''}`}
                  aria-current={item === pagSegura ? 'page' : undefined}
                  onClick={() => onMudarPagina(item)}
                >
                  {item}
                </button>
              )
            )}

            <button
              type="button"
              className="fg-page-btn"
              disabled={pagSegura >= totalPaginas}
              onClick={() => onMudarPagina(pagSegura + 1)}
              aria-label="Próxima página"
              title="Próxima"
            >
              <ChevronRight size={15} aria-hidden />
            </button>
            <button
              type="button"
              className="fg-page-btn"
              disabled={pagSegura >= totalPaginas}
              onClick={() => onMudarPagina(totalPaginas)}
              aria-label="Última página"
              title="Última página"
            >
              <ChevronsRight size={15} aria-hidden />
            </button>
          </div>

          {totalPaginas > 5 && (
            <form onSubmit={irDireto} className="fg-pager-modern__jump">
              <label htmlFor="fg-ir-pag" className="fg-cell-sub">
                Ir pág.
              </label>
              <input
                id="fg-ir-pag"
                type="number"
                min={1}
                max={totalPaginas}
                placeholder={`1–${totalPaginas}`}
                value={irPara}
                onChange={(e) => setIrPara(e.target.value)}
              />
              <button type="submit" className="fg-btn fg-btn--sm">
                Ir
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
