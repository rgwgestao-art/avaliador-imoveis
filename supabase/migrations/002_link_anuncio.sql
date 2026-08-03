-- Rode este script no SQL Editor do seu projeto Supabase (o schema.sql já foi
-- executado antes, então só precisamos adicionar a coluna nova).
alter table imoveis add column if not exists link_anuncio text;
