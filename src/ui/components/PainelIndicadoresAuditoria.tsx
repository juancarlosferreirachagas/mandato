/**
 * ============================================================================
 * PAINEL DE INDICADORES DE AUDITORIA PROFISSIONAL (PADRÃO TCE-SP / LRF)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * Apresenta as 4 métricas objetivas usadas por órgãos de controle externo
 * (TCE-SP, TCU e Controladorias), traduzidas para linguagem simples e direta,
 * com gaveta explicativa (Raio-X) sem tirar o cidadão da tela.
 * ============================================================================
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  FileCheck2,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { RESUMO_CONEXOES_OFICIAIS } from '@/database/resumoConexoesOficiais';
import { QTD_DECRETOS, QTD_PDFS_EXECUTIVO } from '@/domain/plataforma';
import { PainelRaioX } from './PainelRaioX';
import { brl, brlCompacto, inteiro } from '../format';

type IndicadorId = 'curva_abc' | 'dispensas' | 'decretos' | 'lastro' | null;

export function PainelIndicadoresAuditoria() {
  const [selecionado, setSelecionado] = useState<IndicadorId>(null);
  const ind = (RESUMO_CONEXOES_OFICIAIS as any).indicadoresAuditoria as
    | {
        totalPagoExternosConsolidado: number;
        top10Valor: number;
        top10Percentual: number;
        top50Valor: number;
        top50Percentual: number;
        contratacoesDiretas2026Valor: number;
        contratacoesDiretas2026Empresas: number;
        totalMovimentadoDecretos: number;
        topSecretariasSuplementadas: { orgao: string; valor: number; qtd: number }[];
        topSecretariasCedentes: { orgao: string; valor: number; qtd: number }[];
      }
    | undefined;

  if (!ind) return null;

  return (
    <>
      <section className="fg-audit-pro" aria-label="Indicadores de auditoria técnica">
        <div className="fg-audit-pro__head">
          <div>
            <span className="fg-audit-pro__kicker">Padrão Controle Externo · Lei 4.320/64 e Lei 14.133/21</span>
            <h2 className="fg-h2" style={{ marginTop: 2 }}>
              Indicadores de Auditoria em Linguagem Simples
            </h2>
          </div>
          <span className="fg-cell-sub">Toque em qualquer indicador para entender o cálculo sem sair da tela</span>
        </div>

        <div className="fg-audit-pro__grid">
          {/* 1. Curva ABC / Concentração */}
          <button
            type="button"
            className="fg-audit-pro__card"
            onClick={() => setSelecionado('curva_abc')}
          >
            <div className="fg-audit-pro__top">
              <span className="fg-audit-pro__icon">
                <BarChart3 size={16} aria-hidden />
              </span>
              <span className="fg-audit-pro__tag">Curva ABC · Concentração</span>
            </div>
            <div className="fg-audit-pro__metric">
              {ind.top10Percentual.toLocaleString('pt-BR')}%{' '}
              <small>nas 10 maiores</small>
            </div>
            <p className="fg-audit-pro__desc">
              Das {inteiro(RESUMO_CONEXOES_OFICIAIS.totalCredoresExternos)} empresas e pessoas pagas, apenas 10
              concentram <strong>{brlCompacto(ind.top10Valor)}</strong> (e as 50 maiores concentram{' '}
              <strong>{ind.top50Percentual.toLocaleString('pt-BR')}%</strong>).
            </p>
            <span className="fg-audit-pro__cta">
              Entender indicador <ArrowRight size={13} aria-hidden />
            </span>
          </button>

          {/* 2. Dispensas e Inexigibilidades */}
          <button
            type="button"
            className="fg-audit-pro__card"
            onClick={() => setSelecionado('dispensas')}
          >
            <div className="fg-audit-pro__top">
              <span className="fg-audit-pro__icon fg-audit-pro__icon--amber">
                <AlertCircle size={16} aria-hidden />
              </span>
              <span className="fg-audit-pro__tag">Sem licitação ampla (2026)</span>
            </div>
            <div className="fg-audit-pro__metric">
              {brlCompacto(ind.contratacoesDiretas2026Valor)}{' '}
              <small>em {inteiro(ind.contratacoesDiretas2026Empresas)} empresas</small>
            </div>
            <p className="fg-audit-pro__desc">
              Pagamentos feitos em 2026 por <strong>Dispensa</strong> ou <strong>Inexigibilidade</strong> de licitação
              (Art. 74 e 75 da Lei 14.133/2021).
            </p>
            <span className="fg-audit-pro__cta">
              Ver regras e empresas <ArrowRight size={13} aria-hidden />
            </span>
          </button>

          {/* 3. Alteração Orçamentária por Decreto */}
          <button
            type="button"
            className="fg-audit-pro__card"
            onClick={() => setSelecionado('decretos')}
          >
            <div className="fg-audit-pro__top">
              <span className="fg-audit-pro__icon fg-audit-pro__icon--blue">
                <ArrowRightLeft size={16} aria-hidden />
              </span>
              <span className="fg-audit-pro__tag">Mudanças por decreto</span>
            </div>
            <div className="fg-audit-pro__metric">
              {brlCompacto(ind.totalMovimentadoDecretos)}{' '}
              <small>em {QTD_DECRETOS} decretos</small>
            </div>
            <p className="fg-audit-pro__desc">
              Verba remanejada pela Prefeitura após a aprovação do orçamento na Câmara. Veja quais secretarias mais
              ganharam e perderam recursos.
            </p>
            <span className="fg-audit-pro__cta">
              Ver quem ganhou e perdeu <ArrowRight size={13} aria-hidden />
            </span>
          </button>

          {/* 4. Lastro Documental Cruzado */}
          <button
            type="button"
            className="fg-audit-pro__card"
            onClick={() => setSelecionado('lastro')}
          >
            <div className="fg-audit-pro__top">
              <span className="fg-audit-pro__icon fg-audit-pro__icon--emerald">
                <FileCheck2 size={16} aria-hidden />
              </span>
              <span className="fg-audit-pro__tag">Lastro nos PDFs oficiais</span>
            </div>
            <div className="fg-audit-pro__metric">
              {inteiro(RESUMO_CONEXOES_OFICIAIS.totalConexoesDom)}{' '}
              <small>atos com CNPJ</small>
            </div>
            <p className="fg-audit-pro__desc">
              Cruzamento automático de 14 dígitos entre os pagamentos do TCE-SP e os{' '}
              <strong>{QTD_PDFS_EXECUTIVO} PDFs do Diário Oficial</strong> ({inteiro(RESUMO_CONEXOES_OFICIAIS.totalEmpresasConectadasDom)}{' '}
              empresas).
            </p>
            <span className="fg-audit-pro__cta">
              Conferir metodologia <ArrowRight size={13} aria-hidden />
            </span>
          </button>
        </div>
      </section>

      {/* Raio-X Explicativo dos Indicadores sem sair da tela */}
      <PainelRaioX
        aberto={selecionado !== null}
        onFechar={() => setSelecionado(null)}
        eyebrow="Metodologia de Auditoria Pública"
        titulo={
          selecionado === 'curva_abc'
            ? 'Concentração de Fornecedores (Curva ABC)'
            : selecionado === 'dispensas'
            ? 'Contratações Diretas: Dispensa e Inexigibilidade'
            : selecionado === 'decretos'
            ? 'Secretarias que mais ganharam e cederam verba por Decreto'
            : 'Cruzamento Determinístico TCE-SP × Diário Oficial'
        }
        rodape={
          selecionado === 'curva_abc' ? (
            <Link to="/despesas?ano=todos" className="fg-btn fg-btn--primary fg-btn--sm" onClick={() => setSelecionado(null)}>
              <span>Abrir ranking das maiores contratadas →</span>
            </Link>
          ) : selecionado === 'dispensas' ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                to={`/despesas?ano=2026&modalidade=${encodeURIComponent('Dispensa de Licitação')}`}
                className="fg-btn fg-btn--primary fg-btn--sm"
                onClick={() => setSelecionado(null)}
              >
                <span>Ver Dispensas (2026) →</span>
              </Link>
              <Link
                to={`/despesas?ano=2026&modalidade=${encodeURIComponent('INEXIGÍVEL')}`}
                className="fg-btn fg-btn--sm"
                onClick={() => setSelecionado(null)}
              >
                <span>Ver Inexigibilidades →</span>
              </Link>
            </div>
          ) : selecionado === 'decretos' ? (
            <Link
              to="/decretos?aba=decretos"
              className="fg-btn fg-btn--primary fg-btn--sm"
              onClick={() => setSelecionado(null)}
            >
              <span>Explorar os {QTD_DECRETOS} decretos →</span>
            </Link>
          ) : (
            <Link
              to="/despesas?visao=conexoes"
              className="fg-btn fg-btn--primary fg-btn--sm"
              onClick={() => setSelecionado(null)}
            >
              <span>Ver as {inteiro(RESUMO_CONEXOES_OFICIAIS.totalConexoesDom)} conexões →</span>
            </Link>
          )
        }
      >
        {selecionado === 'curva_abc' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="fg-sheet-item">
              <strong>O que significa na prática?</strong>
              <p className="fg-sheet-item__text">
                Em auditoria pública, a <strong>Curva ABC (Pareto)</strong> mede quantos reais do orçamento dependem de
                poucos contratos de grande porte (como gestão hospitalar, limpeza urbana, transporte coletivo e merenda).
                Concentração alta não significa irregularidade — mas indica exatamente onde a fiscalização cidadã e da
                Câmara gera maior impacto por real gasto.
              </p>
            </div>
            <div className="fg-sheet-kpis">
              <div className="fg-sheet-kpi">
                <span>10 maiores recebedores</span>
                <strong>{brlCompacto(ind.top10Valor)}</strong>
                <small>{ind.top10Percentual.toLocaleString('pt-BR')}% de tudo que foi pago</small>
              </div>
              <div className="fg-sheet-kpi">
                <span>50 maiores recebedores</span>
                <strong>{brlCompacto(ind.top50Valor)}</strong>
                <small>{ind.top50Percentual.toLocaleString('pt-BR')}% do total externo</small>
              </div>
            </div>
          </div>
        )}

        {selecionado === 'dispensas' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="fg-sheet-item">
              <strong>Qual a diferença para o Pregão e a Concorrência?</strong>
              <p className="fg-sheet-item__text">
                A regra geral é licitar com disputa aberta (Pregão ou Concorrência). A <strong>Lei Federal nº 14.133/2021</strong>{' '}
                permite contratar diretamente apenas em hipóteses estritas: <strong>Inexigibilidade (Art. 74)</strong>,
                quando só existe um fornecedor exclusivo ou serviço singular, e <strong>Dispensa (Art. 75)</strong>, para
                compras de pequeno valor ou emergências comprovadas. Por isso, todo auditor confere de perto a justificativa
                e os preços dessas contratações.
              </p>
            </div>
            <div className="fg-sheet-kpis">
              <div className="fg-sheet-kpi">
                <span>Total direto em 2026</span>
                <strong>{brl(ind.contratacoesDiretas2026Valor)}</strong>
                <small>Soma de Dispensa + Inexigibilidade</small>
              </div>
              <div className="fg-sheet-kpi">
                <span>Fornecedores diretos</span>
                <strong>{inteiro(ind.contratacoesDiretas2026Empresas)}</strong>
                <small>Auditáveis individualmente com CNPJ</small>
              </div>
            </div>
          </div>
        )}

        {selecionado === 'decretos' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="fg-sheet-item">
              <strong>Por que acompanhar os decretos?</strong>
              <p className="fg-sheet-item__text">
                No fim de cada ano, os vereadores votam a Lei Orçamentária (LOA) definindo quanto vai para cada área.
                Ao longo do ano, a Prefeitura usa decretos (autorizados até um limite na LOA) para tirar verba de uma
                dotação (<strong>Art. 2º</strong>) e reforçar outra (<strong>Art. 1º</strong>).
              </p>
            </div>

            {ind.topSecretariasSuplementadas.length > 0 && (
              <div className="fg-sheet-section">
                <div className="fg-sheet-section__head" style={{ color: '#047857' }}>
                  <TrendingUp size={14} aria-hidden />
                  <span>Áreas que mais receberam reforço (Art. 1º)</span>
                </div>
                {ind.topSecretariasSuplementadas.map((s) => (
                  <div key={s.orgao} className="fg-sheet-item">
                    <div className="fg-sheet-item__top">
                      <strong>{s.orgao}</strong>
                      <span className="fg-tag">{s.qtd} dec.</span>
                      <strong className="fg-money" style={{ marginLeft: 'auto', color: '#047857' }}>
                        + {brlCompacto(s.valor)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ind.topSecretariasCedentes.length > 0 && (
              <div className="fg-sheet-section">
                <div className="fg-sheet-section__head" style={{ color: '#b91c1c' }}>
                  <TrendingDown size={14} aria-hidden />
                  <span>Áreas que mais tiveram verba anulada/cedida (Art. 2º)</span>
                </div>
                {ind.topSecretariasCedentes.map((s) => (
                  <div key={s.orgao} className="fg-sheet-item">
                    <div className="fg-sheet-item__top">
                      <strong>{s.orgao}</strong>
                      <span className="fg-tag">{s.qtd} dec.</span>
                      <strong className="fg-money neg" style={{ marginLeft: 'auto' }}>
                        - {brlCompacto(s.valor)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selecionado === 'lastro' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="fg-sheet-item">
              <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scale size={15} aria-hidden />
                <span>Como garantimos zero falso-positivo?</span>
              </strong>
              <p className="fg-sheet-item__text" style={{ marginTop: 4 }}>
                Cada conexão exibida no portal exige o casamento exato dos <strong>14 dígitos do CNPJ</strong> entre o
                registro de pagamento enviado ao Tribunal de Contas (TCE-SP) e a página do PDF do Diário Oficial do
                Município, cujo arquivo original teve sua impressão digital criptográfica (<strong>SHA-256</strong>)
                calculada e preservada.
              </p>
            </div>
          </div>
        )}
      </PainelRaioX>
    </>
  );
}
