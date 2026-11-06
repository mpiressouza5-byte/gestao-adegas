# Gestão de Adegas

Aplicação PWA para inventário pessoal de vinhos.

## Stack
- Front-end: React + TypeScript + Vite
- Autenticação e dados: Supabase Auth / PostgreSQL
- API auxiliar: Node.js + Express (estrutura inicial)
- Deploy: Docker + EasyPanel

## Etapa 03 — concluída
- Login, criação de conta, recuperação e atualização de senha.
- Gestão pessoal de adegas (criar, listar, editar e excluir adegas vazias).
- Perfil do proprietário.
- Acesso aos dados protegido por RLS no Supabase.

## Etapa 04 — inventário e scanner
- Aba Estoque com filtro por adega e busca por nome/código.
- Cadastro de rótulo e lote (safra, quantidade e custo unitário).
- Leitura de EAN/UPC pela câmera usando `@zxing/browser`.
- Consulta de dados do produto na API Open Food Facts v3.6.
- Reutilização de rótulo já cadastrado e criação de novos lotes.
- Cadastro manual quando o código não estiver na base externa.
- Ver `docs/ETAPA-04.md` para escopo, limitações e roteiro de validação.

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
Etapa 03 — primeira integração com Supabase. Etapa 04 implementa o primeiro fluxo de cadastro de vinhos, lotes e leitura de código de barras. Estatísticas, relatórios e movimentações completas permanecem no roadmap.


### Etapa 04 — cobertura auxiliar do leitor
O leitor agora reconhece o EAN `8410415580011` (Pata Negra Oro Rosé) por catálogo auxiliar verificado quando o rótulo não consta no Open Food Facts. Respostas HTTP 404 são tratadas como ausência de cadastro externo, não como falha de leitura.
