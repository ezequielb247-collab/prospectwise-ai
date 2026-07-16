# Sprint 6 — Importação Gratuita de Empresas por CSV

## Entregue

- Upload de CSV ou colagem de dados, com limite de 2 MB e 5.000 linhas.
- Reconhecimento de cabeçalhos em português e inglês e mapeamento manual.
- Pré-visualização de linhas válidas, inválidas, duplicadas e campos ausentes.
- Normalização de telefone, URL, nomes, cidades, estados, notas e avaliações.
- Deduplicação por telefone, domínio, nome + cidade, endereço e Google Maps URL.
- Importação transacional vinculada ao usuário e à campanha, com etapa CRM `Novo`, provider `csv_import` e atividade `lead_imported`.
- Modelo em `public/modelo-importacao-leads.csv`.
- Testes de parsing, segurança, isolamento, campanha e persistência.

## Ativação

Execute `supabase/migrations/202607160003_csv_import.sql` no SQL Editor do Supabase depois das migrations anteriores.

## Fora do escopo

- Google Places, Outscraper, OpenAI, WhatsApp e qualquer provedor pago.
