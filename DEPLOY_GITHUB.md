# Box 73 - Guia de Deploy no GitHub Pages

Este guia vai te ajudar a colocar seu sistema online gratuitamente usando o GitHub Pages.

## Passo 1: Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login (crie uma conta se não tiver).
2. Clique no botão **New** (ou Novo) no canto superior esquerdo, ou acesse [github.com/new](https://github.com/new).
3. Em **Repository name**, digite: `box73-indicacao` (ou outro nome que preferir).
4. Deixe como **Public**.
5. **NÃO** marque as opções "Add a README file", ".gitignore" ou "License".
6. Clique em **Create repository**.

## Passo 2: Enviar o Código

Agora vamos conectar seu código local com o GitHub.
Abra seu terminal na pasta do projeto e execute os comandos abaixo (copie e cole um por um):

> **Nota:** Substitua `SEU_USUARIO` pelo seu nome de usuário no GitHub.

```bash
git remote add origin https://github.com/SEU_USUARIO/box73-indicacao.git
git branch -M main
git push -u origin main
```

## Passo 3: Ativar o GitHub Pages

1. No seu repositório no GitHub, clique na aba **Settings** (Configurações).
2. No menu lateral esquerdo, clique em **Pages**.
3. Em **Build and deployment** > **Source**, selecione **Deploy from a branch**.
4. Em **Branch**, selecione `main` e a pasta `/ (root)`.
5. Clique em **Save**.

🎉 **Pronto!** Em alguns minutos, seu site estará disponível no link que aparecerá no topo da página (algo como `https://seu-usuario.github.io/box73-indicacao/`).

---

## Dúvidas Comuns

**Quanto custa?**
Nada. O GitHub Pages é gratuito para sempre para repositórios públicos.

**Posso usar meu domínio (ex: indicacao.box73.com.br)?**
Sim! Em **Settings** > **Pages** > **Custom domain**, você pode configurar seu domínio próprio (precisa configurar DNS no seu provedor de domínio).

**Como atualizar o site depois?**
Sempre que fizer alterações nos arquivos, execute no terminal:
```bash
git add .
git commit -m "Atualizando site"
git push
```
O GitHub Pages atualizará o site automaticamente.
