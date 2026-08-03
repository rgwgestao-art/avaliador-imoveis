-- =============================================================================
-- Schema: Avaliador de Imóveis (uso pessoal)
-- Execute este script no SQL Editor do painel do Supabase (projeto novo, tier free)
-- Requer Postgres 15+ (padrão em projetos Supabase atuais) por causa da view
-- com security_invoker no final do arquivo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

create type comodo_tipo_enum as enum ('cozinha', 'banheiro', 'quarto', 'sala', 'varanda');

create type ar_condicionado_enum as enum ('sem_estrutura', 'estrutura_sem_equipamento', 'com_equipamento');
create type armario_status_enum as enum ('planejado_todos', 'planejado_alguns', 'nao_possui');
create type qualidade_bmr_enum as enum ('boa', 'media', 'ruim');
create type piso_tipo_enum as enum ('frio', 'laminado_taco');
create type conservacao_bnr_enum as enum ('bom', 'normal', 'ruim');
create type divisoria_tipo_enum as enum ('drywall', 'alvenaria');
create type teto_acabamento_enum as enum ('sanca_iluminacao', 'comum');
create type tamanho_cozinha_enum as enum ('muito_pequena', 'pequena', 'media', 'grande', 'gigante');
create type tamanho_pmg_enum as enum ('pequena', 'media', 'grande');
create type tipo_chuveiro_enum as enum ('gas', 'eletrico');
create type face_sol_enum as enum ('leste_manha', 'oeste_tarde', 'norte_dia_todo', 'sul_sem_sol');

create type vagas_tipo_enum as enum ('fixas', 'rotativas');
create type beleza_condominio_enum as enum ('bonito', 'normal', 'feio');
create type item_area_comum_enum as enum ('churrasqueira', 'piscina', 'academia', 'salao_festa', 'salao_jogos', 'outro');
create type portaria_tipo_enum as enum ('somente_eletronica', 'eletronica_com_porteiro', 'somente_porteiro');

create type perto_medio_longe_enum as enum ('perto', 'medio', 'longe');
create type seguranca_rua_enum as enum ('segura', 'medio', 'perigoso');
create type qualidade_bairro_enum as enum ('bom', 'medio', 'ruim');

-- -----------------------------------------------------------------------------
-- 2. FUNÇÃO AUXILIAR: atualizar coluna atualizado_em automaticamente
-- -----------------------------------------------------------------------------

create or replace function set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. TABELA imoveis
-- -----------------------------------------------------------------------------

create table imoveis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- Dados gerais
  endereco text,
  metragem numeric(10, 2),
  quartos smallint,
  suites smallint,
  banheiros smallint,
  vagas_garagem smallint,
  idade_predio smallint,
  andar text,
  valor_anuncio numeric(12, 2),
  valor_condominio numeric(12, 2),
  foto_capa_url text,

  -- valor_m2 recalculado automaticamente pelo Postgres a cada insert/update
  valor_m2 numeric(12, 2) generated always as (
    case when metragem is not null and metragem > 0 and valor_anuncio is not null
      then round(valor_anuncio / metragem, 2)
      else null
    end
  ) stored,

  -- Condomínio (1:1 com o imóvel, mantido na própria tabela por simplicidade)
  condominio_vagas_tipo vagas_tipo_enum,
  condominio_vaga_qualidade qualidade_bmr_enum,
  condominio_beleza beleza_condominio_enum,
  condominio_itens_area_comum item_area_comum_enum[],
  condominio_itens_area_comum_outro text,
  condominio_elevador_qualidade conservacao_bnr_enum,
  condominio_portaria_tipo portaria_tipo_enum,
  condominio_fotos text[],
  nota_estrelas_condominio smallint check (nota_estrelas_condominio between 1 and 5),

  -- Bairro / localização
  bairro_distancia_trabalho perto_medio_longe_enum,
  bairro_proximidade_metro perto_medio_longe_enum,
  bairro_seguranca_rua seguranca_rua_enum,
  bairro_qualidade qualidade_bairro_enum,
  nota_estrelas_bairro smallint check (nota_estrelas_bairro between 1 and 5)
);

create trigger trg_imoveis_atualizado_em
  before update on imoveis
  for each row
  execute function set_atualizado_em();

create index idx_imoveis_user_id on imoveis(user_id);

-- -----------------------------------------------------------------------------
-- 4. TABELA comodos_avaliacao (1:N com imoveis)
-- -----------------------------------------------------------------------------

