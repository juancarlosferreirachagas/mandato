/**
 * ============================================================================
 * PÁGINA: AUDITORIA DE FORNECEDORES & PAGAMENTOS LIQUIDADOS (TCE-SP / AUDESP)
 * Rota: /despesas
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 *
 * ARQUITETURA E PADRÃO DE MERCADO:
 * 1. Agregação Server-Side via RPC PostgreSQL (`fg_ranking_credores` e `fg_resumo`):
 *    O frontend nunca baixa as ~28.882 linhas brutas de despesas. Toda filtragem,
 *    busca textual (trigram/ILIKE), agrupamento por CNPJ/CPF e paginação ocorre
 *    diretamente no motor do PostgreSQL com latência inferior a 50ms.
 *
 * 2. Sincronização de Estado na URL (`useSearchParams`):
 *    Todos os filtros (ano, mês, órgão pagador, tipo PJ/PF, busca textual e
 *    ocultação de repasses intra-orçamentários) ficam persistidos na Query String,
 *    permitindo que jornalistas, auditores e cidadãos compartilhem links exatos
 *    de uma auditoria específica.
 *
 * 3. Integração com Decretos Orçamentários (Lei 4.320/1964):
 *    Conecta os pagamentos efetivados aos Decretos de Suplementação extraídos do
 *    Diário Oficial de Guarulhos (/decretos), permitindo rastrear de onde saiu a
 *    dotação orçamentária que custeou cada contrato.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBanco } from '../components/StatusFontes';
import {
  ArrowRightLeft,
  ArrowUpRight,
  Building2,
  FileCheck2,
  Filter,
  Search,
} from 'lucide-react';
import { despesasRepository } from '@/repositories/despesasRepository';
import { useAsync } from '../hooks/useAsync';
import { ErrorBox, Loading } from '../components/common';
import { brl, brlCompacto, formatarCnpj, inteiro, nomeLegivel, dataBr } from '../format';

/** Quantidade padrão de credores exibidos por página na tabela de auditoria */
const LIMIT = 30;

/** Competências mensais disponíveis no exercício auditado */
const MESES_NOMES = [
  { val: 1, label: 'Janeiro' },
  { val: 2, label: 'Fevereiro' },
  { val: 3, label: 'Março' },
  { val: 4, label: 'Abril' },
  { val: 5, label: 'Maio' },
  { val: 6, label: 'Junho' },
  { val: 7, label: 'Julho' },
  { val: 8, label: 'Agosto' },
  { val: 9, label: 'Setembro' },
  { val: 10, label: 'Outubro' },
  { val: 11, label: 'Novembro' },
  { val: 12, label: 'Dezembro' },
];

/** Atalhos temáticos de auditoria rápida para os maiores contratos municipais */
const ATALHOS_AUDITORIA = [
  { label: 'Todos Fornecedores Externos', q: '' },
  { label: 'Hospitais & Gestão de Saúde', q: 'SAUDE' },
  { label: 'Ônibus & Viações Urbanas', q: 'VIACAO' },
  { label: 'Coleta de Lixo & Saneamento', q: 'SUSTENTARE' },
  { label: 'Construtoras & Pavimentação', q: 'CONSTRU' },
  { label: 'Vale-Alimentação & Benefícios', q: 'SODEXO' },
];

