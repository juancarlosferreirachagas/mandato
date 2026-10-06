import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from './layout/PublicLayout';
import { HomePage } from './pages/HomePage';
import { PerfilPage } from './pages/PerfilPage';
import { SecaoPage } from './pages/SecaoPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminGuard } from './admin/AdminGuard';
import { AdminLayout } from './admin/AdminLayout';
import { LoginPage } from './admin/LoginPage';
import { AdminHome } from './admin/AdminHome';
import { FontesAdmin } from './admin/FontesAdmin';
import { ImportacoesAdmin } from './admin/ImportacoesAdmin';
import { AuditoriaAdmin } from './admin/AuditoriaAdmin';
import { SECOES } from './navigation';
import { PoliticosPage } from './pages/PoliticosPage';

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="politicos" element={<PoliticosPage />} />
        <Route path="politicos/:id" element={<PerfilPage />} />
        {SECOES.filter((s) => s.path !== 'politicos').map((s) => (
          <Route key={s.path} path={s.path} element={<SecaoPage secao={s} />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="admin/login" element={<LoginPage />} />
      <Route path="admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route index element={<AdminHome />} />
        <Route path="fontes" element={<FontesAdmin />} />
        <Route path="importacoes" element={<ImportacoesAdmin />} />
        <Route path="auditoria" element={<AuditoriaAdmin />} />
      </Route>
    </Routes>
  );
}
