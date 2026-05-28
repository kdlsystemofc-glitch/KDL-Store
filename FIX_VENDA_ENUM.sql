-- ═══════════════════════════════════════════════════════════════════
-- FIX CRÍTICO: Corrige erro "invalid input value for enum tipo_movimentacao: venda"
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/jcgbqqvlcbwnewzqigya/sql/new
-- ═══════════════════════════════════════════════════════════════════

-- O enum tipo_movimentacao aceita: 'entrada', 'saida', 'ajuste', 'brinde', 'devolucao'
-- A função usava 'venda' que NÃO existe no enum — corrigido para 'saida'

CREATE OR REPLACE FUNCTION checkout_venda_transaction(
  p_empresa_id UUID,
  p_cliente_id UUID,
  p_cliente_nome TEXT,
  p_forma_pagamento TEXT,
  p_total NUMERIC,
  p_desconto NUMERIC,
  p_comissionado_id UUID,
  p_comissionado_nome TEXT,
  p_registrado_nome TEXT,
  p_obs TEXT,
  p_itens JSONB,
  p_prazo_dias INT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_venda_id UUID;
  v_item_json JSONB;
  v_produto_id UUID;
  v_quantidade NUMERIC;
  v_brinde BOOLEAN;
  v_tem_garantia BOOLEAN;
  v_dias_garantia INT;
  v_texto_garantia TEXT;
  v_venc_garantia DATE;
  v_data_vencimento DATE := NULL;
BEGIN
  -- 1. Inserir a venda
  INSERT INTO vendas (
    empresa_id, cliente_id, cliente_nome, forma_pagamento, total, desconto, 
    comissionado_id, comissionado_nome, registrado_nome, obs, status
  ) VALUES (
    p_empresa_id, p_cliente_id, p_cliente_nome, p_forma_pagamento, p_total, p_desconto,
    p_comissionado_id, p_comissionado_nome, p_registrado_nome, p_obs, 'concluida'
  ) RETURNING id INTO v_venda_id;

  -- 2. Processar itens
  FOR v_item_json IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_produto_id := (v_item_json->>'produto_id')::UUID;
    v_quantidade := (v_item_json->>'quantidade')::NUMERIC;
    v_brinde := COALESCE((v_item_json->>'brinde')::BOOLEAN, FALSE);

    INSERT INTO itens_venda (
      empresa_id, venda_id, produto_id, produto_nome, quantidade, preco_unitario, brinde, num_serie
    ) VALUES (
      p_empresa_id, v_venda_id, v_produto_id, v_item_json->>'produto_nome', 
      v_quantidade, (v_item_json->>'preco_unitario')::NUMERIC, v_brinde, v_item_json->>'num_serie'
    );
    
    -- CORRIGIDO: 'venda' não existe no enum. Saída de estoque por venda = 'saida'
    INSERT INTO estoque_movimentacoes (
      empresa_id, produto_id, tipo, quantidade, obs
    ) VALUES (
      p_empresa_id, v_produto_id,
      CASE WHEN v_brinde THEN 'brinde'::tipo_movimentacao ELSE 'saida'::tipo_movimentacao END,
      -v_quantidade,
      'Venda registrada via Checkout'
    );

    v_tem_garantia := COALESCE((v_item_json->>'tem_garantia')::BOOLEAN, FALSE);
    v_dias_garantia := (v_item_json->>'dias_garantia')::INT;
    
    IF v_tem_garantia AND v_dias_garantia IS NOT NULL AND v_dias_garantia > 0 AND NOT v_brinde THEN
      v_texto_garantia := v_item_json->>'texto_garantia';
      v_venc_garantia := CURRENT_DATE + v_dias_garantia;
      
      INSERT INTO garantias (
        empresa_id, venda_id, produto_id, produto_nome, num_serie, cliente_nome, 
        data_compra, data_vencimento, texto_garantia, status
      ) VALUES (
        p_empresa_id, v_venda_id, v_produto_id, v_item_json->>'produto_nome', v_item_json->>'num_serie',
        COALESCE(p_cliente_nome, 'Anônimo'),
        CURRENT_DATE, v_venc_garantia, v_texto_garantia, 'ativa'
      );
    END IF;

  END LOOP;

  -- 3. Fiado
  IF p_forma_pagamento = 'Fiado' AND p_cliente_nome IS NOT NULL THEN
    IF p_prazo_dias IS NOT NULL THEN
      v_data_vencimento := CURRENT_DATE + p_prazo_dias;
    END IF;

    INSERT INTO fiados (empresa_id, cliente_id, cliente_nome, valor_aberto, data_vencimento)
    VALUES (p_empresa_id, p_cliente_id, p_cliente_nome, p_total, v_data_vencimento);
  END IF;

  RETURN v_venda_id;
END;
$$;

-- Verificação: deve retornar a função sem erro
SELECT proname, prosrc FROM pg_proc WHERE proname = 'checkout_venda_transaction';
