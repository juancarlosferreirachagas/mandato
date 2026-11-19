import { useState } from 'react';
import { Link } from 'react-router-dom';

export interface RegiaoGuarulhos {
  id: string;
  nome: string;
  populacaoAprox: string;
  bairrosPrincipais: string;
  equipamentosPublicos: string;
  focoOrcamento: string;
  alertasComuns: string[];
  cor: string;
  pathD: string;
  labelX: number;
  labelY: number;
  lat: number;
  lng: number;
}

/**
 * As 8 macrorregiões administrativas e urbanas dentro do limite territorial
 * oficial de Guarulhos (IBGE 3518800 — 318,68 km²), desenhadas em SVG vetorial
 * no estilo Politicômetro (.mi-mapa + .mi-lado).
 */
export const REGIOES_GUARULHOS: RegiaoGuarulhos[] = [
  {
    id: 'norte-cabucu',
    nome: 'Cabuçu · Recreio São Jorge · Bananal',
    populacaoAprox: '~138 mil moradores',
    bairrosPrincipais: 'Cabuçu, Recreio São Jorge, Novo Recreio, Parque Mikail, Bananal, Agua Azul',
    equipamentosPublicos: 'UBS Recreio São Jorge, UBS Cabuçu, CEU Rosa de França (região), Reserva da Cantareira',
    focoOrcamento: 'Pavimentação e drenagem de vias, linhas alimentadoras de ônibus e conservação ambiental',
    alertasComuns: ['Pavimentação / Buracos', 'Iluminação pública', 'Frequência de ônibus'],
    cor: '#0284c7',
    pathD: 'M 75,35 L 185,22 L 265,38 L 252,115 L 155,122 L 70,108 Z',
    labelX: 168,
    labelY: 74,
    lat: -23.385,
    lng: -46.515,
  },
  {
    id: 'nordeste-aguas-compridas',
    nome: 'Mato das Cobras · Água Azul · Morro Grande',
    populacaoAprox: '~64 mil moradores',
    bairrosPrincipais: 'Água Azul, Morro Grande, Mato das Cobras, Capelinha, Sadokim',
    equipamentosPublicos: 'UBS Água Azul, Escolas da rede municipal rural/norte, Mananciais do Tanque Grande',
    focoOrcamento: 'Manutenção de estradas vicinais, coleta domiciliar, iluminação LED e unidades de saúde',
    alertasComuns: ['Estradas sem asfalto', 'Descarte irregular de entulho', 'Postes apagados'],
    cor: '#0369a1',
    pathD: 'M 265,38 L 385,32 L 430,95 L 355,135 L 252,115 Z',
    labelX: 340,
    labelY: 84,
    lat: -23.375,
    lng: -46.425,
  },
  {
    id: 'vila-galvao-gopouva',
    nome: 'Vila Galvão · Maia · Gopoúva · Picapau',
    populacaoAprox: '~172 mil moradores',
    bairrosPrincipais: 'Vila Galvão, Jardim Maia, Gopoúva, Picanço, Vila Rosália, Jardim Rosa de França',
    equipamentosPublicos: 'Hospital Municipal de Urgências (HMU), Hospital da Criança (HCA), Lago dos Patos, Bosque Maia',
    focoOrcamento: 'Alta concentração hospitalar (HMU/HCA), corredores viários Timóteo Penteado e recapeamento',
    alertasComuns: ['Tempo de espera em pronto-socorro', 'Semáforos e trânsito', 'Podas de árvores'],
    cor: '#2563eb',
    pathD: 'M 55,108 L 155,122 L 165,205 L 65,212 L 42,158 Z',
    labelX: 108,
    labelY: 164,
    lat: -23.453,
    lng: -46.556,
  },
  {
    id: 'taboao-sao-joao',
    nome: 'Taboão · São João · Fortaleza · Mikail',
    populacaoAprox: '~245 mil moradores',
    bairrosPrincipais: 'Jardim São João, Taboão, Parque Santos Dumont, Jardim Fortaleza, Lavras, Presidente Dutra',
    equipamentosPublicos: 'UPA São João, Terminal São João, Terminal Taboão, CEU Presidente Dutra, UBS Santos Dumont',
    focoOrcamento: 'Rede de urgência (UPA), terminais de integração de ônibus, escolas de ensino fundamental e creches',
    alertasComuns: ['Fila na UBS / UPA', 'Lotação de linhas de ônibus', 'Falta de iluminação'],
    cor: '#0d9488',
    pathD: 'M 155,122 L 252,115 L 355,135 L 330,210 L 165,205 Z',
    labelX: 250,
    labelY: 162,
    lat: -23.422,
    lng: -46.475,
  },
  {
    id: 'aeroporto-cecap',
    nome: 'Aeroporto Internacional (GRU) · CECAP · Várzea',
    populacaoAprox: '~92 mil moradores + polo aeroportuário',
    bairrosPrincipais: 'Parque CECAP, Cumbica Aeroporto, Várzea do Palácio, Morros, Monte Carmelo',
    equipamentosPublicos: 'Hospital Geral de Guarulhos (HGG), Estação CPTM Aeroporto-Guarulhos / CECAP, Parque Adriana',
    focoOrcamento: 'Infraestrutura logística, drenagem do Rio Baquirivu-Guaçu, acessos viários e saúde regional',
    alertasComuns: ['Alagamentos na várzea do Baquirivu', 'Sinalização viária', 'Zeladoria de praças'],
    cor: '#4f46e5',
    pathD: 'M 165,205 L 330,210 L 315,282 L 178,285 Z',
    labelX: 248,
    labelY: 246,
    lat: -23.445,
    lng: -46.485,
  },
  {
    id: 'centro-vila-augusta',
    nome: 'Centro · Vila Augusta · Macedo · Cocaia',
    populacaoAprox: '~198 mil moradores',
    bairrosPrincipais: 'Centro, Vila Augusta, Macedo, Paraventi, Jardim Adriana, Vila Rio de Janeiro, Cocaia',
    equipamentosPublicos: 'Paço Municipal, Câmara Municipal de Guarulhos, Poli Centro, Adamastor, Parque Fracalanza',
    focoOrcamento: 'Sede administrativa da Prefeitura e Câmara, comércio central, corredores de ônibus e zeladoria intensa',
    alertasComuns: ['Calçadas e acessibilidade', 'Buracos em vias de ônibus', 'Iluminação no comércio'],
    cor: '#f59e0b',
    pathD: 'M 65,212 L 165,205 L 178,285 L 92,302 L 48,262 Z',
    labelX: 118,
    labelY: 254,
    lat: -23.468,
    lng: -46.532,
  },
  {
    id: 'cumbica-bonsucesso',
    nome: 'Cumbica · Bonsucesso · Ponte Alta',
    populacaoAprox: '~232 mil moradores',
    bairrosPrincipais: 'Cumbica, Jardim Cumbica, Bonsucesso, Vila Carmela, Ponte Alta, Anita Garibaldi, Inocoop',
    equipamentosPublicos: 'UPA Cumbica, Policlínica Dona Luiza, CEU Bonsucesso, CEU Ponte Alta, Polo Industrial de Cumbica',
    focoOrcamento: 'Segundo maior polo industrial e populacional: creches conveniadas, UPA 24h, recapeamento de vias pesadas',
    alertasComuns: ['Asfalto danificado por caminhões', 'Coleta de lixo e entulho', 'Consultas e exames na UBS'],
    cor: '#059669',
    pathD: 'M 355,135 L 430,95 L 468,175 L 445,255 L 315,282 L 330,210 Z',
    labelX: 392,
    labelY: 196,
    lat: -23.438,
    lng: -46.418,
  },
  {
    id: 'pimentas-cocaia',
    nome: 'Pimentas · Jardim Angélica · Marcos Freire',
    populacaoAprox: '~250 mil moradores (maior distrito)',
    bairrosPrincipais: 'Pimentas, Parque Jurema, Jardim Angélica, Conjunto Marcos Freire, Jardim Arapongas, Tupinambá',
    equipamentosPublicos: 'Hospital Municipal Pimentas-Bonsucesso (HMPB), Terminal Pimentas, CEU Pimentas, UNIFESP Guarulhos',
    focoOrcamento: 'Região mais populosa: Hospital Pimentas-Bonsucesso, obras contra enchentes, escolas e transporte',
    alertasComuns: ['Fila e atendimento no Hospital Pimentas', 'Buracos e drenagem', 'Ônibus lotados nos horários de pico'],
    cor: '#dc2626',
    pathD: 'M 178,285 L 315,282 L 445,255 L 455,325 L 335,348 L 195,335 Z',
    labelX: 318,
    labelY: 312,
    lat: -23.455,
    lng: -46.408,
  },
];

