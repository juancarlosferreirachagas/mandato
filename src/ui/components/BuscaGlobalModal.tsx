/**
 * ============================================================================
 * PALETA DE BUSCA GLOBAL UNIFICADA (Ctrl+K / ⌘K)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * Permite pesquisar instantaneamente em toda a base auditada de Guarulhos:
 *   - Todas as empresas e fornecedores (nome ou CNPJ)
 *   - Todos os 843 decretos orçamentários
 *   - Todas as 197 leis municipais sancionadas
 *   - Todos os 36 representantes eleitos (Prefeito, Vice e Vereadores)
 * ============================================================================
 */

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  FileText,
  Scale,
  Search,
  User,
  X,
} from 'lucide-react';
import {
  CATALOGO_DECRETOS_SUPLEMENTARES_REAIS,
  LEIS_MUNICIPAIS_SANCIONADAS_REAIS,
} from '@/domain/diariosCatalogoReal';
import { ELEITOS_GUARULHOS_TSE_2024 } from '@/database/contingenciaPoliticosGuarulhos';
import { carregarCredoresCompletos, type CredorIntegral } from '@/services/baseIntegralService';
import { brlCompacto, formatarCnpj, nomeLegivel } from '../format';

interface BuscaGlobalModalProps {
  aberto: boolean;
  onFechar: () => void;
}

