import { Link } from 'react-router-dom';

const ITENS = [
  { to: '/admin/fontes', t: 'Fontes', d: 'Cadastrar e consultar fontes. Pré-requisito de qualquer importação.' },
  { to: '/admin/importacoes', t: 'Importações', d: 'Enviar lotes para staging (pessoas, partidos, candidaturas, mandatos).' },
  { to: '/admin/auditoria', t: 'Auditoria', d: 'Histórico de alterações: quem, quando, antes e depois.' },
];

export function AdminHome() {
  return (
    <>
      <h1 className="page-title">Administração</h1>
      <div className="uf__grid">
        {ITENS.map((i) => (
          <Link key={i.to} to={i.to} className="card card--link"><h3>{i.t}</h3><p className="muted">{i.d}</p></Link>
        ))}
      </div>
      <p className="muted small">Cadastro de propostas/votações e revisão de lotes entram nas próximas etapas.</p>
    </>
  );
}
