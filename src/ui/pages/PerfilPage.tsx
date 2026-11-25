import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Info,
  Landmark,
  Link as LinkIcon,
  Mic,
  Scale,
  ScrollText,
  Search,
  Users,
  Vote,
} from 'lucide-react';
import { perfilService, type PerfilCompleto } from '@/services/perfilService';
import { abasRepository, type LinhaAba } from '@/repositories/abasRepository';
import { fonteRepository } from '@/repositories/adminRepositories';
import {
  camaraService,
  type CamaraProposicao,
  type CamaraOrgao,
  type CamaraFrente,
  type CamaraDiscurso,
  type CamaraDeputadoDetalhe,
} from '@/services/camaraService';
import { alespService } from '@/services/alespService';
import { VOTACOES_IMPORTANTES } from '@/domain/votacoesFamosas';
import { LINKS_OFICIAIS } from '@/domain/plataforma';
import { formatarData, percentualPresenca, rotuloSituacao } from '@/domain/rules';
import { useAsync } from '../hooks/useAsync';
import { EmptyState, ErrorBox, FonteRef, Loading } from '../components/common';
import { PartyBadge } from '../components/PartyBadge';
import { nomeLegivel } from '../format';

type TabId =
  | 'geral' | 'votacoes' | 'propostas' | 'presenca' | 'comissoes' | 'frentes'
  | 'discursos' | 'historico' | 'mandato' | 'fontes';

const TABS: { id: TabId; label: string; icone: React.ReactNode }[] = [
  { id: 'geral', label: 'Resumo do Mandato', icone: <FileText size={16} /> },
  { id: 'votacoes', label: 'Votações Importantes', icone: <Vote size={16} /> },
  { id: 'propostas', label: 'Projetos de Lei', icone: <ScrollText size={16} /> },
  { id: 'presenca', label: 'Presença & Trabalho', icone: <Calendar size={16} /> },
  { id: 'comissoes', label: 'Comissões', icone: <Users size={16} /> },
  { id: 'frentes', label: 'Frentes Parlamentares', icone: <Briefcase size={16} /> },
  { id: 'discursos', label: 'Discursos', icone: <Mic size={16} /> },
  { id: 'historico', label: 'Histórico & Eleições', icone: <Clock size={16} /> },
  { id: 'mandato', label: 'Mandatos', icone: <Landmark size={16} /> },
  { id: 'fontes', label: 'Fontes Oficiais', icone: <LinkIcon size={16} /> },
];

const AJUDA: Record<TabId, string> = {
  geral: 'Ficha resumida com dados oficiais de atuação, contatos de gabinete e identificação.',
  votacoes: 'Como o parlamentar votou nas decisões de maior impacto para os cidadãos.',
  propostas: 'Projetos de lei apresentados com explicação em linguagem simples sobre o que cada um muda.',
  presenca: 'Frequência nas sessões oficiais de votação e dias de trabalho registrados.',
  comissoes: 'Grupos temáticos (Educação, Saúde, Segurança, Finanças) onde o parlamentar atua.',
  frentes: 'Frentes parlamentares e grupos de trabalho interpartidários que o parlamentar integra.',
  discursos: 'Pronunciamentos e discursos oficiais proferidos no plenário.',
  historico: 'Trajetória eleitoral: votos em eleições passadas e mandatos anteriores.',
  mandato: 'Mandatos registrados e trajetória em cargos públicos.',
  fontes: 'Links e APIs oficiais de onde foram extraídos todos os dados deste perfil.',
};

