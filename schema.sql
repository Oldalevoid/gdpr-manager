-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.analisi_rischi (
  id text NOT NULL,
  client_id text NOT NULL,
  trattamento_id text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analisi_rischi_pkey PRIMARY KEY (id),
  CONSTRAINT analisi_rischi_trattamento_id_fkey FOREIGN KEY (trattamento_id) REFERENCES public.trattamenti(id)
);
CREATE TABLE public.assets (
  id text NOT NULL,
  client_id text,
  data jsonb NOT NULL,
  CONSTRAINT assets_pkey PRIMARY KEY (id),
  CONSTRAINT assets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.clients (
  id text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.data_breaches (
  id text NOT NULL,
  client_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT data_breaches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.doc_settings (
  id text NOT NULL,
  data jsonb NOT NULL,
  CONSTRAINT doc_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.documents (
  id text NOT NULL,
  client_id text,
  tipo text NOT NULL,
  label text NOT NULL,
  contenuto text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.dpia (
  id text NOT NULL,
  client_id text NOT NULL,
  trattamento_id text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dpia_pkey PRIMARY KEY (id),
  CONSTRAINT dpia_trattamento_id_fkey FOREIGN KEY (trattamento_id) REFERENCES public.trattamenti(id)
);
CREATE TABLE public.lia (
  id text NOT NULL,
  client_id text NOT NULL,
  trattamento_id text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lia_pkey PRIMARY KEY (id),
  CONSTRAINT lia_trattamento_id_fkey FOREIGN KEY (trattamento_id) REFERENCES public.trattamenti(id)
);
CREATE TABLE public.misure_sicurezza (
  id text NOT NULL,
  client_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT misure_sicurezza_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nis2_assets (
  id text NOT NULL,
  client_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nis2_assets_pkey PRIMARY KEY (id),
  CONSTRAINT nis2_assets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.nis2_misure (
  id text NOT NULL,
  client_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nis2_misure_pkey PRIMARY KEY (id),
  CONSTRAINT nis2_misure_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.suppliers (
  id text NOT NULL,
  client_id text,
  data jsonb NOT NULL,
  CONSTRAINT suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT suppliers_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.trattamenti (
  id text NOT NULL,
  client_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT trattamenti_pkey PRIMARY KEY (id)
);CREATE TABLE public.nis2_bia (
  client_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nis2_bia_pkey PRIMARY KEY (client_id),
  CONSTRAINT nis2_bia_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
