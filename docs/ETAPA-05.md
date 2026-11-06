# Etapa 05 — Edição de vinhos e fotos dos rótulos

## Objetivo
Permitir corrigir os dados de um vinho já cadastrado diretamente no Estoque e registrar fotografias reais da garrafa/rótulo, inclusive em cadastros manuais quando o código de barras não encontra um produto.

## Funcionalidades
- Ação **Editar vinho** em cada item/lote do Estoque.
- Edição dos dados de catálogo: nome, produtor, país, tipo, região e uvas.
- Edição dos dados do lote selecionado: adega, safra, quantidade e custo unitário.
- Ao alterar quantidade, registrar `adjustment_in` ou `adjustment_out` em `stock_movements`.
- Seletor de foto usando `input type="file"`, `accept="image/*"` e `capture="environment"` para solicitar a câmera traseira em dispositivos móveis compatíveis.
- Pré-visualização antes de salvar.
- Upload da foto no bucket privado `wine-images`.
- Caminho organizado por usuário e vinho: `{user_id}/wines/{wine_id}/{arquivo}`.
- Registro da imagem em `public.wine_images`; nova foto passa a ser a principal.
- Imagens privadas são exibidas por URL assinada com validade de uma hora.
- Limite de upload no cliente: 5 MB por imagem, alinhado ao limite do bucket Supabase.
- A imagem e o código de barras são opcionais; o cadastro manual continua disponível sem fotografia e sem EAN.

## Modelo de edição
O cadastro do vinho é compartilhado pelo catálogo pessoal. Ao editar nome, produtor, país, tipo, região, uvas ou imagem, a alteração é aplicada ao registro `wines` e, portanto, aparece nos lotes desse mesmo vinho.
Safra, quantidade, custo unitário e adega são atributos do lote selecionado e alteram apenas o `inventory_lots` correspondente.

## Supabase
Reutiliza o bucket privado `wine-images` e as tabelas já existentes:
- `wines`
- `wine_producers`
- `wine_images`
- `inventory_lots`
- `stock_movements`

Não há migração SQL prevista porque a Etapa 02 já criou o bucket privado e as políticas individuais de Storage/RLS. A aplicação usa o bucket exato `wine-images`.

### Caminho e segurança do arquivo
O navegador faz upload autenticado com a sessão Supabase. O objeto é gravado dentro da pasta cujo primeiro segmento é o UUID do usuário autenticado. Não usar `service_role` no navegador.
Se o upload retornar `new row violates row-level security policy` ou `Unauthorized`, revisar as políticas de `storage.objects` do bucket `wine-images` e confirmar que:
- a política de INSERT permite `bucket_id = 'wine-images'`;
- o primeiro segmento de `storage.foldername(name)` corresponde a `auth.uid()::text`;
- a política de SELECT permite que o dono consulte seus próprios objetos.
A tabela `wine_images` também precisa permitir INSERT/SELECT/UPDATE para o proprietário por RLS.

## Testes de aceitação
1. Abrir Estoque e editar um vinho existente; os dados devem vir preenchidos.
2. Alterar nome, produtor, país, tipo, região ou uvas; salvar e conferir a atualização na lista.
3. Alterar safra, quantidade, custo ou adega; somente o lote selecionado deve mudar.
4. Aumentar ou reduzir quantidade; conferir a linha correspondente em `stock_movements`.
5. Em celular, iniciar cadastro manual e tocar em **Tirar foto ou escolher imagem**; confirmar abertura da câmera/galeria.
6. Selecionar uma foto, conferir a prévia e salvar; conferir o arquivo no Storage > `wine-images` e o registro em `wine_images`.
7. Reabrir edição; a imagem salva deve aparecer.
8. Trocar a imagem; a nova deve ser marcada como principal e a anterior deve continuar preservada no histórico.
9. Tentar arquivo maior que 8 MB ou não-imagem; a interface deve rejeitar.
10. Testar cadastro manual sem foto; deve continuar funcionando.

## Publicação
- Upload manual dos arquivos do ZIP para a raiz do repositório GitHub, branch `main`.
- Rebuild/redeploy no EasyPanel.
- Internal port: `80`.
- Sem novas variáveis de ambiente.
- Sem SQL obrigatório se o bucket e as políticas da Etapa 02 estiverem presentes.
