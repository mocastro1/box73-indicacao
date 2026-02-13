# 🏍️ Box 73 - Sistema de Indicação

Sistema completo de gestão de cupons de indicação para a oficina de motos Box 73.

## 🚀 Stack Tecnológica

### Backend
- **NestJS 11** - Framework Node.js escalável
- **PostgreSQL 15** - Banco de dados relacional
- **Prisma ORM** - Type-safe database access
- **JWT** - Autenticação e autorização
- **Swagger** - Documentação automática da API
- **Docker** - Containerização

### Frontend
- **Vue 3** - Framework progressivo
- **Vuetify 3** - Material Design components
- **Tailwind CSS 4** - Utility-first CSS
- **Pinia** - State management
- **TypeScript** - Type safety
- **Vite** - Build tool moderno

---

## ✨ Funcionalidades

### 👨‍💼 Área Administrativa
- ✅ Gestão de usuários (Admin, Gerente, Atendente)
- ✅ Cadastro de embaixadores
- ✅ Criação de mecânicas/campanhas
- ✅ Geração de cupons únicos
- ✅ Validação de cupons com histórico
- ✅ Dashboard com estatísticas
- ✅ Auditoria completa de ações
- ✅ Relatórios e analytics

### 🎯 Área do Cliente/Embaixador
- ✅ Consulta de cupons por CPF
- ✅ Histórico de indicações
- ✅ Progresso de metas
- ✅ Compartilhamento de cupons (WhatsApp, etc.)
- ✅ Visualização de benefícios

### 🔐 Segurança
- ✅ Validação robusta de CPF
- ✅ Autenticação JWT com refresh tokens
- ✅ Máscaras de entrada (CPF, telefone)
- ✅ Proteção contra SQL Injection
- ✅ CORS configurável
- ✅ Logs de auditoria automáticos
- ✅ Exception handling global

---

## 📂 Estrutura do Projeto

```
Box 73 - Indicação/
├── backend/                   # API NestJS
│   ├── prisma/               # Schema e migrations
│   ├── src/
│   │   ├── common/           # Filters, decorators, guards
│   │   ├── modules/          # Módulos de negócio
│   │   └── main.ts
│   └── Dockerfile.prod
├── frontend/                 # App Vue 3
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── views/            # Telas da aplicação
│   │   ├── router/           # Rotas
│   │   ├── stores/           # Estado global (Pinia)
│   │   └── utils/            # Máscaras, validações
│   └── Dockerfile.prod
├── docker-compose.yml        # Docker desenvolvimento
├── docker-compose.prod.yml   # Docker produção
└── DEPLOY.md                 # Guia de deployment
```

---

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Node.js 20+ 
- PostgreSQL 15+
- npm ou yarn

### 1. Clonar Repositório

```bash
git clone <repo-url>
cd "Box 73 - Indicação"
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Ajustar variáveis em .env se necessário

# Rodar migrations
npx prisma migrate dev

# Seed inicial (usuário admin)
npx prisma db seed

# Iniciar servidor
npm run start:dev
```

Backend estará em: **http://localhost:3000**
Swagger docs: **http://localhost:3000/api/docs**

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```

Frontend estará em: **http://localhost:5173**

### 4. Acessar Sistema

**Login padrão (seed):**
- Email: `admin@box73.com`
- Senha: `admin123`

---

## 🐳 Deploy com Docker

### Desenvolvimento

```bash
# Subir banco de dados
docker-compose up -d

# Backend e frontend manualmente (ver seção acima)
```

### Produção

Ver: **[DEPLOY.md](./DEPLOY.md)** para guia completo de produção.

```bash
# Configure .env.production primeiro!
cp .env.production.example .env.production

# Build e deploy
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📊 Database Schema

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Usuários administrativos |
| `embaixadores` | Cadastro de embaixadores |
| `mecanicas` | Campanhas/promoções |
| `cupons` | Cupons únicos por embaixador |
| `indicacoes` | Validações/usos de cupons |
| `audit_logs` | Auditoria de ações |

Ver: `backend/prisma/schema.prisma` para schema completo.

---

## 🔧 Scripts Úteis

### Backend

```bash
npm run start:dev      # Desenvolvimento com watch
npm run build          # Build para produção
npm run start:prod     # Rodar produção
npm run lint           # Lint código
npx prisma studio      # Interface gráfica do banco
npx prisma migrate dev # Criar migration
```

### Frontend

```bash
npm run dev            # Desenvolvimento
npm run build          # Build para produção
npm run preview        # Preview do build
npm run type-check     # Verificar TypeScript
```

---

## 📝 Endpoints Principais da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login |
| GET | `/api/usuarios` | Listar usuários |
| GET | `/api/embaixadores` | Listar embaixadores |
| GET | `/api/mecanicas` | Listar mecânicas |
| GET | `/api/cupons` | Listar cupons |
| POST | `/api/cupons` | Gerar cupom |
| GET | `/api/cupons/code/:codigo` | Buscar cupom |
| POST | `/api/indicacoes` | Validar cupom |
| GET | `/api/indicacoes/historico/:cpf` | Histórico por CPF |

Ver documentação completa no Swagger: `/api/docs`

---

## 🎨 Rotas do Frontend

| Rota | Descrição | Acesso |
|------| ----------|--------|
| `/login` | Login | Público |
| `/dashboard` | Dashboard principal | Autenticado |
| `/embaixadores` | Gestão de embaixadores | Autenticado |
| `/mecanicas` | Campanhas | Autenticado |
| `/cupons` | Gestão de cupons | Autenticado |
| `/validacoes` | Validar cupons | Autenticado |
| `/historico` | Consulta pública por CPF | Público |

---

## 🧪 Testes

```bash
# Backend
cd backend
npm test               # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage

# Frontend
cd frontend
npm run test           # Unit tests (quando implementado)
```

---

## 🛡️ Segurança

### Já Implementado
- ✅ Validação robusta de CPF (backend e frontend)
- ✅ Hash de senhas com bcrypt
- ✅ JWT com expiração
- ✅ CORS configurável
- ✅ Proteção SQL Injection (Prisma)
- ✅ Auditoria de ações
- ✅ Exception handling global

### TODO Pré-Produção
- [ ] Rate limiting (proteção DDoS)
- [ ] HTTPS obrigatório
- [ ] Helmet.js para headers de segurança
- [ ] Rotação de logs/auditoria

---

## 📈 Roadmap

### v2.1 (Próximo)
- [ ] Relatórios PDF/Excel
- [ ] Email notifications
- [ ] Dashboard analytics avançado
- [ ] Soft delete de registros

### v2.2
- [ ] API de webhooks
- [ ] Integração WhatsApp Business
- [ ] Agendamento de campanhas
- [ ] Multi-tenancy

### v3.0
- [ ] Mobile app nativo
- [ ] GraphQL API
- [ ] Internacionalização
- [ ] Machine learning para previsões

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit as mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📞 Suporte

- **Email**: contato@box73.com
- **Instagram**: [@box73br](https://instagram.com/box73br)
- **Documentação**: Ver `/DEPLOY.md` para deployment

---

## 📄 Licença

Propriedade privada - Box 73 Oficina de Motos © 2026

---

**Desenvolvido com ❤️ para Box 73 - Oficina de Motos 🏍️**
