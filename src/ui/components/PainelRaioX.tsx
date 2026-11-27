/**
 * ============================================================================
 * PAINEL DESLIZANTE (SLIDE-OVER NO DESKTOP · BOTTOM SHEET NO MOBILE)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * Permite inspecionar qualquer empresa, decreto, lei ou ato oficial SEM SAIR
 * DA TELA nem perder a posição de rolagem, página ou filtros ativos.
 * Sempre contido dentro da viewport (max-height: 92dvh, overscroll: contain).
 * ============================================================================
 */

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface PainelRaioXProps {
  aberto: boolean;
  onFechar: () => void;
  eyebrow?: string;
  titulo: string;
  subtitulo?: string;
  rodape?: ReactNode;
  children: ReactNode;
}

export function PainelRaioX({
  aberto,
  onFechar,
  eyebrow,
  titulo,
  subtitulo,
  rodape,
  children,
}: PainelRaioXProps) {
  useEffect(() => {
    if (!aberto) return;
    document.body.classList.add('fg-lock');
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.classList.remove('fg-lock');
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto, onFechar]);

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fg-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onFechar}
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
        >
          <motion.aside
            className="fg-sheet-panel"
            initial={{ x: 40, y: 24, opacity: 0.92 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: 32, y: 24, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fg-sheet-handle" aria-hidden>
              <span />
            </div>

            <header className="fg-sheet-head">
              <div style={{ minWidth: 0 }}>
                {eyebrow && <div className="fg-sheet-eyebrow">{eyebrow}</div>}
                <h2 className="fg-sheet-title">{titulo}</h2>
                {subtitulo && <p className="fg-sheet-sub">{subtitulo}</p>}
              </div>
              <button
                type="button"
                className="fg-sheet-close"
                onClick={onFechar}
                aria-label="Fechar painel"
              >
                <X size={18} aria-hidden />
              </button>
            </header>

            <div className="fg-sheet-body">{children}</div>

            {rodape && <footer className="fg-sheet-foot">{rodape}</footer>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