export function GuarulhosSvgMap() {
  const [selecionadaId, setSelecionadaId] = useState<string>('centro-vila-augusta');
  const regiao = REGIOES_GUARULHOS.find((r) => r.id === selecionadaId) ?? REGIOES_GUARULHOS[0];

  return (
    <div className="pm-mi">
      <div className="pm-mi__head">
        <div>
          <span className="pm-eyebrow">🗺️ MAPA VETORIAL DE GUARULHOS · IBGE 3518800</span>
          <h3 className="pm-mi__title">
            Toque em uma macrorregião de Guarulhos para ver o que pesa no bolso e no dia a dia do bairro
          </h3>
        </div>
        <Link to="/financas" className="pm-btn-action" style={{ background: '#0284c7', color: '#ffffff', padding: '8px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 800, fontSize: '0.82rem' }}>
          📈 Ver Finanças &amp; Gastos por Região →
        </Link>
      </div>

      {/* Pílulas de acesso rápido às 8 macrorregiões */}
      <div className="pm-roleta" role="tablist" aria-label="Macrorregiões de Guarulhos">
        {REGIOES_GUARULHOS.map((r) => {
          const ativa = r.id === selecionadaId;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => setSelecionadaId(r.id)}
              className={`pm-roleta__pill ${ativa ? 'is-active' : ''}`}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: r.cor,
                  display: 'inline-block',
                }}
              />
              <span>{r.nome.split('·')[0].trim()}</span>
            </button>
          );
        })}
      </div>

      <div className="pm-mi__stage">
        {/* Quadro do Mapa Vetorial SVG (Politicômetro .mi-quadro) */}
        <div className="pm-mi__quadro">
          <div className="pm-mi__badge-top">
            <span>Município de Guarulhos · SP</span>
            <strong>318,68 km² · 1.291.771 hab.</strong>
          </div>

          <svg
            viewBox="0 0 510 375"
            className="pm-mi__svg"
            role="img"
            aria-label="Mapa dividido nas 8 macrorregiões administrativas de Guarulhos"
          >
            <defs>
              <filter id="gru-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#09152b" floodOpacity="0.18" />
              </filter>
            </defs>

            {/* Contorno externo suave */}
            <g filter="url(#gru-shadow)">
              {REGIOES_GUARULHOS.map((r) => {
                const ativa = r.id === selecionadaId;
                return (
                  <g
                    key={r.id}
                    onClick={() => setSelecionadaId(r.id)}
                    style={{ cursor: 'pointer' }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Selecionar região ${r.nome}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelecionadaId(r.id);
                      }
                    }}
                  >
                    <path
                      d={r.pathD}
                      fill={ativa ? r.cor : '#cbd5e1'}
                      fillOpacity={ativa ? 0.92 : 0.55}
                      stroke={ativa ? '#09152b' : '#ffffff'}
                      strokeWidth={ativa ? 3 : 2}
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    <text
                      x={r.labelX}
                      y={r.labelY}
                      textAnchor="middle"
                      fill={ativa ? '#ffffff' : '#0f172a'}
                      fontSize={ativa ? '11.5' : '10'}
                      fontWeight={ativa ? '800' : '700'}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {r.nome.split('·')[0].trim()}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Rodovias de referência para localização fácil pelo morador */}
            <path
              d="M 48,265 Q 230,248 455,215"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            <text x="245" y="236" fontSize="9" fontWeight="800" fill="#92400e" textAnchor="middle">
              Rod. Presidente Dutra (BR-116)
            </text>
          </svg>

          <div className="pm-mi__legend">
            <span>💡 Toque em qualquer região do mapa acima para inspecionar</span>
            <span>Fonte: Malha IBGE 3518800 · PDU Guarulhos</span>
          </div>
        </div>

        {/* Painel Lateral da Região Selecionada (Politicômetro .mi-lado) */}
        <div className="pm-mi__lado">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <span
                className="fg-badge"
                style={{
                  background: regiao.cor,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                }}
              >
                📍 MACRORREGIÃO SELECIONADA
              </span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--pm-text, #09152b)', marginTop: 6 }}>
                {regiao.nome}
              </h4>
            </div>
            <span
              style={{
                background: 'rgba(2, 132, 199, 0.1)',
                color: '#0284c7',
                fontWeight: 800,
                fontSize: '0.76rem',
                padding: '4px 9px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              {regiao.populacaoAprox}
            </span>
          </div>

          <div className="pm-mi__info-grid">
            <div className="pm-mi__info-box">
              <div className="pm-mi__info-lbl">🏘️ Bairros que compõem a região</div>
              <div className="pm-mi__info-val">{regiao.bairrosPrincipais}</div>
            </div>

            <div className="pm-mi__info-box">
              <div className="pm-mi__info-lbl">🏥 Principais equipamentos públicos</div>
              <div className="pm-mi__info-val">{regiao.equipamentosPublicos}</div>
            </div>

            <div className="pm-mi__info-box">
              <div className="pm-mi__info-lbl">💰 Onde o orçamento municipal atua aqui</div>
              <div className="pm-mi__info-val">{regiao.focoOrcamento}</div>
            </div>

            <div className="pm-mi__info-box">
              <div className="pm-mi__info-lbl">⚠️ Principais demandas dos moradores</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {regiao.alertasComuns.map((alerta) => (
                  <span
                    key={alerta}
                    style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 999,
                    }}
                  >
                    • {alerta}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <Link
              to="/despesas"
              style={{
                flex: '1 1 180px',
                textAlign: 'center',
                background: '#f59e0b',
                color: '#09152b',
                fontWeight: 800,
                fontSize: '0.82rem',
                padding: '9px 12px',
                borderRadius: 9,
                textDecoration: 'none',
              }}
            >
              💰 Ver fornecedores pagos
            </Link>
            <Link
              to="/politicos"
              style={{
                flex: '1 1 160px',
                textAlign: 'center',
                background: '#09152b',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                padding: '9px 12px',
                borderRadius: 9,
                textDecoration: 'none',
              }}
            >
              🏛️ Cobrar Vereadores →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