function norm(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function BuscaGlobalModal({ aberto, onFechar }: BuscaGlobalModalProps) {
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [termo, setTermo] = useState('');
  const termoAdiado = useDeferredValue(termo);
  const [credores, setCredores] = useState<CredorIntegral[]>([]);

  useEffect(() => {
    if (!aberto) return;
    document.body.classList.add('fg-lock');
    window.setTimeout(() => inputRef.current?.focus(), 40);
    carregarCredoresCompletos()
      .then(setCredores)
      .catch(() => {});
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('fg-lock');
      window.removeEventListener('keydown', onKey);
    };
  }, [aberto, onFechar]);

  const resultados = useMemo(() => {
    const q = norm(termoAdiado).trim();
    const dig = q.replace(/\D/g, '');
    if (q.length < 2) {
      return {
        empresas: credores.filter((c) => !c.repasseInterno).slice(0, 5),
        decretos: CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.slice(0, 3),
        leis: LEIS_MUNICIPAIS_SANCIONADAS_REAIS.slice(0, 3),
        politicos: (ELEITOS_GUARULHOS_TSE_2024 as any[]).slice(0, 3),
      };
    }

    // Busca em O(n) sobre searchIndex pré-normalizado (< 4ms para 6.741 empresas!)
    const empresas: CredorIntegral[] = [];
    for (let i = 0; i < credores.length && empresas.length < 6; i++) {
      const c = credores[i];
      if (c.searchIndex.includes(q) || (dig.length >= 4 && (c.cnpj ?? '').includes(dig))) {
        empresas.push(c);
      }
    }

    const decretos = CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.filter(
      (d) =>
        d.numero.includes(q) ||
        d.numeroFmt.includes(q) ||
        norm(d.trecho).includes(q) ||
        d.dataBr.includes(q)
    ).slice(0, 4);

    const leis = LEIS_MUNICIPAIS_SANCIONADAS_REAIS.filter(
      (l) =>
        norm(l.numeroFmt).includes(q) ||
        norm(l.ementa).includes(q) ||
        norm(l.autoria).includes(q)
    ).slice(0, 4);

    const politicos = (ELEITOS_GUARULHOS_TSE_2024 as any[])
      .filter((p) => norm(p.nome).includes(q) || norm(p.nomeCivil).includes(q) || norm(p.partido).includes(q))
      .slice(0, 4);

    return { empresas, decretos, leis, politicos };
  }, [termoAdiado, credores]);

  const ir = (rota: string) => {
    onFechar();
    setTermo('');
    nav(rota);
  };

  const totalAchados =
    resultados.empresas.length +
    resultados.decretos.length +
    resultados.leis.length +
    resultados.politicos.length;

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fg-cmd-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onFechar}
          role="dialog"
          aria-modal="true"
          aria-label="Busca rápida em todo o Fiscaliza Guarulhos"
        >
          <motion.div
            className="fg-cmd-dialog"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fg-cmd-head">
              <Search size={18} className="fg-cmd-head__ico" aria-hidden />
              <input
                ref={inputRef}
                type="search"
                className="fg-cmd-input"
                placeholder="Buscar empresa, CNPJ, decreto (44681), lei ou vereador…"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
              />
              <button
                type="button"
                className="fg-cmd-close"
                onClick={onFechar}
                aria-label="Fechar busca"
              >
                <X size={17} aria-hidden />
              </button>
            </div>

            <div className="fg-cmd-body">
              {totalAchados === 0 ? (
                <div className="fg-cmd-empty">
                  Nenhum resultado encontrado para <strong>“{termo}”</strong>. Tente buscar por parte do nome, CNPJ ou número de decreto.
                </div>
              ) : (
                <>
                  {resultados.empresas.length > 0 && (
                    <div className="fg-cmd-group">
                      <div className="fg-cmd-group__lbl">
                        <Building2 size={13} aria-hidden />
                        <span>
                          {termo.trim().length < 2 ? 'Maiores fornecedores (2025–2026)' : 'Empresas e fornecedores'}
                        </span>
                      </div>
                      {resultados.empresas.map((c) => (
                        <button
                          key={c.chave}
                          type="button"
                          className="fg-cmd-item"
                          onClick={() => ir(`/despesas/credor/${c.chave}`)}
                        >
                          <div className="fg-cmd-item__main">
                            <strong>{nomeLegivel(c.credor)}</strong>
                            <span>
                              {c.cnpj ? formatarCnpj(c.cnpj) : c.tipo} · {c.area}
                              {c.qtdConexoesDom > 0 ? ` · ${c.qtdConexoesDom} ato(s) no Diário` : ''}
                            </span>
                          </div>
                          <span className="fg-cmd-item__val">{brlCompacto(c.totalConsolidado)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {resultados.decretos.length > 0 && (
                    <div className="fg-cmd-group">
                      <div className="fg-cmd-group__lbl">
                        <FileText size={13} aria-hidden />
                        <span>Decretos no orçamento</span>
                      </div>
                      {resultados.decretos.map((d) => (
                        <a
                          key={`${d.numero}-${d.dataIso}`}
                          href={d.pdfUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="fg-cmd-item"
                          onClick={onFechar}
                        >
                          <div className="fg-cmd-item__main">
                            <strong>
                              Decreto nº {d.numeroFmt} ({d.dataBr})
                            </strong>
                            <span>{d.trecho.slice(0, 95)}…</span>
                          </div>
                          <span className="fg-cmd-item__val">{brlCompacto(d.valor)}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {resultados.leis.length > 0 && (
                    <div className="fg-cmd-group">
                      <div className="fg-cmd-group__lbl">
                        <Scale size={13} aria-hidden />
                        <span>Leis municipais sancionadas</span>
                      </div>
                      {resultados.leis.map((l) => (
                        <a
                          key={l.numero}
                          href={l.pdfUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="fg-cmd-item"
                          onClick={onFechar}
                        >
                          <div className="fg-cmd-item__main">
                            <strong>
                              Lei nº {l.numeroFmt} ({l.dataBr})
                            </strong>
                            <span>{l.ementa.slice(0, 95)}…</span>
                          </div>
                          <ArrowRight size={14} aria-hidden />
                        </a>
                      ))}
                    </div>
                  )}

                  {resultados.politicos.length > 0 && (
                    <div className="fg-cmd-group">
                      <div className="fg-cmd-group__lbl">
                        <User size={13} aria-hidden />
                        <span>Prefeito, vice e vereadores</span>
                      </div>
                      {resultados.politicos.map((p) => (
                        <button
                          key={p.pessoaId}
                          type="button"
                          className="fg-cmd-item"
                          onClick={() => ir(`/politicos/${p.pessoaId}`)}
                        >
                          <div className="fg-cmd-item__main">
                            <strong>{nomeLegivel(p.nome.replace(/\s+/g, ' '))}</strong>
                            <span>
                              {p.cargoNome} · {p.partido}
                              {p.votos > 0 ? ` · ${Number(p.votos).toLocaleString('pt-BR')} votos` : ''}
                            </span>
                          </div>
                          <ArrowRight size={14} aria-hidden />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="fg-cmd-foot">
              <span>Dica: pressione <kbd>Ctrl</kbd> + <kbd>K</kbd> em qualquer tela para buscar</span>
              {termo.trim().length >= 2 && (
                <button
                  type="button"
                  className="fg-link-btn"
                  onClick={() => ir(`/despesas?ano=todos&q=${encodeURIComponent(termo.trim())}`)}
                >
                  <span>Ver todos os resultados em Empresas →</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
