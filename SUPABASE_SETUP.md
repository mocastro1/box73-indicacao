# Box 73 - Setup do Supabase

Este guia vai te ajudar a configurar o banco de dados Supabase para o sistema de indicações.

## Passo 1: Criar Conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **Start your project** (ou **Sign up**)
3. Faça login com GitHub (recomendado) ou email
4. É **100% gratuito** – não precisa cartão de crédito

## Passo 2: Criar um Novo Projeto

1. No dashboard, clique em **New Project**
2. Preencha:
   - **Name**: `box73-indicacao` (ou outro nome)
   - **Database Password**: Crie uma senha forte e **GUARDE ELA** (vai precisar depois)
   - **Region**: Escolha `South America (São Paulo)` para menor latência
3. Clique em **Create new project**
4. Aguarde 1-2 minutos enquanto o Supabase cria seu banco

## Passo 3: Criar as Tabelas (SQL)

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. **Copie e cole TODO o código abaixo** na janela do editor:

```sql
-- ==========================================
-- Box 73 - Database Schema
-- ==========================================

-- Tabela de Embaixadores
CREATE TABLE embaixadores (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  data_cadastro TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Indicações
CREATE TABLE indicacoes (
  id BIGSERIAL PRIMARY KEY,
  codigo_usado TEXT NOT NULL,
  nome_indicado TEXT,
  telefone_indicado TEXT,
  data_indicacao TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Usado', 'Validado')),
  valor_desconto NUMERIC(5,2) DEFAULT 10.00,
  data_uso TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key para embaixadores
  CONSTRAINT fk_embaixador 
    FOREIGN KEY (codigo_usado) 
    REFERENCES embaixadores(codigo)
    ON DELETE CASCADE
);

-- Tabela de Configurações
CREATE TABLE configuracoes (
  id BIGSERIAL PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor) VALUES
  ('desconto_percentual', '10'),
  ('mensagem_whatsapp', 'Oi! Estou indicando a Box 73 pra você! 🏍️ Use meu cupom {{CODE}} e ganhe {{DISCOUNT}}% de desconto na sua próxima revisão! 🔧');

-- Índices para performance
CREATE INDEX idx_indicacoes_codigo ON indicacoes(codigo_usado);
CREATE INDEX idx_indicacoes_status ON indicacoes(status);
CREATE INDEX idx_embaixadores_email ON embaixadores(email);
CREATE INDEX idx_embaixadores_codigo ON embaixadores(codigo);

-- Row Level Security (RLS) - Segurança
ALTER TABLE embaixadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (qualquer um pode ler/escrever)
-- Em produção, você pode restringir isso!
CREATE POLICY "Permitir todas operações em embaixadores" ON embaixadores
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas operações em indicacoes" ON indicacoes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura em configuracoes" ON configuracoes
  FOR SELECT USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_embaixadores_updated_at BEFORE UPDATE ON embaixadores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicacoes_updated_at BEFORE UPDATE ON indicacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Clique em **RUN** (ou pressione `Ctrl+Enter`)
5. Você deve ver: **Success. No rows returned** ✅

## Passo 4: Pegar as Credenciais (API Keys)

1. No menu lateral, clique em **Project Settings** (ícone de engrenagem)
2. Clique em **API**
3. Você vai ver:
   - **Project URL**: algo como `https://xxxxx.supabase.co`
   - **anon public**: uma chave longa começando com `eyJ...`

4. **Copie esses dois valores!** Você vai precisar deles no próximo passo.

## Passo 5: Configurar o Sistema

Depois de pegar as credenciais, volte aqui e me passe:
- ✅ Project URL
- ✅ anon public key

Eu vou atualizar o código para conectar no Supabase.

---

## Dúvidas Comuns

**É seguro?**
Sim! O Supabase tem Row Level Security (RLS) ativado. As políticas que criamos permitem acesso público, mas você pode restringir depois.

**Quanto custa?**
O plano gratuito inclui:
- 500 MB de banco de dados
- 1 GB de transferência
- 50k requisições/mês

Isso aguenta **milhares de embaixadores** tranquilamente.

**Posso migrar os dados do Google Sheets depois?**
Sim! Você pode exportar do Sheets e importar no Supabase facilmente.

---

## Próximos Passos

✅ Criou o projeto no Supabase?
✅ Rodou o SQL?
✅ Pegou as credenciais?

**Me passe a URL e a Key que eu atualizo o código!** 🚀
