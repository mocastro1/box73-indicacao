# Box 73 - Guia de Configuração do Google Sheets

## 📝 Passo 1: Criar a Planilha

1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha chamada "Box 73 - Sistema de Indicação"
3. Crie 3 abas:

### Aba 1: Embaixadores

Crie as seguintes colunas na linha 1:
```
ID | Nome | Email | Telefone | Codigo | Data_Cadastro
```

### Aba 2: Indicacoes

Crie as seguintes colunas na linha 1:
```
ID | Codigo_Usado | Nome_Indicado | Telefone_Indicado | Data_Indicacao | Status | Valor_Desconto | Data_Uso | Observacoes
```

### Aba 3: Configuracoes

Crie as seguintes colunas e dados:
```
Chave                  | Valor
desconto_percentual    | 10
mensagem_whatsapp      | 🏍️ Oi! Conhece a Box 73?\n\nÉ a melhor oficina de motos que já usei!\n\nUse meu cupom *{{CODE}}* e ganhe {{DISCOUNT}}% de desconto no seu primeiro serviço!\n\n📍 Instagram: @box73br
```

## 🔑 Passo 2: Configurar a API

### 2.1. Acessar Google Cloud Console

1. Vá para [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Nome sugerido: "Box 73 Sistema"

### 2.2. Ativar Google Sheets API

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Pesquise por "Google Sheets API"
3. Clique em **Enable**

### 2.3. Criar API Key

1. No menu lateral, vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **API Key**
3. Copie a API Key gerada
4. (Opcional) Clique em **Restrict Key** e:
   - Em "API restrictions", selecione "Restrict key"
   - Marque apenas "Google Sheets API"
   - Salve

### 2.4. Obter o Spreadsheet ID

1. Abra sua planilha no Google Sheets
2. Na URL, copie o ID entre `/d/` e `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/[ESTE-É-O-ID]/edit
   ```

### 2.5. Configurar Permissões

1. No Google Sheets, clique em **Share**
2. Mude para "Anyone with the link can view"
3. Clique em **Done**

> **Nota de Segurança:** Para produção real, considere usar OAuth 2.0 em vez de API Key pública. Isso evita que qualquer pessoa com acesso ao código possa editar sua planilha.

## ⚙️ Passo 3: Atualizar config.js

Abra o arquivo `config.js` e atualize:

```javascript
const CONFIG = {
    GOOGLE_API_KEY: 'SUA-API-KEY-AQUI',
    SPREADSHEET_ID: 'SEU-SPREADSHEET-ID-AQUI',
    
    // ... resto das configurações
    
    USE_MOCK_DATA: false,  // ⬅️ IMPORTANTE: Mudar para false
};
```

## ✅ Passo 4: Testar

1. Abra o sistema em http://localhost:8000
2. Crie um novo embaixador
3. Verifique se os dados aparecem na aba "Embaixadores" do Google Sheets
4. No painel da oficina, valide o cupom
5. Registre um uso
6. Verifique a aba "Indicacoes" no Google Sheets

## 🚨 Problemas Comuns

### Erro: "Failed to fetch data"
- Verifique se a planilha está com permissão "Anyone with the link"
- Confirme que a API Key está correta
- Verifique se o Spreadsheet ID está correto

### Erro: "API key not valid"
- Verifique se Google Sheets API está ativada no projeto
- Confirme que a API Key não tem restrições que bloqueiem a requisição

### Dados não aparecem na planilha
- Verifique se `USE_MOCK_DATA: false` em config.js
- Abra o Console do navegador (F12) para ver erros
- Verifique se os nomes das abas estão exatamente como "Embaixadores", "Indicacoes", "Configuracoes"

## 🔒 Segurança em Produção

Para um sistema em produção, considere:

1. **Usar OAuth 2.0** em vez de API Key
2. **Backend intermediário** (Node.js, PHP, etc.) para proteger credenciais
3. **Validação de usuários** com autenticação real
4. **Rate limiting** para evitar abuso

Por enquanto, para MVP sem custo, a API Key funciona bem!