create table comodos_avaliacao (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references imoveis(id) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  tipo_comodo comodo_tipo_enum not null,
  identificador text,

  -- Critérios comuns a todos os cômodos
  ar_condicionado ar_condicionado_enum,
  armario_status armario_status_enum,
  armario_qualidade qualidade_bmr_enum,
  piso_tipo piso_tipo_enum,
  piso_conservacao conservacao_bnr_enum,
  piso_necessita_troca boolean,
  divisoria_tipo divisoria_tipo_enum,
  teto_acabamento teto_acabamento_enum,
  fotos text[],
  nota_estrelas smallint check (nota_estrelas between 1 and 5),

  -- Específicos de Cozinha
  cozinha_tamanho tamanho_cozinha_enum,
  possui_dispensa boolean,
  tamanho_dispensa tamanho_pmg_enum,

  -- Compartilhados entre Cozinha e Banheiro (piso de azulejo)
  piso_azulejo_conservacao conservacao_bnr_enum,
  piso_azulejo_necessita_troca boolean,

  -- Específico de Banheiro
  tipo_chuveiro tipo_chuveiro_enum,

  -- Específico de Sala
  face_sol face_sol_enum,

  -- Específicos de Varanda
  varanda_tamanho tamanho_pmg_enum,
  fechamento_vidro boolean,
  possui_churrasqueira boolean
);

create trigger trg_comodos_atualizado_em
  before update on comodos_avaliacao
  for each row
  execute function set_atualizado_em();

create index idx_comodos_imovel_id on comodos_avaliacao(imovel_id);

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

alter table imoveis enable row level security;
alter table comodos_avaliacao enable row level security;

-- imoveis: o usuário só vê/altera os próprios imóveis
create policy "imoveis_select_own" on imoveis
  for select using (auth.uid() = user_id);

create policy "imoveis_insert_own" on imoveis
  for insert with check (auth.uid() = user_id);

create policy "imoveis_update_own" on imoveis
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "imoveis_delete_own" on imoveis
  for delete using (auth.uid() = user_id);

-- comodos_avaliacao: acesso somente via posse do imóvel pai
create policy "comodos_select_own" on comodos_avaliacao
  for select using (
    exists (select 1 from imoveis i where i.id = comodos_avaliacao.imovel_id and i.user_id = auth.uid())
  );

create policy "comodos_insert_own" on comodos_avaliacao
  for insert with check (
    exists (select 1 from imoveis i where i.id = comodos_avaliacao.imovel_id and i.user_id = auth.uid())
  );

create policy "comodos_update_own" on comodos_avaliacao
  for update using (
    exists (select 1 from imoveis i where i.id = comodos_avaliacao.imovel_id and i.user_id = auth.uid())
  ) with check (
    exists (select 1 from imoveis i where i.id = comodos_avaliacao.imovel_id and i.user_id = auth.uid())
  );

create policy "comodos_delete_own" on comodos_avaliacao
  for delete using (
    exists (select 1 from imoveis i where i.id = comodos_avaliacao.imovel_id and i.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 6. VIEW imoveis_com_nota — calcula nota_geral em tempo real
--
-- nota_geral = média aritmética simples de: nota_estrelas de cada cômodo
-- cadastrado + nota_estrelas_condominio + nota_estrelas_bairro. Blocos sem
-- nota (null) não entram na média. `security_invoker = true` faz a view
-- respeitar a RLS de quem consulta (não da role que criou a view).
-- -----------------------------------------------------------------------------

create view imoveis_com_nota
  with (security_invoker = true)
  as
  select
    i.*,
    round(
      (
        coalesce((select sum(c.nota_estrelas) from comodos_avaliacao c where c.imovel_id = i.id), 0)
        + coalesce(i.nota_estrelas_condominio, 0)
        + coalesce(i.nota_estrelas_bairro, 0)
      )::numeric
      /
      nullif(
        (select count(c.nota_estrelas) from comodos_avaliacao c where c.imovel_id = i.id and c.nota_estrelas is not null)
        + (case when i.nota_estrelas_condominio is not null then 1 else 0 end)
        + (case when i.nota_estrelas_bairro is not null then 1 else 0 end),
        0
      ),
      1
    ) as nota_geral
  from imoveis i;

-- -----------------------------------------------------------------------------
-- 7. STORAGE — bucket privado de fotos, isolado por usuário
--
-- Cada usuário grava em imoveis-fotos/{user_id}/... . Como o bucket é
-- privado, o frontend deve gerar signed URLs (createSignedUrl) para exibir
-- as fotos — não existe leitura pública direta.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('imoveis-fotos', 'imoveis-fotos', false)
on conflict (id) do nothing;

create policy "storage_select_own_folder" on storage.objects
  for select using (
    bucket_id = 'imoveis-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_insert_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'imoveis-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_update_own_folder" on storage.objects
  for update using (
    bucket_id = 'imoveis-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_delete_own_folder" on storage.objects
  for delete using (
    bucket_id = 'imoveis-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
