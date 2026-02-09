# Box 73 - Sistema de Indicação

Sistema completo de cupons de indicação para a oficina de motos Box 73.

## 🚀 Como Usar (Modo de Teste)

1. Certifique-se de que Python está instalado
2. Abra o terminal nesta pasta
3. Execute: `python -m http.server 8000`
4. Acesse: http://localhost:8000

## 📁 Arquivos

- `index.html` - Interface principal
- `styles.css` - Estilos e design
- `app.js` - Lógica da aplicação
- `config.js` - Configurações (com mock data)
- `config.example.js` - Template de configuração
- `GOOGLE_SHEETS_SETUP.md` - Guia para conectar Google Sheets

## 🎯 Funcionalidades

### Para Embaixadores
- Cadastro/Login
- Cupom único e permanente
- Compartilhamento WhatsApp
- Dashboard de indicações

### Para Oficina
- Validação de cupons
- Registro de uso
- Estatísticas e relatórios

## 🔧 Configurar Google Sheets (Opcional)

Atualmente rodando em **modo de teste** com dados simulados.

Para conectar com Google Sheets real:
1. Siga o guia em `GOOGLE_SHEETS_SETUP.md`
2. Atualize `config.js` com suas credenciais
3. Mude `USE_MOCK_DATA: false`

## 📱 Deploy Online (Gratuito)

### Opção 1: GitHub Pages
1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Ative GitHub Pages nas configurações

### Opção 2: Vercel
1. Instale Vercel CLI: `npm i -g vercel`
2. Execute: `vercel`
3. Siga as instruções

### Opção 3: Netlify
1. Arraste a pasta para [netlify.com/drop](https://app.netlify.com/drop)

## 🎨 Personalização

### Mudar Desconto Padrão
Em `config.js`, altere:
```javascript
DEFAULT_DISCOUNT: 10,  // Altere o valor
```

### Mudar Mensagem do WhatsApp
Em `config.js`, altere:
```javascript
DEFAULT_WHATSAPP_MESSAGE: `Sua mensagem aqui com {{CODE}} e {{DISCOUNT}}`
```

## 📞 Suporte

Instagram: [@box73br](https://www.instagram.com/box73br/)

---

Desenvolvido para Box 73 - Oficina de Motos 🏍️
