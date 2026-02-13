# 🚀 Guia de Deploy - Box 73 Sistema de Indicação

## Melhorias Implementadas

### ✅ Backend
- **Validação robusta de CPF**: Decorator `@IsCpf()` para validação automática em DTOs
- **Exception Filter Global**: Tratamento consistente de erros com logging
- **Auditoria Automática**: Interceptor que registra todas operações de escrita
- **Graceful Shutdown**: Permite finalização limpa da aplicação
- **Recuperação de erro**: Retry logic e degradação graceful

### ✅ Infraestrutura
- **Docker Compose Produção**: Configuração otimizada com healthchecks
- **Dockerfiles Multi-stage**: Build otimizado e imagens menores
- **Nginx**: Servidor web otimizado comgzip, cache e proxy
- **Limites de recursos**: CPU e memória controlados por container
- **Health checks**: Monitoramento automático de saúde dos serviços

---

## 📦 Deploy com Docker (Recomendado)

### 1. Preparar Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.production.example .env.production

# Editar variáveis (IMPORTANTE!)
nano .env.production
```

**Variáveis obrigatórias para alterar:**
```env
DB_PASSWORD=SUA_SENHA_FORTE_AQUI_MIN_16_CHARS
JWT_SECRET=SUA_CHAVE_SECRETA_MIN_32_CHARS_RANDOM
ALLOWED_ORIGINS=https://seudominio.com
VITE_API_URL=https://api.seudominio.com
```

### 2. Build e Deploy

```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Subir aplicação
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

### 3. Migrar Banco de Dados

```bash
# Aplicar migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# (Primeira vez) Criar seed inicial
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

### 4. Verificar Saúde

```bash
# Backend
curl http://localhost:3000/api

# Frontend
curl http://localhost:80

# Database
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U box73
```

---

## 🔧 Comandos Úteis

### Backup do Banco

```bash
# Criar backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U box73 box73_indicacao > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
cat backup_20260210_120000.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U box73 box73_indicacao
```

### Logs e Debug

```bash
# Logs do backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Logs do frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Logs do postgres
docker-compose -f docker-compose.prod.yml logs -f postgres

# Todos os logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Manutenção

```bash
# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Parar e remover volumes (CUIDADO!)
docker-compose -f docker-compose.prod.yml down -v

# Ver uso de recursos
docker stats box73-backend-prod box73-frontend-prod box73-db-prod
```

---

## 🌐 Deploy em Cloud Providers

### Railway (Recomendado para MVP)

1. Criar conta em [railway.app](https://railway.app)
2. Conectar repositório GitHub
3. Deploy automático a cada push na branch main
4. Configurar variáveis de ambiente no dashboard

### Render

1. Criar conta em [render.com](https://render.com)
2. Criar PostgreSQL Database
3. Criar dois Web Services: backend e frontend
4. Conectar ao repositório e configurar:
   - Backend: `cd backend && npm install && npm run build && npm run start:prod`
   - Frontend: `cd frontend && npm install && npm run build`

### AWS/DigitalOcean/Linode

1. Criar VM (Ubuntu 22.04 recomendado)
2. Instalar Docker e Docker Compose
3. Clonar repositório
4. Seguir passos de "Deploy com Docker" acima
5. Configurar domínio e SSL (Let's Encrypt)

---

## 🔐 Segurança em Produção

### Checklist Pré-Deploy

- [ ] JWT_SECRET alterado (mínimo 32 caracteres aleatórios)
- [ ] DB_PASSWORD forte (mínimo 16 caracteres)
- [ ] ALLOWED_ORIGINS configurado com domínio real
- [ ] NODE_ENV=production
- [ ] Swagger desabilitado em produção (automático)
- [ ] HTTPS configurado
- [ ] Firewall configurado (apenas portas 80, 443, 22)

### Gerando Secrets Seguros

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# DB_PASSWORD
openssl rand -base64 24
```

---

## 📊 Monitoramento

### Health Checks Implementados

- **Backend**: `GET /api` - retorna 200 se OK
- **Frontend**: `GET /health` - nginx health endpoint
- **Database**: `pg_isready` automático

### Logs de Auditoria

Todas operações de escrita são automaticamente logadas em `audit_logs`:
- Usuário que executou
- Ação realizada (POST/PUT/DELETE)
- Entidade afetada
- IP e User-Agent
- Timestamp

**Ver auditoria:**
```sql
SELECT * FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🔄 Atualizações e Rollback

### Atualizar Aplicação

```bash
# Puxar código novo
git pull origin main

# Rebuild
docker-compose -f docker-compose.prod.yml build

# Reiniciar (zero downtime com health checks)
docker-compose -f docker-compose.prod.yml up -d

# Aplicar migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Rollback

```bash
# Voltar para commit anterior
git checkout HASH_DO_COMMIT_ANTERIOR

# Rebuild e restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

---

## ⚠️ Troubleshooting

### Backend não conecta no banco

```bash
# Verificar se postgres está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Ver logs do postgres
docker-compose -f docker-compose.prod.yml logs postgres

# Testar conexão manual
docker-compose -f docker-compose.prod.yml exec backend npx prisma db pull
```

### Frontend não carrega

```bash
# Verificar build
docker-compose -f docker-compose.prod.yml logs frontend

# Rebuild do frontend
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

### Erro de CORS

Verificar `ALLOWED_ORIGINS` no `.env.production` e reiniciar backend.

---

## 📞 Suporte

Para problemas de deploy, verificar:
1. Logs: `docker-compose logs -f`
2. Status: `docker-compose ps`
3. Resources: `docker stats`
4. Auditoria: Tabela `audit_logs` no banco

---

**Desenvolvido para Box 73 - Oficina de Motos 🏍️**
