# Etapa 04.2 — Resolução inteligente de códigos de barras

## Objetivo
Aumentar a taxa de identificação de rótulos sem transformar resultados aproximados em dados confirmados. A leitura óptica continua sendo feita por ZXing; a identificação é feita em camadas.

## Ordem de consulta
1. Catálogo pessoal Supabase (`wine_barcodes` → `wines`): correspondência exata e já confirmada pelo usuário.
2. Catálogo auxiliar de códigos verificados incorporados ao app.
3. ProductGuru — tentativa de consulta por EAN em `GET /lookup/{ean}.json`.
4. Open Food Facts — consulta direta por EAN em `GET /api/v3/product/{ean}.json`.
5. ELID.wine — enriquecimento por nome, somente quando uma das fontes de EAN já identificou um produto. O app usa `POST /api/v1/match`, aceita apenas candidatos com score >= 0.75 e só preenche campos ausentes. O score é uma pontuação de ranking, não uma probabilidade.

## Proxy same-origin
O Nginx do container faz proxy para:
- `/api/catalog/productguru/` → `https://myproduct.guru/lookup/`
- `/api/catalog/off/` → `https://world.openfoodfacts.org/`
- `/api/catalog/elid/` → `https://elid.wine/api/v1/`

Isso evita depender de CORS habilitado nos provedores. O EasyPanel continua publicando o mesmo container Nginx na porta interna 80.

## Tratamento de dados
- O EAN deve corresponder exatamente ao código consultado.
- A identificação externa é uma sugestão e deve ser revisada pelo usuário.
- ELID só complementa campos ausentes; não substitui nome ou produtor retornados pela fonte que encontrou o EAN.
- Safra, preço pago e quantidade nunca são inferidos.
- País não é inferido pelo prefixo GS1 do código.
- Se nenhuma fonte encontrar o rótulo, o cadastro manual continua disponível.
- O campo `wines.source_name` recebe a origem usada no cadastro para permitir rastreabilidade básica.
- Quando ELID contribuir, a interface exibe atribuição com link para ELID.wine.

## Fontes e limites conhecidos
### ProductGuru
A página pública de dados da ProductGuru lista `GET /lookup/{ean}.json` como endpoint de identidade de produto. O endpoint é usado como fonte experimental de melhor esforço: o esquema de resposta do endpoint de produto é menos detalhado na documentação pública consultada que o endpoint de recalls. O parser aceita campos comuns e ignora respostas não reconhecidas. A ProductGuru informa que agrega bases de terceiros, incluindo Open Food Facts, portanto não é uma fonte estatisticamente independente do OFF. Verifique os termos e licenças aplicáveis antes de redistribuir dados ou ampliar o uso comercial.

### Open Food Facts
Consulta pública sem chave. A API v3 retorna `status: "success"` quando há produto; a aplicação também aceita `status: 1` para compatibilidade com respostas antigas. A base é colaborativa e usa ODbL; observar atribuição, compartilhamento de bases derivadas e os termos oficiais antes de redistribuição.

### ELID.wine
API pública sem chave, com limites de uso justo publicados de 120 req/min, 5.000 req/dia e 500 vinhos distintos/dia no endpoint de detalhe. Dados e identificadores sob CC BY 4.0; atribuição “Wine data powered by ELID.wine” com link. O score do matcher classifica candidatos e não deve ser apresentado como probabilidade. Só aceitamos score >= 0.75 e usamos ELID apenas para complementar a identificação já encontrada pelo EAN.

## Banco de dados
Nenhuma migração é obrigatória nesta atualização. São reutilizadas as tabelas existentes:
- `wine_barcodes`
- `wines`
- `wine_producers`
- `countries`
- `wine_images`

O valor da origem é persistido em `wines.source_name`. A estrutura atual não armazena a proveniência campo a campo; isso pode ser acrescentado em migração futura caso se mostre necessário.

## Requisitos de publicação
- Upload manual do ZIP para a raiz do repositório GitHub, branch `main`.
- EasyPanel: executar novo deploy/rebuild.
- Internal port: `80`.
- Não há novas variáveis de ambiente nem chaves externas nesta etapa.
- O proxy Nginx deve estar presente na imagem nova.

## Testes de aceitação
1. Código já cadastrado no Supabase: deve retornar o vinho sem chamar bases externas.
2. Código Pata Negra `8410415580011`: deve continuar usando o catálogo verificado local.
3. Código encontrado pelo ProductGuru: nome/brand e demais campos disponíveis devem ser sugeridos.
4. Código encontrado pelo OFF: aceitar status v3 textual `success` e campos retornados.
5. Nome identificado com correspondência ELID >= 0.75: complementar apenas campos ausentes.
6. ELID com score < 0.75 ou erro/limite: não alterar identidade da fonte EAN.
7. Nenhuma fonte encontra o código: preservar o EAN e permitir cadastro manual.
8. Falha/timeout em uma fonte: seguir para a próxima sem bloquear o formulário.
9. Salvar vinho: `source_name` deve guardar as fontes consultadas/que contribuíram.

## Observações
- O proxy Nginx depende de conectividade de saída HTTPS do container para os três domínios.
- Se o provedor bloquear o caminho ou alterar o formato, a consulta deve falhar de forma controlada e o cadastro manual continua disponível.
- A API ProductGuru de lookup é experimental nesta integração; validar com um conjunto real de EANs antes de tratá-la como fonte principal.
