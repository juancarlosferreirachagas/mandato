import { fonteRepository } from '@/repositories/adminRepositories';
import type { NovaFonte } from '@/domain/types';

export const TIPOS_FONTE = [
  'api_oficial', 'dados_abertos', 'diario_oficial', 'site_oficial',
  'documento_oficial', 'decisao_judicial', 'imprensa', 'declaracao', 'outro',
] as const;

export function validarFonte(f: NovaFonte): string[] {
  const erros: string[] = [];
  if (!f.titulo.trim()) erros.push('Título é obrigatório.');
  if (!f.url && !f.identificador_externo) erros.push('Informe a URL ou um identificador externo para que a fonte seja verificável.');
  if (f.url) {
    try {
      const u = new URL(f.url);
      if (!['http:', 'https:'].includes(u.protocol)) erros.push('URL deve ser http(s).');
    } catch {
      erros.push('URL inválida.');
    }
  }
  return erros;
}

export const fonteService = {
  async cadastrar(f: NovaFonte) {
    const erros = validarFonte(f);
    if (erros.length) throw new Error(erros.join(' '));
    return fonteRepository.create(f);
  },
};
