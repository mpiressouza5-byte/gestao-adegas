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


## Etapa 04.2 — Resolução de códigos de barras
Consulta em cascata: catálogo Supabase, catálogo auxiliar, ProductGuru, Open Food Facts v3 e enriquecimento por ELID.wine. O Nginx usa proxy same-origin para as APIs externas. Consulte `docs/ETAPA-04-2.md` para limites, licenças, proveniência e testes.


## Etapa 05 — edição e fotografia dos rótulos
- Edição de dados do vinho e do lote diretamente na lista do Estoque.
- Captura/seleção de foto do rótulo em celulares e upload autenticado para o bucket privado `wine-images`.
- URLs assinadas para exibir fotos privadas; ajuste de quantidade com registro em `stock_movements`.
- Consulte `docs/ETAPA-05.md` para escopo, segurança e testes.
