# Etapa 03 — Autenticação e gestão de adegas

## Funcionalidades
- Login com e-mail e senha.
- Criação de conta com nome de exibição.
- Recuperação de senha por e-mail.
- Atualização de senha após retorno do link.
- Persistência de sessão.
- Listagem, criação e edição de adegas.
- Exclusão de adegas somente quando não houver lotes vinculados.
- Edição do nome do perfil.

## Variáveis no EasyPanel
Configure no serviço App, seção Environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (recebe a Publishable key `sb_publishable_...` ou a chave pública legada `anon`)

O container gera `/runtime-config.js` ao iniciar, usando as variáveis de ambiente em tempo de execução. Assim, a configuração não depende de variáveis Vite disponíveis durante o build.

Não use `service_role` ou secret key no navegador.

## Configuração de autenticação Supabase
Em Authentication > URL Configuration:
- Site URL: URL pública do app.
- Redirect URLs: incluir a URL pública e, para desenvolvimento local, `http://localhost:5173/**`.

Para recuperação de senha, configure o template de e-mail para apontar para a URL do aplicativo.

## Publicação Docker / EasyPanel
- Build Path: `/`
- Dockerfile Path: `Dockerfile`
- Internal port: `80`
- Configure as duas variáveis na seção Environment do serviço.
- Salve e faça Deploy / Force Rebuild.
- O script `docker/40-runtime-config.sh` é executado pelo entrypoint oficial do Nginx em cada inicialização e escreve a configuração do navegador.
- O Nginx envia `Cache-Control: no-store` para `runtime-config.js` e `index.html`, evitando que o navegador reutilize uma configuração antiga.
