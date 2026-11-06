# Gestão de Adegas

Aplicação PWA para inventário pessoal de vinhos.

## Stack
- Front-end: React + TypeScript + Vite
- Autenticação e dados: Supabase Auth / PostgreSQL
- API auxiliar: Node.js + Express (estrutura inicial)
- Deploy: Docker + EasyPanel

## Etapa 03
- Login, criação de conta, recuperação e atualização de senha.
- Gestão pessoal de adegas (criar, listar, editar e excluir adegas vazias).
- Perfil do proprietário.
- Acesso aos dados protegido por RLS no Supabase.

## Configuração local
Crie `frontend/.env` a partir de `frontend/.env.example` e preencha:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (Publishable key ou anon legada)

Nunca use `service_role` ou secret key no navegador.

```bash
cd frontend
npm install
npm run dev
```

## Build Docker / EasyPanel
Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na seção Environment do serviço EasyPanel. O container gera `runtime-config.js` ao iniciar, lendo essas variáveis em tempo de execução; não é necessário passá-las como argumentos de build. Internal port: `80`. São valores públicos destinados ao cliente; a segurança dos dados depende das políticas RLS.

## Estado
Etapa 03 — primeira integração com Supabase. O cadastro de vinhos, lotes, scanner e movimentações será desenvolvido nas próximas etapas.
