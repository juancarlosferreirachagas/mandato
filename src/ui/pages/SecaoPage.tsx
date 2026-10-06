import { Link } from 'react-router-dom';
import { EmptyState } from '../components/common';
import type { Secao } from '../navigation';

export function SecaoPage({ secao }: { secao: Secao }) {
  return (
    <>
      <h1 className="page-title">{secao.label}</h1>
      <p className="muted">{secao.descricao}</p>
      <EmptyState title="Listagem em desenvolvimento">
        Esta seção será construída em uma próxima etapa, sobre os dados importados de fontes oficiais.
      </EmptyState>
    </>
  );
}

export function NotFoundPage() {
  return (
    <EmptyState title="Página não encontrada">
      <Link to="/">Voltar ao início</Link>
    </EmptyState>
  );
}
