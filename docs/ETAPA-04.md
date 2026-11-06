# Etapa 04 — Inventário e leitura de código de barras

## Funcionalidades implementadas
- Aba Estoque habilitada, com filtro por adega e busca por nome/código.
- Resumo de garrafas, valor de aquisição e lotes visíveis.
- Cadastro de vinho e lote em uma operação guiada.
- Leitura de EAN/UPC pela câmera com `@zxing/browser` (requer HTTPS e permissão de câmera).
- Entrada manual do código de barras como alternativa à câmera.
- Consulta de produto por código na API Open Food Facts v3.6.
- Catálogo auxiliar local de rótulos verificados para cobrir produtos ausentes na base colaborativa (inclui Pata Negra Oro Rosé, EAN 8410415580011).
- Se o código já estiver associado a um vinho do catálogo acessível ao usuário, reutiliza o cadastro e cria apenas um novo lote.
- Se não houver resultado externo, trata HTTP 404 como produto ausente (não como falha do scanner) e permite preencher o rótulo manualmente e salvar o código. Rótulos confirmados podem ser adicionados ao catálogo auxiliar com a fonte registrada na documentação.
- Registro em `wines`, `wine_barcodes`, `wine_images`, `inventory_lots` e `stock_movements`.
- Dados privados por usuário, respeitando as políticas RLS existentes.

## Banco de dados
A Etapa 04 utiliza as tabelas criadas na migração inicial da Etapa 02. Não há SQL adicional obrigatório.

Tabelas utilizadas:
- `countries`
- `wine_producers`
- `wines`
- `wine_barcodes`
- `wine_images`
- `inventory_lots`
- `stock_movements`

## Fonte externa de dados
A consulta usa Open Food Facts API v3.6, endpoint de produto por código de barras. O catálogo é colaborativo e não garante cobertura de todos os vinhos, nem precisão de origem, produtor ou imagem. O usuário deve revisar os campos antes de salvar. Se não encontrar o produto, o cadastro manual continua disponível.

A base Open Food Facts é disponibilizada sob licença ODbL. Consulte os termos e as orientações de atribuição antes de ampliar a utilização comercial ou redistribuir dados do catálogo.

## Imagens
Quando a API retorna `image_front_url` ou `image_url`, a URL externa é armazenada em `wine_images.image_path` para exibição. Fotos enviadas pelo usuário para o bucket privado `wine-images` serão tratadas em uma evolução posterior.

## Variáveis EasyPanel
Manter:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (Publishable key `sb_publishable_...` ou anon pública legada)

Não é necessária chave de API para consultas públicas de leitura do Open Food Facts. Nunca utilizar `service_role` ou secret key no navegador.

## Publicação
- Upload manual dos arquivos do ZIP para a raiz do repositório GitHub.
- Commit na branch `main`.
- EasyPanel: salvar e executar novo deploy/rebuild.
- Porta interna: `80`.

## Roteiro de teste
1. Abrir o app em HTTPS no celular.
2. Entrar na aba Estoque.
3. Selecionar uma adega e tocar em Adicionar vinho.
4. Permitir acesso à câmera e ler um código EAN/UPC de garrafa.
5. Conferir os dados encontrados ou preencher manualmente.
6. Preencher safra, quantidade e preço por garrafa.
7. Salvar e confirmar que o lote aparece no estoque.
8. Escanear o mesmo código novamente e confirmar que um segundo lote é criado sem duplicar o rótulo.
9. Testar um código não cadastrado na base externa e completar os dados manualmente.

## Limitações conhecidas desta etapa
- A cobertura da base externa para vinhos pode variar bastante por país e rótulo.
- A classificação automática do tipo de vinho é uma sugestão baseada nas categorias retornadas; revisar antes de salvar.
- A câmera depende de navegador compatível, HTTPS e permissão do usuário. A entrada manual é alternativa obrigatória.
- O registro do lote e do movimento inicial são duas chamadas separadas. Se o movimento falhar, o lote permanece salvo e o erro é registrado no console; a consistência transacional será reforçada na etapa de movimentações via RPC.
- Exportação Excel, estatísticas detalhadas, edição/exclusão de lotes e upload de imagens próprias ficam para etapas posteriores.


## Catálogo auxiliar — primeiro caso validado
- EAN: `8410415580011`
- Rótulo: Pata Negra Oro Rosé
- Produtor/marca: Pata Negra
- País: Espanha
- Região: Valdepeñas
- Uva: Tempranillo
- Tipo: Rosé
- Imagem: imagem de produto hospedada por Imigrantes Bebidas.
- Fontes de conferência: ficha de produto do importador Casa Flora e página comercial Imigrantes Bebidas.
- A safra, preço pago e quantidade continuam sendo informados pelo usuário; não são inferidos do catálogo.
