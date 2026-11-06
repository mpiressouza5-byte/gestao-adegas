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
O Dockerfile utiliza os argumentos de build `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Informe os dois valores na configuração de build do serviço no EasyPanel. São credenciais públicas destinadas ao cliente; a segurança dos dados depende das políticas RLS.

## Estado
Etapa 03 — primeira integração com Supabase. O cadastro de vinhos, lotes, scanner e movimentações será desenvolvido nas próximas etapas.
