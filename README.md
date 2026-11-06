# Gestão de Adegas

Aplicação PWA para inventário pessoal de vinhos. Projeto inicial — Etapa 01.

## Stack
- Front-end: React + TypeScript + Vite
- Back-end: Node.js + Express + TypeScript
- Banco futuro: Supabase PostgreSQL / Auth / Storage
- Deploy: Docker + EasyPanel

## Estrutura
- `frontend/`: aplicação web mobile-first
- `backend/`: API REST inicial
- `database/sql/`: ponto de partida para scripts SQL
- `docker/`: arquivos de containerização

## Desenvolvimento local
Requisitos: Node.js 22 LTS ou superior e npm.

```bash
cd frontend
npm install
npm run dev
```

API:
```bash
cd backend
npm install
npm run dev
```

## Deploy
O `Dockerfile` na raiz compila o front-end e serve os arquivos pelo Nginx. O `docker-compose.yml` pode ser usado como referência de implantação no EasyPanel.

## Variáveis
Copie `.env.example` para `.env` quando iniciar a configuração dos serviços. Não publique segredos no GitHub.

## Estado da Etapa 01
Interface demonstrativa, sem autenticação, persistência ou integração real com Supabase. Os vinhos exibidos são dados fictícios para validar a experiência visual.
