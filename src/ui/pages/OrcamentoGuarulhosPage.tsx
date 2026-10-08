import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ErrorBox, Loading } from '../components/common';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface DespesaAgrupada {
  credor: string;
  cnpj_credor: string | null;
  total: number;
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function OrcamentoGuarulhosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [gastos, setGastos] = useState<DespesaAgrupada[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Trazemos os pagamentos para agregar no cliente (já que não temos RPC criada ainda para agregação no banco)
        // Como são 11.000 linhas, vamos buscar os maiores pagamentos diretos e agregar
        const { data, error } = await supabase
          .from('despesas_guarulhos')
          .select('credor, cnpj_credor, valor_pago')
          .gt('valor_pago', 0); // ignora estornos na visão agregada de maiores recebedores

        if (error) throw error;

        let total = 0;
        const agrupado = new Map<string, DespesaAgrupada>();

        for (const row of data || []) {
          total += row.valor_pago;
          const key = row.cnpj_credor || row.credor;
          const existente = agrupado.get(key) || { credor: row.credor, cnpj_credor: row.cnpj_credor, total: 0 };
          existente.total += row.valor_pago;
          agrupado.set(key, existente);
        }

        const top100 = Array.from(agrupado.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 100);

        setTotalGeral(total);
        setGastos(top100);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading label="Carregando pagamentos oficiais de Guarulhos..." />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="container py-8 max-w-5xl mx-auto space-y-8 px-4">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
          Dados Oficiais (TCE-SP)
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
          Para onde vai o dinheiro de Guarulhos?
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Veja as empresas e pessoas que mais receberam pagamentos da Prefeitura e Câmara Municipal nos últimos meses, segundo as declarações oficiais entregues ao Tribunal de Contas.
        </p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Pago (Últimos meses)</h2>
          <p className="text-4xl font-black text-slate-900">{brl(totalGeral)}</p>
        </div>
        <div className="text-sm text-slate-500 max-w-xs text-right">
          Valores referentes a pagamentos efetivados ("Valor Pago") registrados no sistema Audesp.
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Maiores Recebedores</h2>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <th className="py-4 px-6 font-semibold">Posição</th>
                  <th className="py-4 px-6 font-semibold">Credor (Quem Recebeu)</th>
                  <th className="py-4 px-6 font-semibold text-right">Valor Total Recebido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {gastos.map((g, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-medium">#{index + 1}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{g.credor}</div>
                      {g.cnpj_credor && (
                        <div className="text-xs text-slate-500 font-mono mt-0.5">CNPJ: {g.cnpj_credor}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900 text-lg">
                      {brl(g.total)}
                    </td>
                  </tr>
                ))}
                {gastos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      Nenhum dado encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="text-sm text-slate-400 text-center pt-8 border-t border-slate-100">
        Dados públicos auditáveis extraídos do Portal da Transparência Municipal (TCE-SP). 
        A plataforma MANDATO atua apenas como agregador e tradutor dos fatos oficiais.
      </footer>
    </div>
  );
}
