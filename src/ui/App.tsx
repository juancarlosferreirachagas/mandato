/**
 * ============================================================================
 * ROTEADOR PRINCIPAL DA APLICAÇÃO (REACT ROUTER v6)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 *
 * Mapeia todas as rotas públicas de auditoria cidadã sob o layout institucional
 * `PublicLayout`, incluindo redirecionamentos de compatibilidade retroativa.
 * ============================================================================
 */

import { Route, Routes, Navigate } from 'react-router-dom';
import { PublicLayout } from './layout/PublicLayout';
import { HomePage } from './pages/HomePage';
import { DespesasPage } from './pages/DespesasPage';
import { CredorDetalhePage } from './pages/CredorDetalhePage';
import { DecretosAuditoriaPage } from './pages/DecretosAuditoriaPage';
import { PerfilPage } from './pages/PerfilPage';
import { SecaoPage } from './pages/SecaoPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SECOES } from './navigation';
import { PoliticosPage } from './pages/PoliticosPage';
import { FinancasPage } from './pages/FinancasPage';
import { PoliticaPrivacidadePage } from './pages/PoliticaPrivacidadePage';

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        {/* Página Inicial — Painel Executivo de Auditoria Municipal */}
        <Route index element={<HomePage />} />

        {/* Balanço Orçamentário: Receitas Arrecadadas x Despesas Pagas */}
        <Route path="financas" element={<FinancasPage />} />

        {/* Ranking Paginado de Fornecedores e Dossiê Individual de Credores */}
        <Route path="despesas" element={<DespesasPage />} />
        <Route path="despesas/credor/:chave" element={<CredorDetalhePage />} />

        {/* Auditoria de Decretos Orçamentários (De Onde Saiu -> Para Onde Foi) & Diários Extraídos */}
        <Route path="decretos" element={<DecretosAuditoriaPage />} />
        <Route path="auditoria" element={<Navigate to="/decretos" replace />} />

        {/* Crachá Cívico: Prefeito, Vice e 34 Vereadores da 19ª Legislatura */}
        <Route path="politicos" element={<PoliticosPage />} />
        <Route path="politicos/:id" element={<PerfilPage />} />

        {/* Conformidade Legal, Segurança e LGPD */}
        <Route path="privacidade" element={<PoliticaPrivacidadePage />} />

        {/* Redirecionamentos amigáveis de rotas legadas */}
        <Route path="guarulhos/orcamento" element={<Navigate to="/despesas" replace />} />
        <Route path="mapa" element={<Navigate to="/" replace />} />

        {/* Central de Fontes Validadas em Tempo Real (/fontes) */}
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
          <Route key={s.path} path={s.path} element={<SecaoPage secao={s} />} />
        ))}

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
