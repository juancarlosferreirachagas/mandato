import { useState } from 'react';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export function PoliticaPrivacidadePage() {
  const [abaAtiva, setAbaAtiva] = useState<'lgpd' | 'seguranca' | 'fontes'>('lgpd');

  return (
    <div className="fg-shell" style={{ maxWidth: 980, margin: '0 auto', padding: '16px 12px 64px' }}>
      <header className="fg-hero" style={{ padding: '22px 20px', marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span className="fg-hero__eyebrow">
            <span className="fg-hero__dot" />
            TRANSPARÊNCIA · LGPD · SEGURANÇA · DADOS ABERTOS
          </span>
        </div>
        <h1 className="fg-hero__title" style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.1rem)', margin: '4px 0 10px' }}>
          Segurança, Privacidade &amp; <span>LGPD</span>
        </h1>
        <p className="fg-hero__lead" style={{ maxWidth: 720 }}>
          O <strong>Fiscaliza Guarulhos (fiscalizaguarulhos.vercel.app)</strong> é uma plataforma cívica independente de controle social e acompanhamento das contas públicas municipais, regida pela Lei de Acesso à Informação (Lei 12.527/2011) e pela LGPD (Lei 13.709/2018).
        </p>
      </header>

      {/* Seletor de Abas */}
      <div className="fg-pills" role="tablist" style={{ marginBottom: 18 }}>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'lgpd'}
          className={`fg-pill ${abaAtiva === 'lgpd' ? 'is-active' : ''}`}
          onClick={() => setAbaAtiva('lgpd')}
        >
          <ShieldCheck size={16} />
          <span>LGPD &amp; Dados Pessoais</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'seguranca'}
          className={`fg-pill ${abaAtiva === 'seguranca' ? 'is-active' : ''}`}
          onClick={() => setAbaAtiva('seguranca')}
        >
          <Lock size={16} />
          <span>Arquitetura de Segurança</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'fontes'}
          className={`fg-pill ${abaAtiva === 'fontes' ? 'is-active' : ''}`}
          onClick={() => setAbaAtiva('fontes')}
        >
          <FileText size={16} />
          <span>Bases Legais (LAI &amp; CF/88)</span>
        </button>
      </div>

      {abaAtiva === 'lgpd' && (
        <section className="fg-card" style={{ padding: 22, display: 'grid', gap: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck color="#059669" size={22} />
              1. Tratamento de Dados sob a LGPD (Lei 13.709/2018)
            </h2>
            <p style={{ color: 'var(--text-muted, #475569)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              O Fiscaliza Guarulhos preza pela total privacidade dos cidadãos que navegam em nossa plataforma:
            </p>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#09152b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 color="#059669" size={18} /> Zero Coleta de Dados de Cidadãos / Visitantes
              </div>
              <p style={{ margin: '6px 0 0 26px', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
                Não exigimos cadastro, login, e-mail, telefone, CPF ou qualquer dado pessoal para consulta. A plataforma é 100% aberta, anônima e gratuita para qualquer morador.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#09152b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 color="#059669" size={18} /> Sem Rastreamento Publicitário ou Venda de Dados
              </div>
              <p style={{ margin: '6px 0 0 26px', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
                Não utilizamos cookies invasivos, pixels de rastreamento comercial nem compartilhamos dados com terceiros ou anunciantes. Respeitamos a sua navegação privada.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#09152b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 color="#059669" size={18} /> Dados de Agentes Públicos e Contratados (Art. 7º, §3º da LGPD)
              </div>
              <p style={{ margin: '6px 0 0 26px', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
                Os dados de ocupantes de cargos públicos (Prefeito, Vice, Secretários e Vereadores) e de pessoas jurídicas ou prestadores que celebram contratos remunerados pelo erário municipal são públicos por força constitucional (Art. 37 da CF/88, Lei da Transparência LC 131/2009 e Lei de Acesso à Informação 12.527/2011). O tratamento desses dados atende ao estrito cumprimento de obrigação legal e ao legítimo interesse público do controle social.
              </p>
            </div>
          </div>
        </section>
      )}

      {abaAtiva === 'seguranca' && (
        <section className="fg-card" style={{ padding: 22, display: 'grid', gap: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock color="#0284c7" size={22} />
              2. Arquitetura de Segurança &amp; Integridade Técnica
            </h2>
            <p style={{ color: 'var(--text-muted, #475569)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              A plataforma adota padrões modernos de segurança da informação alinhados às melhores práticas de desenvolvimento web:
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#09152b', marginBottom: 4 }}>
                🔒 Criptografia Ponta a Ponta (HTTPS / TLS)
              </div>
              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                Toda a comunicação entre o seu navegador e nossos servidores é criptografada com certificados TLS modernos e protocolo HTTPS forçado, prevenindo interceptação ou adulteração de tráfego.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#09152b', marginBottom: 4 }}>
                🛡️ Banco de Dados Read-Only para o Público
              </div>
              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                A interface pública acessa o banco de dados exclusivamente através de políticas restritas de leitura (Row-Level Security / RLS), sem permissão de escrita ou injeção de dados via frontend.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#09152b', marginBottom: 4 }}>
                🔎 Integridade Auditável (Fato → Fonte)
              </div>
              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                Nenhum valor financeiro é gerado ou editado manualmente. Todos os registros possuem trilha de auditoria vinculada à prestação de contas do sistema AUDESP do TCE-SP e diários oficiais.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#09152b', marginBottom: 4 }}>
                🌐 Domínio &amp; CDN Distribuída
              </div>
              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                Hospedagem em infraestrutura edge global sob o endereço oficial <code>fiscalizaguarulhos.vercel.app</code> com proteção nativa contra ataques de negação de serviço (DDoS).
              </p>
            </div>
          </div>
        </section>
      )}

      {abaAtiva === 'fontes' && (
        <section className="fg-card" style={{ padding: 22, display: 'grid', gap: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye color="#b45309" size={22} />
              3. Bases Legais e Princípio Editorial Cívico
            </h2>
            <p style={{ color: 'var(--text-muted, #475569)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              A atuação do <strong>Fiscaliza Guarulhos</strong> ampara-se nas garantias fundamentais da República Federativa do Brasil:
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#09152b' }}>Constituição Federal de 1988 (Art. 5º, XXXIII e Art. 37, §3º):</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#475569' }}>
                Garante o direito de todos receberem dos órgãos públicos informações de seu interesse particular, ou de interesse coletivo ou geral, bem como o acesso dos usuários a registros administrativos e a informações sobre atos de governo.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#09152b' }}>Lei de Acesso à Informação — LAI (Lei 12.527/2011):</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#475569' }}>
                Institui a transparência ativa como regra geral e o sigilo como exceção, determinando a publicação de informações sobre a execução orçamentária e financeira dos municípios em dados abertos e acessíveis.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#09152b' }}>Lei da Transparência (Lei Complementar 131/2009):</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#475569' }}>
                Obriga a disponibilização em tempo real de informações pormenorizadas sobre a execução orçamentária e financeira dos órgãos municipais de todo o país.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Contato para Privacidade */}
      <div className="fg-card" style={{ marginTop: 20, padding: 18, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e40af', marginBottom: 4 }}>
          ✉️ Canal de Transparência e Dúvidas sobre Dados
        </h3>
        <p style={{ fontSize: '0.86rem', color: '#1e3a8a', margin: 0, lineHeight: 1.5 }}>
          Se você identificar alguma divergência em relação aos dados oficiais publicados pelos órgãos governamentais (TCE-SP, Câmara de Guarulhos ou TSE) ou tiver qualquer dúvida jurídica/LGPD sobre esta iniciativa cívica sem fins lucrativos, consulte a página oficial de <a href="/fontes" style={{ color: '#1d4ed8', fontWeight: 700 }}>Fontes &amp; Metodologia</a>.
        </p>
      </div>
    </div>
  );
}

