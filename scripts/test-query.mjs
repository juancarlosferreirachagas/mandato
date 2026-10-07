import { createClient } from '@supabase/supabase-js';

const url = 'https://yusuaphkgbytgplfrddf.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3VhcGhrZ2J5dGdwbGZyZGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMTcxNzgsImV4cCI6MjEwNjg5MzE3OH0.NE7GpCZgxWN3rCv5TKCd20MGI5zs900iXygP4q2m2wo';

const supabase = createClient(url, anonKey);

async function test() {
  console.log('Testing query...');
  const { data, error } = await supabase
    .from('mandatos')
    .select(
      'id, situacao, cargo:cargos!inner(codigo,nome), localidade:localidades!inner(sigla), partido:partidos(sigla), pessoa:pessoas(id,nome_civil,nome_politico,foto_url), candidatura:candidaturas(votos)',
    )
    .eq('localidade.sigla', 'SP')
    .limit(5);

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS! Items count:', data?.length);
    console.log('Sample item:', JSON.stringify(data?.[0], null, 2));
  }
}

test();