export function DespesasPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // --------------------------------------------------------------------------
  // 1. Leitura determinística dos parâmetros de auditoria a partir da URL
  // --------------------------------------------------------------------------
  const ano = searchParams.get('ano') ? Number(searchParams.get('ano')) : 2026;
  const mesParam = searchParams.get('mes') ? Number(searchParams.get('mes')) : null;
  const orgaoParam = searchParams.get('orgao') || null;
  const qParam = searchParams.get('q') || '';
  const tipoParam = (searchParams.get('tipo') as 'PJ' | 'PF' | null) || null;
  // Por padrão, oculta repasses intra-orçamentários (ex.: Prefeitura -> IPREM) para focar em empresas externas
  const somenteExternos = searchParams.get('todos') !== '1';
  const pagina = Math.max(1, Number(searchParams.get('p') || '1'));

  const [buscaTexto, setBuscaTexto] = useState(qParam);

  // Mantém o campo de input sincronizado quando o usuário clica em um atalho de URL
  useEffect(() => {
    setBuscaTexto(qParam);
  }, [qParam]);

  /**
   * Atualiza os filtros na URL mantendo a imutabilidade e retornando à página 1
   * sempre que um critério de filtragem é modificado.
   */
  const atualizarFiltros = (novos: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(novos)) {
      if (v === null || v === '') {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    if (!('p' in novos)) {
      params.delete('p');
    }
    setSearchParams(params);
  };

  const deslocamento = (pagina - 1) * LIMIT;

  // --------------------------------------------------------------------------
  // 2. Consulta paralela às RPCs analíticas do Supabase (`fg_ranking_credores` + `fg_resumo`)
  // --------------------------------------------------------------------------
  const { data, loading, error } = useAsync(
    async () => {
      const [ranking, resumo] = await Promise.all([
        despesasRepository.ranking({
          ano,
          mes: mesParam,
          orgao: orgaoParam,
          busca: qParam,
          tipo: tipoParam,
          somenteExternos,
          limite: LIMIT,
          deslocamento,
        }),
        despesasRepository.resumo({
          ano,
          mes: mesParam,
          orgao: orgaoParam,
        }),
      ]);
      return { ranking, resumo };
    },
    [ano, mesParam, orgaoParam, qParam, tipoParam, somenteExternos, deslocamento]
  );

  const totalLinhas = data?.ranking[0]?.total_linhas ?? 0;
  const totalPaginas = Math.ceil(totalLinhas / LIMIT) || 1;

  const aplicarBusca = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarFiltros({ q: buscaTexto.trim() || null });
  };

  return (
    <div className="fg-page-container">
      {/* ====================================================================
          CABEÇALHO EXECUTIVO COM STATUS DE VALIDAÇÃO EM TEMPO REAL
          ==================================================================== */}
      <header className="fg-hero" style={{ marginBottom: 16, padding: '22px 24px' }}>
        <div className="fg-hero-split">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="fg-hero__eyebrow">
                <span className="fg-hero__dot" />
                AUDITORIA DE DESPESAS · SISTEMA AUDESP / TCE-SP
              </span>
              <StatusBanco />
            </div>

            <h1 className="fg-hero__title" style={{ marginTop: 8, marginBottom: 6 }}>
              Fornecedores &amp; Pagamentos de <span>Guarulhos</span>
            </h1>
            <p className="fg-hero__lead">
              Ranking auditável de todas as empresas, organizações sociais e prestadores que receberam pagamentos
              liquidados pela Prefeitura, Câmara Municipal e IPREM em {ano}.
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => atualizarFiltros({ ano: '2026', mes: null })}
                className={ano === 2026 ? 'fg-btn-audit-live' : 'fg-btn-audit-ghost'}
                style={{ cursor: 'pointer' }}
              >
                <span>Exercício 2026 (R$ 4,28 bi · 24.177 pags)</span>
              </button>
              <button
                type="button"
                onClick={() => atualizarFiltros({ ano: '2025', mes: null })}
                className={ano === 2025 ? 'fg-btn-audit-live' : 'fg-btn-audit-ghost'}
                style={{ cursor: 'pointer' }}
              >
                <span>Exercício 2025 Completo (R$ 6,34 bi · 38.571 pags)</span>
              </button>
              <Link to="/decretos" className="fg-btn-audit-ghost">
                <ArrowRightLeft size={15} />
                <span>262 Decretos &amp; 212 Diários Oficiais</span>
              </Link>
            </div>
          </div>

          {/* KPIs Dinâmicos do Filtro Atual */}
          <div className="fg-hero-kpis">
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Total Pago no Escopo</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--amber">
                {data?.resumo ? brlCompacto(data.resumo.total_liquido) : '...'}
              </div>
              <div className="fg-hero-kpi__sub">
                {data?.resumo ? brl(data.resumo.total_liquido) : 'Consultando RPC...'}
              </div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Ordens Bancárias</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--sky">
                {data?.resumo ? inteiro(data.resumo.qtd_pagamentos) : '...'}
              </div>
              <div className="fg-hero-kpi__sub">Pagamentos liquidados</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Credores Encontrados</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--emerald">
                {data ? inteiro(totalLinhas || data.resumo.qtd_credores) : '...'}
              </div>
              <div className="fg-hero-kpi__sub">
                {somenteExternos ? 'Fornecedores externos' : 'Todos os recebedores'}
              </div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Última Liquidação</div>
              <div className="fg-hero-kpi__val">
                {data?.resumo ? dataBr(data.resumo.ultima_data) : '...'}
              </div>
              <div className="fg-hero-kpi__sub">Sincronizado via Audesp</div>
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          ATALHOS TEMÁTICOS DE AUDITORIA RÁPIDA
          ==================================================================== */}
      <div className="fg-audit-explainer" style={{ marginBottom: 14 }}>
        <div className="fg-audit-explainer__icon">
          <Building2 size={20} />
        </div>
        <div className="fg-audit-explainer__content" style={{ width: '100%' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Filtro Rápido por Setor Contratado:</strong> Selecione um grupo abaixo para auditar os maiores
            contratos contínuos da cidade ou pesquise qualquer razão social, CNPJ ou número de empenho:
          </div>
          <div className="fg-pills">
            {ATALHOS_AUDITORIA.map((item) => (
              <button
                key={item.label}
                type="button"
                className={qParam.toUpperCase() === item.q ? 'fg-pill is-active' : 'fg-pill'}
                onClick={() => atualizarFiltros({ q: item.q || null })}
              >
                <Filter size={12} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================================
          PAINEL DE FILTROS TÉCNICOS (BUSCA, EXERCÍCIO, MÊS, ÓRGÃO E TIPO)
          ==================================================================== */}
      <div className="fg-filters" style={{ marginBottom: 18 }}>
        {/* Busca por Razão Social, CNPJ ou Histórico do Empenho */}
        <form onSubmit={aplicarBusca} className="fg-field fg-field--wide">
          <label htmlFor="filtro-busca">Pesquisar Empresa / CNPJ / Nº de Empenho</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              id="filtro-busca"
              type="search"
              placeholder="Ex: Sodexo, 46.319..., Construção, Hospital..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
            />
            <button
              type="submit"
              className="fg-btn fg-btn--primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Search size={15} />
              <span>Auditar</span>
            </button>
          </div>
        </form>

        {/* Exercício Financeiro */}
        <div className="fg-field">
          <label htmlFor="filtro-ano">Exercício (LOA)</label>
          <select
            id="filtro-ano"
            value={ano}
            onChange={(e) => atualizarFiltros({ ano: e.target.value, mes: null })}
          >
            <option value="2026">2026 (Jan–Ago · R$ 4,28 bi)</option>
            <option value="2025">2025 (Ano completo · R$ 6,34 bi)</option>
          </select>
        </div>

        {/* Competência Mensal */}
        <div className="fg-field">
          <label htmlFor="filtro-mes">Competência Mensal</label>
          <select
            id="filtro-mes"
            value={mesParam ?? ''}
            onChange={(e) => atualizarFiltros({ mes: e.target.value || null })}
          >
            <option value="">{ano === 2025 ? 'Todos os 12 meses (Jan–Dez)' : 'Acumulado no Ano (Jan–Ago)'}</option>
            {MESES_NOMES.filter((m) => ano === 2025 || m.val <= 8).map((m) => (
              <option key={m.val} value={m.val}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Unidade Gestora / Órgão Pagador */}
        <div className="fg-field">
          <label htmlFor="filtro-orgao">Unidade Pagadora</label>
          <select
            id="filtro-orgao"
            value={orgaoParam ?? ''}
            onChange={(e) => atualizarFiltros({ orgao: e.target.value || null })}
          >
            <option value="">Todos os Órgãos Municipais</option>
            <option value="PREFEITURA MUNICIPAL DE GUARULHOS">Prefeitura Municipal (Executivo)</option>
            <option value="CÂMARA MUNICIPAL DE GUARULHOS">Câmara Municipal (Legislativo)</option>
            <option value="INSTITUTO DE PREVID.FUNC.PÚBL.MUNICIPAIS DE GUARULHOS">IPREM (Previdência Municipal)</option>
          </select>
        </div>

        {/* Natureza Jurídica do Favorecido */}
        <div className="fg-field">
          <label htmlFor="filtro-tipo">Natureza do Credor</label>
          <select
            id="filtro-tipo"
            value={tipoParam ?? ''}
            onChange={(e) => atualizarFiltros({ tipo: e.target.value || null })}
          >
            <option value="">Todos (PJ e PF)</option>
            <option value="PJ">Pessoa Jurídica (CNPJ)</option>
            <option value="PF">Pessoa Física (CPF Mascarado LGPD)</option>
          </select>
        </div>

        {/* Filtro Contábil de Operações Intra-Orçamentárias (Modalidade 91) */}
        <div className="fg-field fg-field--wide">
          <label className="fg-check">
            <input
              type="checkbox"
              checked={somenteExternos}
              onChange={(e) => atualizarFiltros({ todos: e.target.checked ? null : '1' })}
            />
            <span>
              Isolar fornecedores privados externos (ocultar repasses intra-orçamentários entre Prefeitura e IPREM)
            </span>
          </label>
        </div>
      </div>

      {error && <ErrorBox error={error} />}

      {/* ====================================================================
          TABELA DE AUDITORIA DE CREDORES (ALINHAMENTO TABULAR MONOESPAÇADO)
          ==================================================================== */}
      <div className="fg-table-wrap">
        <div className="fg-table-scroll">
          <table className="fg-table fg-table--cards fg-table--credores">
            <thead>
              <tr>
                <th className="rank">#</th>
                <th>Credor / Favorecido Oficial</th>
                <th>Natureza</th>
                <th className="num">Ordens Pagas</th>
                <th>Último Pagamento</th>
                <th className="num">Total Líquido Recebido</th>
                <th style={{ textAlign: 'right' }}>Dossiê de Auditoria</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && (
                <tr>
                  <td colSpan={7} className="fg-empty-row">
                    <Loading label="Consultando base analítica auditada do TCE-SP..." />
                  </td>
                </tr>
              )}

              {data?.ranking.map((c, i) => {
                const pos = deslocamento + i + 1;
                return (
                  <tr key={c.chave} className="fg-row-link">
                    <td className="rank">#{pos}</td>
                    <td>
                      <div className="fg-cell-name">
                        <Link to={`/despesas/credor/${c.chave}`}>{nomeLegivel(c.credor)}</Link>
                        {c.repasse_interno && (
                          <span
                            className="fg-tag fg-tag--warn"
                            title="Transferência intra-orçamentária entre entes públicos do município"
                          >
                            Repasse Intra-Orçamentário
                          </span>
                        )}
                      </div>
                      <div className="fg-cell-sub">
                        {c.cnpj_credor
                          ? `CNPJ: ${formatarCnpj(c.cnpj_credor)}`
                          : 'Pessoa Física (CPF protegido — Art. 31 LAI / LGPD)'}
                      </div>
                    </td>
                    <td data-label="Natureza">
                      <span className={`fg-tag ${c.tipo_credor === 'PF' ? 'fg-tag--pf' : ''}`}>
                        {c.tipo_credor ?? 'OUTRO'}
                      </span>
                    </td>
                    <td className="num" data-label="Ordens Pagas" style={{ fontFamily: 'var(--font-mono)' }}>
                      {inteiro(c.qtd)}
                    </td>
                    <td data-label="Último pagamento" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {dataBr(c.ultimo_pagamento)}
                    </td>
                    <td className="num fg-money" data-label="Total recebido" style={{ fontFamily: 'var(--font-mono)' }}>
                      {brl(c.total_liquido)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/despesas/credor/${c.chave}`}
                        className="fg-btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          textDecoration: 'none',
                        }}
                      >
                        <FileCheck2 size={14} />
                        <span>Dossiê &amp; Empenhos</span>
                        <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {data && data.ranking.length === 0 && (
                <tr>
                  <td colSpan={7} className="fg-empty-row">
                    Nenhum credor ou pagamento encontrado com os parâmetros de auditoria selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação Server-Side */}
        {totalPaginas > 1 && (
          <div className="fg-pager">
            <div>
              Exibindo registros <strong>{deslocamento + 1}</strong> a{' '}
              <strong>{Math.min(deslocamento + LIMIT, totalLinhas)}</strong> de{' '}
              <strong>{inteiro(totalLinhas)}</strong> credores auditados
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="fg-btn"
                disabled={pagina <= 1}
                onClick={() => atualizarFiltros({ p: String(pagina - 1) })}
              >
                ← Anterior
              </button>
              <span style={{ alignSelf: 'center', padding: '0 8px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                Pág. {pagina} / {totalPaginas}
              </span>
              <button
                type="button"
                className="fg-btn"
                disabled={pagina >= totalPaginas}
                onClick={() => atualizarFiltros({ p: String(pagina + 1) })}
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fg-footer-note" style={{ marginTop: 22 }}>
        <strong>Nota Metodológica (Padrão TCE-SP / NBC TA):</strong> Os valores acima refletem exclusivamente o estágio
        de <em>Despesa Paga Líquida</em> (pagamentos efetivados deduzidos de eventuais estornos/devoluções contábeis no
        período). Para verificar as alterações de dotação que autorizaram esses gastos, consulte a aba{' '}
        <Link to="/decretos" className="fg-link">
          Decretos &amp; Diários Extraídos
        </Link>
        .
      </div>
    </div>
  );
}