/** Aba de Votações Explicativas para o Eleitor */
function VotacoesAba({ cargoCodigo }: { cargoCodigo?: string }) {
  const isEstadual = cargoCodigo === 'deputado_estadual';
  const lista = useMemo(() => {
    if (isEstadual) {
      return VOTACOES_IMPORTANTES.filter((v) => v.orgao === 'ALESP');
    }
    return VOTACOES_IMPORTANTES.filter((v) => v.orgao === 'Câmara dos Deputados');
  }, [isEstadual]);

  return (
    <div>
      <div className="camara-api-banner">
        <div>
          <strong>Principais Decisões Legislativas em Pauta</strong>
          <div className="muted small">
            Entenda o que estava em discussão, o resultado oficial e a fonte do registro.
          </div>
        </div>
        <span className="fonte-badge">Diário Oficial & Atas</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {lista.map((v) => (
          <article
            key={v.id}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div>
                <span className="chip" style={{ marginRight: '8px', fontWeight: 700 }}>
                  {v.categoria}
                </span>
                <span className="muted small">{v.codigoOficial}</span>
              </div>
              <span
                className="chip"
                style={{
                  backgroundColor: v.resultadoFinal === 'Aprovado' ? 'var(--status-success-bg)' : 'var(--bg-subtle)',
                  color: v.resultadoFinal === 'Aprovado' ? 'var(--status-success-text)' : 'var(--text-main)',
                  borderColor: v.resultadoFinal === 'Aprovado' ? 'var(--status-success-border)' : 'var(--border-light)',
                  fontWeight: 700,
                }}
              >
                {v.resultadoFinal === 'Aprovado' ? '✓ Aprovado' : v.resultadoFinal}
              </span>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              {v.tituloAmigavel}
            </h3>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.55, marginBottom: '14px' }}>
              {v.resumoCidadao}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', fontSize: '0.82rem' }}>
              <span className="muted">Votação realizada em: <strong>{formatarData(v.dataVotacao)}</strong> · {v.orgao}</span>
              <a
                href={v.fonteOficialUrl}
                target="_blank"
                rel="noreferrer noopener"
                style={{ fontWeight: 700, color: 'var(--text-main)', textDecoration: 'underline' }}
              >
                Ver Ata de Votação Oficial ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function classificarTemaProposta(texto: string): { label: string; cor: string; bg: string } {
  const t = texto.toLowerCase();
  if (/(saúde|saude|hospital|ubs|upa|médic|medicamento|maternidade|enferm|vacina|psicol|autis|tea\b|câncer|cancer|samu)/.test(t)) {
    return { label: 'Saúde', cor: '#b91c1c', bg: '#fee2e2' };
  }
  if (/(educa|escola|creche|aluno|professor|merenda|infantil|criança|adolescente|juventude|cultura|esporte)/.test(t)) {
    return { label: 'Educação e Cultura', cor: '#6d28d9', bg: '#ede9fe' };
  }
  if (/(animal|animais|castração|pet|canil|meio ambiente|ambiental|árvore|parque|ecoponto|resíduo|lixo|saneamento|sabesp|enchente|alagamento|risco)/.test(t)) {
    return { label: 'Meio Ambiente e Animais', cor: '#15803d', bg: '#dcfce7' };
  }
  if (/(transporte|ônibus|onibus|trânsito|transito|semáforo|faixa|mobilidade|aeroporto|viária)/.test(t)) {
    return { label: 'Transporte e Trânsito', cor: '#1d4ed8', bg: '#dbeafe' };
  }
  if (/(pavimenta|asfalto|buraco|iluminação|poste|obra|praça|rua |avenida |estrada |zeladoria|moradia|habitação|loteamento|minha casa)/.test(t)) {
    return { label: 'Obras e Bairros', cor: '#b45309', bg: '#fef3c7' };
  }
  if (/(segurança|guarda civil|gcm|polícia|violência|mulher|feminicídio|idoso)/.test(t)) {
    return { label: 'Segurança e Direitos', cor: '#334155', bg: '#e2e8f0' };
  }
  return { label: 'Orçamento e Gestão', cor: '#0369a1', bg: '#e0f2fe' };
}

function explicarTipoDocumento(tituloOuBadge: string): string {
  const t = tituloOuBadge.toLowerCase();
  if (t.includes('requerimento de informação')) {
    return 'Fiscalização: obriga a Prefeitura a responder oficialmente e entregar documentos sobre gastos, obras ou falhas no serviço.';
  }
  if (t.includes('indicação')) {
    return 'Pedido de bairro: solicita à Prefeitura um serviço direto (tapa-buraco, iluminação, limpeza, melhoria em UBS ou linha de ônibus).';
  }
  if (t.includes('projeto de lei') || t.includes('lei orgânica')) {
    return 'Criação de lei: propõe uma nova regra ou direito permanente para os moradores de Guarulhos (precisa ser votado e aprovado).';
  }
  if (t.includes('parecer') || t.includes('relatório') || t.includes('substitutivo')) {
    return 'Análise em comissão: avaliação técnica ou investigação (CEI) assinada pelo parlamentar antes da votação em plenário.';
  }
  if (t.includes('moção') || t.includes('decreto legislativo')) {
    return 'Reconhecimento oficial: manifestação formal ou homenagem aprovada pela Câmara Municipal.';
  }
  return 'Atuação oficial protocolada na Câmara Municipal de Guarulhos.';
}

function explicarAndamentoPasso2(tituloOuBadge: string): { titulo: string; texto: string } {
  const t = tituloOuBadge.toLowerCase();
  if (t.includes('requerimento')) {
    return {
      titulo: '2º Cobrança Oficial ao Executivo',
      texto: 'A Câmara notificou oficialmente a Prefeitura de Guarulhos, que tem prazo legal da Lei Orgânica para entregar os documentos e explicações.',
    };
  }
  if (t.includes('indicação')) {
    return {
      titulo: '2º Envio à Secretaria de Obras / Serviços',
      texto: 'O pedido do bairro foi encaminhado ao setor responsável da Prefeitura (Obras, Saúde, Trânsito ou Iluminação) para inclusão no cronograma.',
    };
  }
  if (t.includes('projeto de lei') || t.includes('lei orgânica') || t.includes('emenda')) {
    return {
      titulo: '2º Análise nas Comissões e Plenário',
      texto: 'O texto passa pelas Comissões Permanentes (Justiça, Finanças e mérito) antes da votação final pelos 34 vereadores e sanção do Prefeito.',
    };
  }
  return {
    titulo: '2º Deliberação Legislativa',
    texto: 'Matéria submetida à análise regimental das comissões técnicas e do Plenário da Câmara Municipal de Guarulhos.',
  };
}

/** Aba de Propostas com filtro didático e explicação prática + "No Que Deu" */
function PropostasAba({ pessoaId, camaraId }: { pessoaId: string; camaraId?: number }) {
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'leis' | 'fiscalizacao' | 'bairro' | 'comissoes'>('todos');
  const [expandidaId, setExpandidaId] = useState<string | null>(null);
  const resCamara = useAsync(() => (camaraId ? camaraService.getProposicoes(camaraId) : Promise.resolve([])), [camaraId]);
  const resBanco = useAsync(() => abasRepository.propostas(pessoaId), [pessoaId]);

  if (resCamara.loading || resBanco.loading) return <Loading />;

  const proposicoesCamara: CamaraProposicao[] = resCamara.data ?? [];
  const proposicoesBanco: LinhaAba[] = resBanco.data ?? [];

  if (proposicoesCamara.length > 0) {
    return (
      <div>
        <div className="camara-api-banner">
          <div>
            <strong>Projetos de Lei e Proposições Oficiais</strong>
            <div className="muted small">
              {proposicoesCamara.length} projetos de autoria oficial do parlamentar na Câmara dos Deputados.
            </div>
          </div>
          <span className="fonte-badge">Portal Câmara</span>
        </div>
        <ul className="data-rows">
          {proposicoesCamara.map((p) => (
            <li key={p.id} className="data-row">
              <div className="data-row__main">
                <div className="data-row__title">
                  {p.siglaTipo} {p.numero}/{p.ano}
                </div>
                <div className="data-row__subtitle" style={{ marginTop: '4px', lineHeight: 1.5 }}>
                  {p.ementa}
                </div>
                {p.dataApresentacao && (
                  <div className="muted small" style={{ marginTop: '6px' }}>
                    Data de apresentação: {formatarData(p.dataApresentacao)}
                  </div>
                )}
              </div>
              <div className="data-row__side">
                <span className="chip">{p.siglaTipo}</span>
                <a
                  href={`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${p.id}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn--ghost"
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  Ver Tramitação ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (proposicoesBanco.length > 0) {
    const filtradas = proposicoesBanco.filter((r) => {
      if (filtroTipo === 'todos') return true;
      const t = (r.titulo || '').toLowerCase();
      if (filtroTipo === 'leis') return t.includes('projeto de lei') || t.includes('lei orgânica') || t.includes('emenda');
      if (filtroTipo === 'fiscalizacao') return t.includes('requerimento') || t.includes('ofício');
      if (filtroTipo === 'bairro') return t.includes('indicação');
      if (filtroTipo === 'comissoes') return t.includes('parecer') || t.includes('relatório') || t.includes('moção') || t.includes('decreto');
      return true;
    });

    return (
      <div>
        {/* Guia Rápido para o Cidadão */}
        <div
          style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: '0.84rem',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Info size={15} aria-hidden />
            <span>Entenda a diferença na prática e veja o resultado de cada item:</span>
          </strong>
          <span>
            • <strong>Projeto de Lei:</strong> cria uma nova lei na cidade. &nbsp;·&nbsp;{' '}
            <strong>Requerimento de Informação:</strong> fiscaliza e cobra documentos da Prefeitura. &nbsp;·&nbsp;{' '}
            <strong>Indicação:</strong> pede obras, asfalto, luz ou melhorias para um bairro. Toque em{' '}
            <strong>“Ver andamento”</strong> abaixo para acompanhar cada etapa.
          </span>
        </div>

        {/* Filtros por Tipo */}
        <div className="fg-pills" style={{ marginBottom: 14 }}>
          <button
            type="button"
            className={filtroTipo === 'todos' ? 'fg-pill is-active' : 'fg-pill'}
            onClick={() => setFiltroTipo('todos')}
          >
            Todas ({proposicoesBanco.length})
          </button>
          <button
            type="button"
            className={filtroTipo === 'leis' ? 'fg-pill is-active' : 'fg-pill'}
            onClick={() => setFiltroTipo('leis')}
          >
            Projetos de Lei
          </button>
          <button
            type="button"
            className={filtroTipo === 'fiscalizacao' ? 'fg-pill is-active' : 'fg-pill'}
            onClick={() => setFiltroTipo('fiscalizacao')}
          >
            Fiscalização e Requerimentos
          </button>
          <button
            type="button"
            className={filtroTipo === 'bairro' ? 'fg-pill is-active' : 'fg-pill'}
            onClick={() => setFiltroTipo('bairro')}
          >
            Pedidos de Bairro
          </button>
          <button
            type="button"
            className={filtroTipo === 'comissoes' ? 'fg-pill is-active' : 'fg-pill'}
            onClick={() => setFiltroTipo('comissoes')}
          >
            Pareceres e Outros
          </button>
        </div>

        <ul className="data-rows">
          {filtradas.map((r, idx) => {
            const tema = classificarTemaProposta(`${r.titulo} ${r.subtitulo ?? ''}`);
            const explicacao = explicarTipoDocumento(r.titulo);
            const passo2 = explicarAndamentoPasso2(r.titulo);
            const isExpandida = expandidaId === r.id || (expandidaId === null && idx === 0);
            const linkRealDocumento = r.urlExterna && !r.urlExterna.includes('#doc-') ? r.urlExterna : null;
            const situacaoFinal = r.badge || 'Em tramitação legislativa na Câmara';
            const concluidoOuAprovado = /(aprovad|promulgad|lei|concluíd|respondid|encaminhad)/i.test(situacaoFinal);

            return (
              <li
                key={r.id}
                className="data-row"
                style={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 10,
                  border: isExpandida ? '2px solid #0284c7' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      className="fg-badge"
                      style={{ background: tema.bg, color: tema.cor, fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      {tema.label}
                    </span>
                    <strong style={{ fontSize: '0.96rem', color: 'var(--text-main)' }}>{r.titulo}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      className="fg-badge"
                      style={{
                        background: concluidoOuAprovado ? '#dcfce7' : '#e0f2fe',
                        color: concluidoOuAprovado ? '#166534' : '#0369a1',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                      }}
                    >
                      {situacaoFinal}
                    </span>
                    <button
                      type="button"
                      className="fg-btn"
                      style={{
                        fontSize: '0.76rem',
                        padding: '5px 10px',
                        fontWeight: 700,
                        background: isExpandida ? '#1e5fa8' : '#eff6ff',
                        color: isExpandida ? '#ffffff' : '#1e5fa8',
                        borderColor: '#1e5fa8',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                      onClick={() => setExpandidaId(isExpandida ? '__none__' : r.id)}
                    >
                      <Search size={13} aria-hidden />
                      <span>{isExpandida ? 'Ocultar andamento' : 'Ver andamento'}</span>
                    </button>
                  </div>
                </div>

                {r.subtitulo && (
                  <div style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
                    {r.subtitulo}
                  </div>
                )}

                <div
                  style={{
                    fontSize: '0.79rem',
                    color: '#475569',
                    background: '#f8fafc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    borderLeft: '3px solid #94a3b8',
                  }}
                >
                  {explicacao}
                </div>

                {/* Painel Expandido: "No que deu" até o fim */}
                {isExpandida && (
                  <div
                    style={{
                      marginTop: 4,
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
                      Acompanhamento — o que aconteceu com esta proposta
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                        gap: 10,
                      }}
                    >
                      <div style={{ background: '#ffffff', padding: '10px', borderRadius: 8, borderLeft: '3px solid #0284c7' }}>
                        <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#0284c7' }}>1º PROTOCOLO NA CÂMARA</div>
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#09152b', marginTop: 2 }}>
                          {r.titulo}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 2 }}>
                          Registrado oficialmente no sistema legislativo da 19ª Legislatura.
                        </div>
                      </div>

                      <div style={{ background: '#ffffff', padding: '10px', borderRadius: 8, borderLeft: '3px solid #0284c7' }}>
                        <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#0284c7' }}>
                          {passo2.titulo.toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                          {passo2.texto}
                        </div>
                      </div>

                      <div style={{ background: '#ffffff', padding: '10px', borderRadius: 8, borderLeft: '3px solid #10b981' }}>
                        <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#047857' }}>
                          3º SITUAÇÃO ATUAL (“NO QUE DEU”)
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#047857', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={14} aria-hidden />
                          <span>{situacaoFinal}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 2 }}>
                          Registro auditado na Câmara Municipal de Guarulhos.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
                      <FonteRef id={r.fonteId} />
                      {linkRealDocumento && (
                        <a
                          href={linkRealDocumento}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="fg-link-inline"
                          style={{ fontSize: '0.8rem' }}
                        >
                          <span>
                            {linkRealDocumento.includes('diariooficial.guarulhos')
                              ? 'Abrir Lei no PDF do Diário Oficial'
                              : 'Abrir documento na Câmara'}
                          </span>
                          <ExternalLink size={13} aria-hidden />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="empty-box">
      <div className="empty-box__title">Consulta direta de proposições em tramitação</div>
      <p className="empty-box__text">
        Não foram localizadas leis sancionadas com autoria nominal direta no catálogo atual, mas você pode consultar
        todas as indicações, requerimentos e projetos em tramitação diretamente no portal legislativo oficial.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
        <a
          href={LINKS_OFICIAIS.camaraAtividade}
          target="_blank"
          rel="noreferrer noopener"
          className="fg-btn fg-btn--primary fg-btn--sm"
        >
          <span>Consultar proposições na Câmara</span>
          <ExternalLink size={13} aria-hidden />
        </a>
        <Link to="/decretos?aba=diarios" className="fg-btn fg-btn--sm">
          <span>Ver 197 Leis Sancionadas no Diário</span>
        </Link>
      </div>
    </div>
  );
}

/** Aba de Presença & Trabalho */
function PresencaAba({ perfil }: { perfil: PerfilCompleto }) {
  const res = useAsync(() => perfilService.metricas(perfil.mandatos), [perfil.pessoa.id]);
  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;

  const metricas = res.data?.[0]?.metricas;
  const sessoesRegistradas = metricas?.sessoes_registradas ?? 0;
  const sessoesPresente = metricas?.sessoes_presente ?? 0;

  if (!sessoesRegistradas) {
    return (
      <EmptyState title="Frequência ainda não disponibilizada">
        Os registros individuais de presença em plenário ainda não foram liberados pela casa legislativa para este
        mandato.
      </EmptyState>
    );
  }

  const percentual = ((sessoesPresente / sessoesRegistradas) * 100).toFixed(1);

  return (
    <div>
      <div className="camara-api-banner">
        <div>
          <strong>Registro de frequência em sessões</strong>
          <div className="muted small">Controle oficial de presença em plenário.</div>
        </div>
        <span className="fonte-badge">Regimento Interno</span>
      </div>

      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-card__value" style={{ color: 'var(--status-success-text)' }}>
            {percentual}%
          </div>
          <div className="metric-card__label">Índice de presença</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__value">{sessoesPresente}</div>
          <div className="metric-card__label">Sessões com presença</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__value">{Math.max(0, sessoesRegistradas - sessoesPresente)}</div>
          <div className="metric-card__label">Ausências ou licenças</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__value">{sessoesRegistradas}</div>
          <div className="metric-card__label">Total de sessões</div>
        </div>
      </div>

      <article style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '0.88rem', color: 'var(--text-body)' }}>
        <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={15} aria-hidden />
          <span>Como funciona o registro de presença?</span>
        </strong>
        <p style={{ marginTop: '4px', lineHeight: 1.5 }}>
          Os parlamentares registram presença eletronicamente no início e durante as sessões de votação. Faltas não
          justificadas resultam em desconto em folha.
        </p>
      </article>
    </div>
  );
}

/** Aba de Comissões e Órgãos */
function ComissoesAba({
  pessoaId,
  camaraId,
  comissoesLocais,
}: {
  pessoaId: string;
  camaraId?: number;
  comissoesLocais?: { nome: string; papel: string }[];
}) {
  const resCamara = useAsync(() => (camaraId ? camaraService.getOrgaos(camaraId) : Promise.resolve([])), [camaraId]);
  const resBanco = useAsync(() => abasRepository.comissoes(pessoaId), [pessoaId]);

  if (resCamara.loading || resBanco.loading) return <Loading />;

  const orgaosCamara: CamaraOrgao[] = resCamara.data ?? [];
  const orgaosBanco: LinhaAba[] = resBanco.data ?? [];

  if (comissoesLocais && comissoesLocais.length > 0) {
    return (
      <div>
        <div className="camara-api-banner">
          <div>
            <strong>Comissões Permanentes, CEIs e Frentes Parlamentares ({comissoesLocais.length})</strong>
            <div className="muted small">
              Na prática: as comissões analisam projetos, investigam denúncias (CEIs) e fiscalizam contratos antes das votações.
            </div>
          </div>
          <span className="fonte-badge">Câmara de Guarulhos</span>
        </div>
        <ul className="data-rows">
          {comissoesLocais.map((c, idx) => (
            <li key={idx} className="data-row">
              <div className="data-row__main">
                <div className="data-row__title">{c.nome}</div>
                <div className="data-row__subtitle" style={{ marginTop: 4 }}>
                  Função exercida: <strong>{c.papel}</strong>
                </div>
              </div>
              <div className="data-row__side">
                <span className="chip" style={{ fontWeight: 700 }}>{c.papel}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (orgaosCamara.length > 0) {
    return (
      <div>
        <div className="camara-api-banner">
          <div>
            <strong>Comissões da Câmara dos Deputados</strong>
            <div className="muted small">Órgãos deliberativos e legislativos onde o deputado atua.</div>
          </div>
          <span className="fonte-badge">Câmara dos Deputados</span>
        </div>
        <ul className="data-rows">
          {orgaosCamara.map((o) => (
            <li key={o.idOrgao} className="data-row">
              <div className="data-row__main">
                <div className="data-row__title">
                  {o.nomePublicacao || o.nomeOrgao} ({o.siglaOrgao})
                </div>
                <div className="data-row__subtitle" style={{ marginTop: '4px' }}>
                  Condição: <strong>{o.titulo}</strong> · Atuação desde {formatarData(o.dataInicio)}
                </div>
              </div>
              <div className="data-row__side">
                <span className="chip" style={{ fontWeight: 700 }}>
                  {o.titulo}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (orgaosBanco.length > 0) {
    return (
      <ul className="data-rows">
        {orgaosBanco.map((r) => (
          <li key={r.id} className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">{r.titulo}</div>
              {r.subtitulo && <div className="data-row__subtitle">{r.subtitulo}</div>}
            </div>
            <div className="data-row__side">
              {r.badge && <span className="chip">{r.badge}</span>}
              <FonteRef id={r.fonteId} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="empty-box">
      <div className="empty-box__title">Nenhuma comissão registrada</div>
      <p className="empty-box__text">Sem participações ativas registradas no momento.</p>
    </div>
  );
}

/** Aba de Frentes Parlamentares */
function FrentesAba({ camaraId }: { camaraId?: number }) {
  const res = useAsync(() => (camaraId ? camaraService.getFrentes(camaraId) : Promise.resolve([])), [camaraId]);

  if (!camaraId) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Frentes Parlamentares</div>
        <p className="empty-box__text">Frentes parlamentares disponíveis via API da Câmara dos Deputados.</p>
      </div>
    );
  }

  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;

  const frentes: CamaraFrente[] = res.data ?? [];
  if (frentes.length === 0) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Nenhuma frente registrada</div>
        <p className="empty-box__text">Sem registros de frentes parlamentares ativas.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="camara-api-banner">
        <div>
          <strong>Frentes Parlamentares Integradas ({frentes.length})</strong>
          <div className="muted small">Grupos de atuação suprapartidária na Câmara dos Deputados.</div>
        </div>
        <span className="fonte-badge">57ª Legislatura</span>
      </div>

      <ul className="data-rows">
        {frentes.map((f) => (
          <li key={f.id} className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">{f.titulo}</div>
            </div>
            <div className="data-row__side">
              <span className="chip">Frente Oficial</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Aba de Discursos Oficiais */
function DiscursosAba({ camaraId }: { camaraId?: number }) {
  const res = useAsync(() => (camaraId ? camaraService.getDiscursos(camaraId) : Promise.resolve([])), [camaraId]);

  if (!camaraId) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Discursos e Pronunciamentos</div>
        <p className="empty-box__text">Discursos em plenário disponíveis via Dados Abertos da Câmara dos Deputados.</p>
      </div>
    );
  }

  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;

  const discursos: CamaraDiscurso[] = res.data ?? [];
  if (discursos.length === 0) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Nenhum discurso recente registrado</div>
        <p className="empty-box__text">Sem registros de pronunciamentos recentes no plenário.</p>
      </div>
    );
  }

  return (
    <ul className="data-rows">
      {discursos.map((d, i) => (
        <li key={i} className="data-row">
          <div className="data-row__main">
            <div className="data-row__title">{d.tipoDiscurso || 'Pronunciamento em Plenário'}</div>
            <div className="data-row__subtitle" style={{ marginTop: '4px', lineHeight: 1.5 }}>
              {d.sumario || (d.transcricao ? d.transcricao.slice(0, 240) + '...' : 'Pronunciamento registrado na Câmara.')}
            </div>
          </div>
          <div className="data-row__side">
            <span className="muted small">{formatarData(d.dataHoraInicio)}</span>
            <span className="chip">{d.faseEvento || 'Plenário'}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MetricasGeral({
  perfil,
  onIrParaPropostas,
}: {
  perfil: PerfilCompleto;
  onIrParaPropostas?: () => void;
}) {
  const res = useAsync(() => perfilService.metricas(perfil.mandatos), [perfil.pessoa.id]);
  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;

  const ext = (perfil.pessoa.identificadores_externos ?? {}) as Record<string, any>;
  const biografia: string | undefined = ext.biografia;
  const comissoesLocais: { nome: string; papel: string }[] = Array.isArray(ext.comissoes) ? ext.comissoes : [];
  const cargoCodigo = perfil.mandatoAtual?.cargo?.codigo;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className={comissoesLocais.length > 0 ? 'fg-grid-2' : ''}>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          {biografia && (
            <article
              style={{
                background: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                lineHeight: 1.65,
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={17} aria-hidden />
                <span>Biografia e trajetória</span>
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {biografia
                  .split(/\n{2,}/)
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((paragrafo, idx) => (
                    <p key={idx} style={{ margin: 0, color: 'var(--text-body)', fontSize: '0.9rem' }}>
                      {paragrafo}
                    </p>
                  ))}
              </div>
            </article>
          )}

          {/* O que este cargo significa na prática */}
          <article
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '0.84rem',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Info size={15} aria-hidden />
              <span>O que este cargo faz na prática pelo seu bairro?</span>
            </strong>
            {cargoCodigo === 'prefeito' || cargoCodigo === 'vice_prefeito' ? (
              <span>
                O <strong>Prefeito e o Vice-Prefeito (Poder Executivo)</strong> administram o orçamento anual da cidade
                (bilhões de reais por ano em impostos e repasses): comandam as Secretarias (Saúde, Educação, Obras,
                Transporte), contratam fornecedores, pagam os servidores e executam as obras e serviços nos bairros.
              </span>
            ) : (
              <span>
                O <strong>Vereador (Poder Legislativo)</strong> <u>não executa obras diretamente</u>, mas tem 3 poderes
                fundamentais: <strong>1) Fiscalizar</strong> o Prefeito e investigar contratos (via Requerimentos e CEIs);{' '}
                <strong>2) Votar as Leis e o Orçamento</strong> da cidade; e <strong>3) Cobrar melhorias</strong> de asfalto,
                iluminação, UBS e escolas para os bairros (via Indicações e Emendas Impositivas).
              </span>
            )}
          </article>
        </div>

        {comissoesLocais.length > 0 && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
              alignSelf: 'start',
            }}
          >
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Scale size={17} aria-hidden />
              <span>Comissões e Frentes na Câmara ({comissoesLocais.length})</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {comissoesLocais.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '9px 11px',
                    borderRadius: 8,
                    border: '1px solid var(--border-light)',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {c.nome}
                  </div>
                  <div className="muted small" style={{ marginTop: 3, fontSize: '0.74rem' }}>
                    Função: <strong>{c.papel}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!res.data?.length ? (
        <EmptyState title="Sem mandatos ativos registrados" />
      ) : (
        res.data.map(({ mandato, metricas }) => (
          <div key={mandato.id} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {mandato.cargo?.nome}
                </h3>
                <span className="cargo-tag">{mandato.localidade?.nome ?? 'Guarulhos'}</span>
                {mandato.orgao?.nome && <span className="muted small">· {mandato.orgao.nome}</span>}
              </div>

              {onIrParaPropostas && (metricas?.projetos_apresentados ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={onIrParaPropostas}
                  style={{
                    background: '#1e5fa8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ScrollText size={15} aria-hidden />
                  <span>Ver projetos e fiscalizações ({metricas?.projetos_apresentados}) →</span>
                </button>
              )}
            </div>

            <div className="metrics-grid">
              <div
                className="metric-card"
                onClick={onIrParaPropostas}
                style={{ cursor: onIrParaPropostas ? 'pointer' : undefined }}
                title="Toque para abrir a lista completa de projetos e requerimentos"
              >
                <div className="metric-card__value">{metricas?.projetos_apresentados ?? 0}</div>
                <div className="metric-card__label">Proposições Registradas</div>
                {onIrParaPropostas && (
                  <div className="metric-card__hint" style={{ color: '#0284c7', fontWeight: 700 }}>
                    Toque para conferir cada uma →
                  </div>
                )}
              </div>
              <div
                className="metric-card"
                onClick={onIrParaPropostas}
                style={{ cursor: onIrParaPropostas ? 'pointer' : undefined }}
              >
                <div className="metric-card__value">{metricas?.projetos_aprovados ?? 0}</div>
                <div className="metric-card__label">Proposições Aprovadas / Encaminhadas</div>
              </div>
              <div className="metric-card">
                <div className="metric-card__value">{metricas?.votacoes_registradas ?? 0}</div>
                <div className="metric-card__label">Votações Nominalmente Registradas</div>
              </div>
              <div className="metric-card">
                <div className="metric-card__value">
                  {percentualPresenca(metricas!) == null ? '—' : `${percentualPresenca(metricas!)!.toFixed(1)}%`}
                </div>
                <div className="metric-card__label">Assiduidade em Sessões</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Timeline({ perfil }: { perfil: PerfilCompleto }) {
  if (!perfil.timeline.length) {
    return (
      <div className="empty-box">
        <div className="empty-box__title">Sem eventos registrados</div>
        <p className="empty-box__text">O histórico completo será atualizado a partir dos registros do TSE.</p>
      </div>
    );
  }

  return (
    <ol className="timeline">
      {perfil.timeline.map((e, i) => (
        <li key={i} className="timeline__item">
          <div className="timeline__year">{e.data.slice(0, 4)}</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.98rem' }}>{e.titulo}</div>
            {e.detalhe && <div className="muted small" style={{ marginTop: '2px' }}>{e.detalhe}</div>}
            {e.tipo !== 'filiacao' && <div style={{ marginTop: '6px' }}><FonteRef id={e.fonteId} /></div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function FontesAba({ perfil, camaraId, alespId, camaraGruUrl, tseUrl }: { perfil: PerfilCompleto; camaraId?: number; alespId?: string; camaraGruUrl?: string; tseUrl?: string }) {
  const ids = useMemo(
    () => [...new Set([...perfil.mandatos.map((m) => m.fonte_id), ...perfil.candidaturas.map((c) => c.fonte_id)].filter((x): x is string => !!x))],
    [perfil],
  );
  const res = useAsync(() => fonteRepository.getMany(ids), [ids.join(',')]);

  return (
    <div>
      <div className="camara-api-banner">
        <div>
          <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LinkIcon size={15} aria-hidden />
            <span>Fontes oficiais</span>
          </strong>
          <div className="muted small">Todas as informações deste perfil podem ser conferidas nos portais oficiais.</div>
        </div>
      </div>

      <ul className="data-rows">
        {camaraGruUrl && (
          <li className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">Câmara Municipal de Guarulhos — Perfil Oficial do Vereador</div>
              <div className="muted small">Portal Oficial da 19ª Legislatura (2025–2028)</div>
              <a
                href={camaraGruUrl}
                target="_blank"
                rel="noreferrer noopener"
                style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
              >
                Abrir perfil oficial na Câmara de Guarulhos ↗
              </a>
            </div>
            <div className="data-row__side">
              <span className="chip">Câmara de Guarulhos</span>
            </div>
          </li>
        )}

        {tseUrl && (
          <li className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">Tribunal Superior Eleitoral (TSE) — DivulgaCandContas 2024</div>
              <div className="muted small">Registro de candidatura, votação e prestação de contas eleitoral</div>
              <a
                href={tseUrl}
                target="_blank"
                rel="noreferrer noopener"
                style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
              >
                Abrir registro oficial no TSE ↗
              </a>
            </div>
            <div className="data-row__side">
              <span className="chip">TSE</span>
            </div>
          </li>
        )}

        {camaraId && (
          <li className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">Câmara dos Deputados — Portal Oficial de Dados Abertos</div>
              <div className="muted small">Registro Parlamentar ID: {camaraId}</div>
              <a
                href={`https://www.camara.leg.br/deputados/${camaraId}`}
                target="_blank"
                rel="noreferrer noopener"
                style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
              >
                Abrir página oficial na Câmara ↗
              </a>
            </div>
            <div className="data-row__side">
              <span className="chip">Câmara Federal</span>
            </div>
          </li>
        )}

        {alespId && (
          <li className="data-row">
            <div className="data-row__main">
              <div className="data-row__title">Assembleia Legislativa do Estado de SP (ALESP)</div>
              <div className="muted small">Portal da Transparência ALESP · Matrícula: {alespId}</div>
              <a
                href={alespService.getPaginaOficialUrl(alespId)}
                target="_blank"
                rel="noreferrer noopener"
                style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
              >
                Abrir perfil oficial na ALESP ↗
              </a>
            </div>
            <div className="data-row__side">
              <span className="chip">ALESP</span>
            </div>
          </li>
        )}

        {res.data?.map((f) => {
          const urlLimpa =
            f.url && !f.url.includes('/api/json/') && !f.url.includes('dadosabertos.camara.leg.br/api')
              ? f.url
              : LINKS_OFICIAIS.camara;
          return (
            <li key={f.id} className="data-row">
              <div className="data-row__main">
                <div className="data-row__title">{f.titulo}</div>
                <div className="muted small">
                  {[f.orgao, f.tipo].filter(Boolean).join(' · ')} · Consulta realizada em {formatarData(f.data_consulta)}
                </div>
                <a href={urlLimpa} target="_blank" rel="noreferrer noopener" style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}>
                  Acessar portal oficial da fonte ↗
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PerfilPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<TabId>('geral');
  const [fotoErro, setFotoErro] = useState(false);
  const res = useAsync(() => perfilService.carregar(id), [id]);

  useEffect(() => {
    setFotoErro(false);
  }, [id]);

  const p = res.data;
  const identificadores = (p?.pessoa?.identificadores_externos || {}) as Record<string, any>;
  const camaraId: number | undefined = identificadores.camara_id;
  const alespId: string | undefined = identificadores.alesp_id;
  const camaraGruUrl: string | undefined = identificadores.camara_gru_url;
  const tseUrl: string | undefined = identificadores.url_tse_divulga || identificadores.url_oficial;
  const emailGabinete: string | undefined = identificadores.email_gabinete;
  const mesaDiretora: string | undefined = identificadores.cargo_mesa_diretora;
  const numeroUrna: string | undefined = identificadores.numero_urna;
  const ocupacaoExt: string | undefined = identificadores.ocupacao;
  const escolaridadeExt: string | undefined = identificadores.escolaridade;
  const comissoesLocais: { nome: string; papel: string }[] = Array.isArray(identificadores.comissoes)
    ? identificadores.comissoes
    : [];

  // Carregar detalhes ao vivo do gabinete e profissão da Câmara
  const resCamaraDetalhe = useAsync<CamaraDeputadoDetalhe | null>(
    () => (camaraId ? camaraService.getDeputado(camaraId) : Promise.resolve(null)),
    [camaraId],
  );

  const resProfissoes = useAsync(
    () => (camaraId ? camaraService.getProfissoes(camaraId) : Promise.resolve([])),
    [camaraId],
  );

  const tabsDisponiveis = useMemo(() => {
    return TABS.filter(t => {
      if (['geral', 'historico', 'mandato', 'fontes'].includes(t.id)) return true;
      if (t.id === 'propostas') return Boolean(camaraId || alespId || camaraGruUrl);
      if (t.id === 'comissoes') return Boolean(camaraId || alespId || comissoesLocais.length > 0);
      if (['votacoes', 'presenca', 'frentes', 'discursos'].includes(t.id)) {
        return Boolean(camaraId || alespId);
      }
      return false;
    });
  }, [camaraId, alespId, camaraGruUrl, comissoesLocais.length]);

  if (res.loading) return <Loading />;
  if (res.error) return <ErrorBox error={res.error} />;
  if (!p) return <EmptyState title="Político não encontrado" />;

  const atual = p.mandatoAtual;
  const eleita = p.candidaturas
    .filter((c) => c.resultado?.startsWith('eleito'))
    .sort((a, b) => (b.eleicao?.ano ?? 0) - (a.eleicao?.ano ?? 0))[0];
  const rawNome = p.pessoa.nome_politico ?? p.pessoa.nome_civil;
  const nome = nomeLegivel(rawNome.replace(/\s+/g, ' '));
  const detalheCamara = resCamaraDetalhe.data;
  const gabinete = detalheCamara?.ultimoStatus?.gabinete;
  const profissao = resProfissoes.data?.[0]?.titulo ?? ocupacaoExt;
  const escolaridade = detalheCamara?.escolaridade ?? escolaridadeExt;

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/politicos" className="btn btn--ghost" style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} aria-hidden />
          <span>Voltar para a lista</span>
        </Link>
      </div>

      {/* Header do Perfil Responsivo com Foto em Destaque */}
      <header className="profile-hero">
        <div className="profile-hero__photo-wrapper">
          {p.pessoa.foto_url && !fotoErro ? (
            <img
              className="profile-hero__photo"
              src={p.pessoa.foto_url}
              alt={`Foto oficial de ${nome}`}
              referrerPolicy="no-referrer"
              onError={() => setFotoErro(true)}
            />
          ) : (
            <div className="politico-card__photo-fallback" style={{ width: '100%', height: '100%', borderRadius: 0 }}>
              {nome
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((parte) => parte[0])
                .join('')
                .toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-hero__info">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <PartyBadge sigla={atual?.partido?.sigla ?? eleita?.partido?.sigla} showName />
            <span className="chip" style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)', borderColor: 'var(--status-success-border)' }}>
              {atual ? (atual.condicao === 'suplente_exercicio' ? 'Suplente em Exercício' : rotuloSituacao(atual.situacao)) : 'Candidatura Registrada'}
            </span>
            {mesaDiretora && <span className="fonte-badge">{mesaDiretora}</span>}
            {numeroUrna && <span className="fonte-badge">Nº Urna: {numeroUrna}</span>}
            {camaraId && <span className="fonte-badge">ID Câmara: {camaraId}</span>}
            {alespId && <span className="fonte-badge">ID ALESP: {alespId}</span>}
          </div>

          <h1 className="profile-hero__name">{nome}</h1>
          {p.pessoa.nome_civil && (
            <div className="profile-hero__civil">
              Nome civil registrado: <strong>{p.pessoa.nome_civil}</strong>
              {profissao && <span> · Ocupação: <strong>{profissao}</strong></span>}
              {escolaridade && <span> · Escolaridade: <strong>{escolaridade}</strong></span>}
            </div>
          )}

          <dl className="profile-facts-grid">
            <div className="fact-item">
              <dt>Cargo</dt>
              <dd>{atual?.cargo?.nome ?? eleita?.cargo?.nome ?? 'Representante'}</dd>
            </div>
            <div className="fact-item">
              <dt>Município / Circunscrição</dt>
              <dd>{atual?.localidade?.nome ?? 'Guarulhos (SP)'}</dd>
            </div>
            <div className="fact-item">
              <dt>Votos na Eleição 2024</dt>
              <dd>
                {eleita?.votos != null && eleita.votos > 0 ? `${eleita.votos.toLocaleString('pt-BR')} votos` : 'Eleito(a)'}
                {eleita && <FonteRef id={eleita.fonte_id} />}
              </dd>
            </div>
            <div className="fact-item">
              <dt>Início do Mandato</dt>
              <dd>{atual?.inicio ? formatarData(atual.inicio) : '01/01/2025'}</dd>
            </div>
          </dl>

          {/* Dados Oficiais do Gabinete Municipal ou Federal */}
          {(gabinete || emailGabinete || camaraGruUrl) && (
            <div style={{ marginTop: '14px', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.84rem', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              {gabinete && (
                <div>Gabinete: <strong>{gabinete.predio ? `Anexo ${gabinete.predio}, Sala ${gabinete.sala}` : gabinete.nome}</strong></div>
              )}
              {gabinete?.telefone && <div>Tel: <strong>{gabinete.telefone}</strong></div>}
              {(gabinete?.email || emailGabinete) && (
                <div>E-mail: <a href={`mailto:${gabinete?.email ?? emailGabinete}`} style={{ fontWeight: 700, color: 'var(--text-main)' }}>{gabinete?.email ?? emailGabinete}</a></div>
              )}
              {camaraGruUrl && (
                <a href={camaraGruUrl} target="_blank" rel="noreferrer noopener" style={{ fontWeight: 700, color: 'var(--text-main)', textDecoration: 'underline', marginLeft: 'auto' }}>
                  {atual?.cargo?.codigo === 'prefeito' || atual?.cargo?.codigo === 'vice_prefeito'
                    ? 'Portal oficial da Prefeitura de Guarulhos ↗'
                    : 'Página oficial na Câmara de Guarulhos ↗'}
                </a>
              )}
            </div>
          )}

          {/* Redes Sociais Oficiais */}
          {detalheCamara?.redeSocial && detalheCamara.redeSocial.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {detalheCamara.redeSocial.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="fonte-badge"
                  style={{ textDecoration: 'none' }}
                >
                  {url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Navegação por Abas com Scroll Touch */}
      <div className="profile-tabs" role="tablist" aria-label="Seções do perfil">
        {tabsDisponiveis.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`profile-tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="profile-tab__icon">{t.icone}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <section role="tabpanel" style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div className="cargo-helper" style={{ marginBottom: '20px', padding: '12px 16px' }}>
          <div className="cargo-helper__content">
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {tabsDisponiveis.find((t) => t.id === tab)?.label && <strong>{tabsDisponiveis.find((t) => t.id === tab)?.label}: </strong>}
              {AJUDA[tab]}
            </p>
          </div>
        </div>

        {tab === 'geral' && (
          <MetricasGeral
            perfil={p}
            onIrParaPropostas={
              tabsDisponiveis.some((t) => t.id === 'propostas')
                ? () => setTab('propostas')
                : undefined
            }
          />
        )}
        {tab === 'votacoes' && <VotacoesAba cargoCodigo={atual?.cargo?.codigo} />}
        {tab === 'propostas' && <PropostasAba pessoaId={p.pessoa.id} camaraId={camaraId} />}
        {tab === 'presenca' && <PresencaAba perfil={p} />}
        {tab === 'comissoes' && <ComissoesAba pessoaId={p.pessoa.id} camaraId={camaraId} comissoesLocais={comissoesLocais} />}
        {tab === 'frentes' && <FrentesAba camaraId={camaraId} />}
        {tab === 'discursos' && <DiscursosAba camaraId={camaraId} />}
        {tab === 'historico' && <Timeline perfil={p} />}
        {tab === 'mandato' && (
          p.mandatos.length === 0 ? (
            <EmptyState title="Sem mandatos cadastrados" />
          ) : (
            <ul className="data-rows">
              {p.mandatos.map((m) => (
                <li key={m.id} className="data-row">
                  <div className="data-row__main">
                    <div className="data-row__title">{m.cargo?.nome} — {m.localidade?.nome}</div>
                    <div className="muted small">
                      {m.orgao?.nome ?? 'Órgão oficial'} · {formatarData(m.inicio)} a {m.fim ? formatarData(m.fim) : 'atual'}
                    </div>
                  </div>
                  <div className="data-row__side">
                    <span className="chip">{rotuloSituacao(m.situacao)}</span>
                    {m.partido && <PartyBadge sigla={m.partido.sigla} />}
                    <FonteRef id={m.fonte_id} />
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
        {tab === 'fontes' && <FontesAba perfil={p} camaraId={camaraId} alespId={alespId} camaraGruUrl={camaraGruUrl} tseUrl={tseUrl} />}
      </section>
    </>
  );
}
