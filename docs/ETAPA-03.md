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

## Variáveis do front-end
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use a Publishable key (`sb_publishable_...`) ou a chave pública legada `anon`. Nunca use `service_role` ou secret key no front-end.

## Configuração de autenticação Supabase
Em Authentication > URL Configuration:
- Site URL: URL pública do app.
- Redirect URLs: incluir a URL pública e, para desenvolvimento local, `http://localhost:5173/**`.

Para recuperação de senha, configure o template de e-mail para apontar para a URL do aplicativo.

## Publicação Docker
O Dockerfile aceita os build arguments `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Como Vite incorpora variáveis `VITE_` durante o build, defina os dois valores na configuração de build do EasyPanel e faça rebuild após alterar.
