-- ============================================================
-- RESET DA NUMERAÇÃO DE VENDAS
-- Execute no SQL Editor do Supabase para que a próxima venda
-- seja registrada como #0001
--
-- ⚠️ ATENÇÃO: Isso apaga TODAS as vendas existentes do banco.
-- Use APENAS se quiser limpar os dados de teste.
-- ============================================================

-- OPÇÃO A — Apagar todas as vendas de teste e reiniciar do #1
-- (remove vendas, itens, fiados e garantias vinculadas)
-- DELETE FROM itens_venda WHERE venda_id IN (SELECT id FROM vendas);
-- DELETE FROM fiados WHERE venda_id IN (SELECT id FROM vendas);
-- DELETE FROM garantias WHERE venda_id IN (SELECT id FROM vendas);
-- DELETE FROM vendas;
-- ALTER SEQUENCE vendas_numero_seq RESTART WITH 1;

-- ============================================================
-- OPÇÃO B — Manter as vendas existentes mas ajustar o próximo
-- número para continuar a partir de onde está (NÃO recomendado
-- resetar para 1 se há vendas reais — use só em ambiente de teste)
-- ============================================================

-- Ver o maior número atual de venda:
SELECT MAX(numero) AS ultimo_numero FROM vendas;

-- Se quiser que a próxima venda seja, por exemplo, 1:
-- ALTER SEQUENCE vendas_numero_seq RESTART WITH 1;

-- Se quiser que continue a partir do próximo número natural:
-- SELECT setval('vendas_numero_seq', (SELECT MAX(numero) FROM vendas));

-- ============================================================
-- OPÇÃO C — Verificar e corrigir sem apagar nada
-- Se a sequence está muito adiantada por causa de registros 
-- de teste que foram deletados manualmente, use:
-- ============================================================
SELECT setval('vendas_numero_seq', COALESCE((SELECT MAX(numero) FROM vendas), 0));

-- Após executar o setval acima, a próxima venda será MAX(numero) + 1.
-- Se a tabela vendas estiver vazia, a próxima será #1.
