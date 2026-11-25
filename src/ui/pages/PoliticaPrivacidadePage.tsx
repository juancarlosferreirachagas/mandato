import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, FileText, Globe, Lock, Mail, Search, ShieldCheck } from 'lucide-react';
import { PLATAFORMA } from '@/domain/plataforma';

export function PoliticaPrivacidadePage() {
  const [abaAtiva, setAbaAtiva] = useState<'lgpd' | 'seguranca' | 'fontes'>('lgpd');

  return (
    <div className="fg-page-container fg-privacy">
      <header className="fg-hero" style={{ marginBottom: 18 }}>
        <span className="fg-hero__eyebrow" style={{ marginBottom: 8 }}>
          <span className="fg-hero__dot" />
          Transparência · Privacidade · LGPD
        </span>
        <h1 className="fg-hero__title">
          Privacidade e <span>proteção de dados</span>
        </h1>
        <p className="fg-hero__lead">
          O <strong>{PLATAFORMA.nome}</strong> é um projeto independente e sem fins lucrativos para ajudar qualquer
          morador a acompanhar as contas de {PLATAFORMA.municipio}, seguindo a Lei de Acesso à Informação e a LGPD.
        </p>
      </header>

      <div className="fg-pills" role="tablist" style={{ marginBottom: 18 }}>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'lgpd'}
          className={`fg-pill ${abaAtiva === 'lgpd' ? 'is-active' : ''}`}
          onClick={() => setAbaAtiva('lgpd')}
        >
          <ShieldCheck size={16} aria-hidden />
          <span>Seus dados e a LGPD</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'seguranca'}
          className={`fg-pill ${abaAtiva === 'seguranca' ? 'is-active' : ''}`}
          onClick={() => setAbaAtiva('seguranca')}
        >
          <Lock size={16} aria-hidden />
          <span>Segurança do site</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'fontes'}
          className={`fg-pill ${abaAtiva === 'fontes' ? 'is-active' : ''}`}
          onClick={() => setAbaAtiva('fontes')}
        >
          <FileText size={16} aria-hidden />
          <span>O que diz a lei</span>
        </button>
      </div>

      {abaAtiva === 'lgpd' && (
        <section className="fg-card" style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck color="#059669" size={22} aria-hidden />
              <span>1. Como tratamos a sua privacidade (LGPD — Lei 13.709/2018)</span>
            </h2>
            <p className="fg-sub" style={{ fontSize: '0.9rem', marginTop: 6 }}>
              Você pode consultar qualquer informação aqui sem precisar se identificar:
            </p>
          </div>

          <div className="fg-privacy__list">
            <div className="fg-privacy__item">
              <div className="fg-privacy__item-title">
                <CheckCircle2 color="#059669" size={18} aria-hidden />
                <span>Não pedimos cadastro nem dados pessoais</span>
              </div>
              <p>
                Não pedimos login, e-mail, telefone ou CPF para navegar. Toda consulta é aberta, anônima e gratuita.
              </p>
            </div>

            <div className="fg-privacy__item">
              <div className="fg-privacy__item-title">
                <CheckCircle2 color="#059669" size={18} aria-hidden />
                <span>Sem rastreadores nem venda de informações</span>
              </div>
              <p>
                Não usamos cookies de propaganda nem compartilhamos dados de navegação com anunciantes.
              </p>
            </div>

            <div className="fg-privacy__item">
              <div className="fg-privacy__item-title">
                <CheckCircle2 color="#059669" size={18} aria-hidden />
                <span>Dados de agentes públicos e fornecedores (Art. 7º, §3º da LGPD)</span>
              </div>
              <p>
                Informações sobre quem ocupa cargo público (Prefeito, Vice e Vereadores) e empresas contratadas com
                dinheiro público são públicas por lei (Constituição Art. 37, LC 131/2009 e Lei 12.527/2011). Quando há
                pagamento a pessoa física, o CPF é protegido conforme a LGPD.
              </p>
            </div>
          </div>
        </section>
      )}

      {abaAtiva === 'seguranca' && (
        <section className="fg-card" style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock color="#1e5fa8" size={22} aria-hidden />
              <span>2. Como o site protege os dados</span>
            </h2>
            <p className="fg-sub" style={{ fontSize: '0.9rem', marginTop: 6 }}>
              Cuidados aplicados para manter a navegação segura e os números íntegros:
            </p>
          </div>

          <div className="fg-grid-2">
            <div className="fg-privacy__item">
              <div className="fg-privacy__item-title">
                <Lock size={17} color="#1e5fa8" aria-hidden />
                <span>Conexão criptografada (HTTPS)</span>
              </div>
              <p>
                Toda comunicação entre o seu celular ou computador e o servidor usa criptografia HTTPS/TLS.
              </p>
            </div>

            <div className="fg-privacy__item">
              <div className="fg-privacy__item-title">
                <ShieldCheck size={17} color="#059669" aria-hidden />
                <span>Acesso somente para leitura</span>
              </div>
              <p>
                A área pública do site só lê os dados oficiais (regras RLS no banco), sem permissão de alterar nada pela
                interface.
              </p>
            </div>

            <div className="fg-privacy__item">
              <div className="fg-privacy__item-title">
                <Search size={17} color="#1e5fa8" aria-hidden />
                <span>Tudo vem de fonte oficial</span>
              </div>
              <p>
                Nenhum valor financeiro é inventado ou editado à mão. Cada número aponta para o TCE-SP, Diário Oficial,
                Câmara ou TSE.
              </p>
            </div>

            <div className="fg-privacy__item">
              <div className="fg-privacy__item-title">
                <Globe size={17} color="#1e5fa8" aria-hidden />
                <span>Hospedagem protegida</span>
              </div>
              <p>
                O site roda em infraestrutura distribuída em <code>{PLATAFORMA.siteHost}</code>, com proteção contra
                ataques de sobrecarga.
              </p>
            </div>
          </div>
        </section>
      )}

      {abaAtiva === 'fontes' && (
        <section className="fg-card" style={{ display: 'grid', gap: 16 }}>
          <div>
            <h2 className="fg-h2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye color="#b45309" size={22} aria-hidden />
              <span>3. Leis que garantem o seu acesso</span>
            </h2>
            <p className="fg-sub" style={{ fontSize: '0.9rem', marginTop: 6 }}>
              Acompanhar os gastos públicos é um direito garantido pela legislação brasileira:
            </p>
          </div>

          <div className="fg-privacy__list">
            <div className="fg-privacy__item">
              <strong style={{ color: '#09152b' }}>Constituição Federal (Art. 5º, XXXIII e Art. 37, §3º)</strong>
              <p>
                Garante a todo cidadão o direito de receber informações de interesse coletivo dos órgãos públicos.
              </p>
            </div>

            <div className="fg-privacy__item">
              <strong style={{ color: '#09152b' }}>Lei de Acesso à Informação — LAI (Lei 12.527/2011)</strong>
              <p>
                Define que a transparência é a regra geral no poder público e o sigilo é a exceção.
              </p>
            </div>

            <div className="fg-privacy__item">
              <strong style={{ color: '#09152b' }}>Lei da Transparência (Lei Complementar 131/2009)</strong>
              <p>
                Obriga municípios a publicar em tempo real os dados detalhados de arrecadação e pagamentos.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="fg-footer-note">
        <Mail size={18} aria-hidden />
        <span>
          <strong>Encontrou alguma diferença em relação aos portais oficiais?</strong> Confira as fontes originais na
          página de{' '}
          <Link to="/fontes" className="fg-link">
            Fontes
          </Link>
          .
        </span>
      </div>
    </div>
  );
}
