/**
 * ============================================================================
 * ROTEADOR PRINCIPAL COM CODE-SPLITTING POR ROTA (REACT.LAZY + SUSPENSE)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * Cada página é carregada sob demanda, reduzindo drasticamente o consumo de
 * dados móveis e a latência inicial. A Home abre imediata e as demais rotas
 * entram com esqueleto editorial suave.
 * ============================================================================
 */

import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { PublicLayout } from './layout/PublicLayout';
import { HomePage } from './pages/HomePage';
import { SECOES } from './navigation';

const FinancasPage = lazy(() =>
  import('./pages/FinancasPage').then((m) => ({ default: m.FinancasPage }))
);
const DespesasPage = lazy(() =>
  import('./pages/DespesasPage').then((m) => ({ default: m.DespesasPage }))
);
const CredorDetalhePage = lazy(() =>
  import('./pages/CredorDetalhePage').then((m) => ({ default: m.CredorDetalhePage }))
);
const DecretosAuditoriaPage = lazy(() =>
  import('./pages/DecretosAuditoriaPage').then((m) => ({ default: m.DecretosAuditoriaPage }))
);
const PoliticosPage = lazy(() =>
  import('./pages/PoliticosPage').then((m) => ({ default: m.PoliticosPage }))
);
const PerfilPage = lazy(() =>
  import('./pages/PerfilPage').then((m) => ({ default: m.PerfilPage }))
);
const SecaoPage = lazy(() =>
  import('./pages/SecaoPage').then((m) => ({ default: m.SecaoPage }))
);
const PoliticaPrivacidadePage = lazy(() =>
  import('./pages/PoliticaPrivacidadePage').then((m) => ({ default: m.PoliticaPrivacidadePage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function PaginaEsqueleto() {
  return (
    <div className="fg-page-skeleton" aria-label="Carregando página" aria-busy="true">
      <div className="fg-skeleton" style={{ height: 156, borderRadius: 18, marginBottom: 18 }} />
      <div className="fg-grid-2">
        <div className="fg-skeleton" style={{ height: 220, borderRadius: 14 }} />
        <div className="fg-skeleton" style={{ height: 220, borderRadius: 14 }} />
      </div>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />

        <Route
          path="financas"
          element={
            <Suspense fallback={<PaginaEsqueleto />}>
              <FinancasPage />
            </Suspense>
          }
        />

        <Route
          path="despesas"
          element={
            <Suspense fallback={<PaginaEsqueleto />}>
              <DespesasPage />
            </Suspense>
          }
        />
        <Route
          path="despesas/credor/:chave"
          element={
            <Suspense fallback={<PaginaEsqueleto />}>
              <CredorDetalhePage />
            </Suspense>
          }
        />

        <Route
          path="decretos"
          element={
            <Suspense fallback={<PaginaEsqueleto />}>
              <DecretosAuditoriaPage />
            </Suspense>
          }
        />
        <Route path="auditoria" element={<Navigate to="/decretos" replace />} />

        <Route
          path="politicos"
          element={
            <Suspense fallback={<PaginaEsqueleto />}>
              <PoliticosPage />
            </Suspense>
          }
        />
        <Route
          path="politicos/:id"
          element={
            <Suspense fallback={<PaginaEsqueleto />}>
              <PerfilPage />
            </Suspense>
          }
        />

        <Route
          path="privacidade"
          element={
            <Suspense fallback={<PaginaEsqueleto />}>
              <PoliticaPrivacidadePage />
            </Suspense>
          }
        />

        <Route path="guarulhos/orcamento" element={<Navigate to="/despesas" replace />} />
        <Route path="mapa" element={<Navigate to="/" replace />} />

        {SECOES.filter(
          (s) =>
            s.path !== '' &&
            s.path !== 'mapa' &&
            s.path !== 'despesas' &&
            s.path !== 'decretos' &&
            s.path !== 'politicos' &&
            s.path !== 'financas' &&
            s.path !== 'privacidade'
        ).map((s) => (
          <Route
            key={s.path}
            path={s.path}
            element={
              <Suspense fallback={<PaginaEsqueleto />}>
                <SecaoPage secao={s} />
              </Suspense>
            }
          />
        ))}

        <Route
          path="*"
          element={
            <Suspense fallback={<PaginaEsqueleto />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
