import { obterInfoPartido } from '@/domain/partidos';

export function PartyBadge({ sigla, showName = false }: { sigla: string | null | undefined; showName?: boolean }) {
  const info = obterInfoPartido(sigla);
  if (!sigla) return null;

  return (
    <span
      className="party-badge"
      title={info.nomeCompleto}
      style={{
        backgroundColor: info.corPrimaria,
        color: info.corTexto,
        borderColor: info.corBorda,
      }}
    >
      <span className="party-badge__flag" aria-hidden>{info.emojiBandeira}</span>
      <span className="party-badge__sigla">{info.sigla}</span>
      {showName && <span className="party-badge__fullname">· {info.nomeCompleto}</span>}
    </span>
  );
}
