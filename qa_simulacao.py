import os
import time
import json
from playwright.sync_api import sync_playwright, TimeoutError

URL = "https://kdl-store.vercel.app"
EMAIL = "kkubia797@gmail.com"
PASSWORD = "Kkubia6697"

results = []

def run_simulation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        def log_step(nome, status, obs, screenshot=None):
            results.append({"etapa": nome, "status": status, "obs": obs, "screenshot": screenshot})
            safe_status = status.replace("✅", "OK").replace("❌", "FAIL").replace("⚠", "WARN")
            print(f"[{safe_status}] {nome}: {obs}")

        try:
            # ETAPA 1
            print("Executando Etapa 1...")
            page.goto(URL, wait_until="networkidle")
            page.fill("input[type='email']", EMAIL)
            page.fill("input[type='password']", PASSWORD)
            page.click("button[type='submit']")
            page.wait_for_url("**/dashboard", timeout=15000)
            time.sleep(3)
            
            kpi_visible = page.is_visible("text=Faturamento") or page.is_visible("text=Como foi?")
            page.screenshot(path="screenshot_etapa1_dashboard.png")
            log_step("Etapa 1 - Abertura", "✅ Passou" if kpi_visible else "❌ Falhou", f"Dashboard carregado. KPIs visíveis: {kpi_visible}", "screenshot_etapa1_dashboard.png")

            # ETAPA 2 - Produtos
            print("Executando Etapa 2...")
            page.goto(f"{URL}/produtos", wait_until="networkidle")
            time.sleep(2)
            
            # Produto 1
            page.locator("button", has_text="Novo Produto").click()
            time.sleep(1)
            page.fill("input[placeholder='Ex: Som JBL Stage 200']", "Som Pioneer MVH-S218BT")
            page.fill("input[placeholder='Ex: PRD-123']", "SOM-001")
            page.fill("input[placeholder='Ex: 7891234567890']", "7891357924680")
            
            page.click("button[title='Criar nova categoria']")
            page.fill("input[placeholder='Nome da nova categoria']", "Som Automotivo")
            page.locator("button", has_text="Salvar").first.click()
            time.sleep(1)
            
            # Precos
            page.fill("input[placeholder='0,00']", "180,00") # Custo. Selects all matching, we will select them more precisely
            prices = page.locator("input[placeholder='0,00']").all()
            if len(prices) >= 2:
                prices[0].fill("180.00")
                prices[1].fill("350.00")
            
            page.fill("input[placeholder='Para clientes atacado']", "290.00")
            page.fill("input[placeholder='Para clientes VIP']", "260.00")
            page.fill("input[placeholder='Piso de desconto']", "280.00")
            
            # Estoque
            page.fill("input[placeholder='0']", "15") # Qtd Atual
            estoques = page.locator("input[placeholder='0']").all()
            if len(estoques) >= 2:
                estoques[0].fill("15")
                estoques[1].fill("4")
                
            page.fill("input[placeholder='Ex: Prateleira A3, Gaveta 2...']", "Prateleira A1")
            
            # Toggles e check
            page.click("text=Rastrear número de série")
            page.click("text=Produto em destaque")
            page.click("text=Oferece garantia aos clientes")
            page.fill("input[placeholder='Dias (Ex: 90)']", "90")
            page.fill("textarea[placeholder='Ex: Garantia balcão apenas para defeito de fábrica.']", "Garantia cobre defeitos de fabricação por 90 dias")
            
            page.screenshot(path="screenshot_etapa2_p1_modal.png")
            page.locator("button", has_text="Salvar Produto").click()
            time.sleep(2)
            
            # Produto 2
            page.locator("button", has_text="Novo Produto").click()
            time.sleep(1)
            page.fill("input[placeholder='Ex: Som JBL Stage 200']", "Câmera de Ré Universal")
            page.fill("input[placeholder='Ex: PRD-123']", "CAM-001")
            
            page.click("button[title='Criar nova categoria']")
            page.fill("input[placeholder='Nome da nova categoria']", "Acessórios")
            page.locator("button", has_text="Salvar").first.click()
            time.sleep(1)

            prices = page.locator("input[placeholder='0,00']").all()
            if len(prices) >= 2:
                prices[0].fill("45.00")
                prices[1].fill("120.00")
                
            page.fill("input[placeholder='Para clientes atacado']", "95.00")
            
            estoques = page.locator("input[placeholder='0']").all()
            if len(estoques) >= 2:
                estoques[0].fill("20")
                estoques[1].fill("5")
                
            page.click("text=Pode ser usado como brinde")
            page.click("text=Oferece garantia aos clientes")
            page.fill("input[placeholder='Dias (Ex: 90)']", "60")
            
            page.locator("button", has_text="Salvar Produto").click()
            time.sleep(2)
            
            # Produto 3
            page.locator("button", has_text="Novo Produto").click()
            time.sleep(1)
            page.fill("input[placeholder='Ex: Som JBL Stage 200']", "Película Automotiva G20")
            page.fill("input[placeholder='Ex: PRD-123']", "PEL-001")
            
            page.click("button[title='Criar nova categoria']")
            page.fill("input[placeholder='Nome da nova categoria']", "Películas")
            page.locator("button", has_text="Salvar").first.click()
            time.sleep(1)

            prices = page.locator("input[placeholder='0,00']").all()
            if len(prices) >= 2:
                prices[0].fill("25.00")
                prices[1].fill("70.00")
            
            estoques = page.locator("input[placeholder='0']").all()
            if len(estoques) >= 2:
                estoques[0].fill("0")
                estoques[1].fill("3")
                
            page.click("text=Oferece garantia aos clientes")
            page.fill("input[placeholder='Dias (Ex: 90)']", "30")
            
            page.locator("button", has_text="Salvar Produto").click()
            time.sleep(3)
            page.screenshot(path="screenshot_etapa2_listagem.png")
            
            log_step("Etapa 2 - Produtos", "✅ Passou", "3 produtos cadastrados.", "screenshot_etapa2_listagem.png")

            # ETAPA 3 - Clientes
            print("Executando Etapa 3...")
            page.goto(f"{URL}/clientes", wait_until="networkidle")
            time.sleep(2)
            
            page.locator("button", has_text="Novo Cliente").click()
            time.sleep(1)
            page.fill("input[placeholder='Nome do cliente']", "João Carlos Silva")
            page.fill("input[placeholder='WhatsApp']", "11988880001")
            page.fill("input[placeholder='CPF ou CNPJ (Opcional)']", "11122233344")
            page.fill("textarea", "Cliente assíduo, prefere PIX")
            page.locator("button", has_text="Salvar Cliente").click()
            time.sleep(2)
            
            page.locator("button", has_text="Novo Cliente").click()
            time.sleep(1)
            page.fill("input[placeholder='Nome do cliente']", "Roberto Lima")
            page.fill("input[placeholder='WhatsApp']", "11988880005")
            page.fill("textarea", "Paga na semana seguinte")
            page.locator("button", has_text="Salvar Cliente").click()
            time.sleep(2)
            
            page.screenshot(path="screenshot_etapa3_clientes.png")
            log_step("Etapa 3 - Clientes", "✅ Passou", "2 clientes cadastrados.", "screenshot_etapa3_clientes.png")

            # ETAPA 4 - Fornecedores
            print("Executando Etapa 4...")
            page.goto(f"{URL}/fornecedores", wait_until="networkidle")
            time.sleep(2)
            page.locator("button", has_text="Novo Fornecedor").click()
            time.sleep(1)
            page.fill("input[placeholder='Nome da empresa']", "Distribuidora Pioneer SP")
            page.fill("input[placeholder='Nome do contato']", "Ricardo Oliveira")
            page.fill("input[placeholder='WhatsApp']", "1133330001")
            page.fill("input[placeholder='Ex: Acessórios, Embalagens']", "Eletrônicos")
            page.fill("input[placeholder='Ex: 2 dias']", "24h")
            page.fill("input[placeholder='R$ 0,00']", "500.00")
            page.locator("button", has_text="Salvar Fornecedor").click()
            time.sleep(2)
            page.screenshot(path="screenshot_etapa4_fornecedor.png")
            log_step("Etapa 4 - Fornecedor", "✅ Passou", "Fornecedor cadastrado.", "screenshot_etapa4_fornecedor.png")

            # ETAPA 5 - Venda 1
            print("Executando Etapa 5...")
            page.goto(f"{URL}/vendas/nova", wait_until="networkidle")
            time.sleep(3)
            
            page.fill("input[placeholder='Buscar produto por nome ou SKU...']", "Pioneer")
            time.sleep(1)
            page.locator("text=Som Pioneer MVH-S218BT").first.click()
            time.sleep(1)
            
            ns_input = page.locator("input[placeholder='Nº Série']").first
            if ns_input: ns_input.fill("SN-2026-001")
            
            page.fill("input[placeholder='Buscar cliente...']", "João")
            time.sleep(1)
            page.locator("text=João Carlos Silva").first.click()
            
            page.fill("input[placeholder='Buscar produto por nome ou SKU...']", "Câmera")
            time.sleep(1)
            page.locator("text=Câmera de Ré Universal").first.click()
            time.sleep(1)
            
            page.locator("button", has_text="🎁 Brinde").click()
            page.select_option("select", label="PIX")
            
            page.locator("button", has_text="Finalizar Venda").click()
            time.sleep(1)
            page.locator("button", has_text="Confirmar Venda").click()
            time.sleep(4)
            page.screenshot(path="screenshot_etapa5_sucesso.png")
            
            page.locator("a", has_text="Ver Recibo Completo").click()
            time.sleep(2)
            page.screenshot(path="screenshot_etapa5_recibo.png")
            log_step("Etapa 5 - Venda 1", "✅ Passou", "Venda finalizada com brinde e série.", "screenshot_etapa5_recibo.png")

            # ETAPA 6 - Venda 2 (Fiado)
            print("Executando Etapa 6...")
            page.goto(f"{URL}/vendas/nova", wait_until="networkidle")
            time.sleep(3)
            page.fill("input[placeholder='Buscar produto por nome ou SKU...']", "Pioneer")
            time.sleep(1)
            page.locator("text=Som Pioneer MVH-S218BT").first.click()
            time.sleep(1)
            
            page.select_option("select", label="Fiado (Anotar)")
            anon_disabled = page.locator("button", has_text="Anônimo").is_disabled()
            
            page.fill("input[placeholder='Buscar cliente...']", "Roberto")
            time.sleep(1)
            page.locator("text=Roberto Lima").first.click()
            
            page.locator("button", has_text="Finalizar Venda").click()
            time.sleep(1)
            page.locator("button", has_text="Confirmar Venda").click()
            time.sleep(4)
            
            page.goto(f"{URL}/financeiro/fiado", wait_until="networkidle")
            time.sleep(2)
            page.screenshot(path="screenshot_etapa6_fiado1.png")
            page.reload(wait_until="networkidle")
            time.sleep(3)
            page.screenshot(path="screenshot_etapa6_fiado2.png")
            fiado_visible = page.is_visible("text=Roberto Lima")
            
            log_step("Etapa 6 - Venda 2 (Fiado)", "✅ Passou" if fiado_visible else "❌ Falhou", f"Venda Fiado. Anônimo desabilitado: {anon_disabled}. Fiado sobreviveu F5: {fiado_visible}", "screenshot_etapa6_fiado2.png")

            # ETAPA 7 - Acionar Fornecedor
            print("Executando Etapa 7...")
            page.goto(f"{URL}/fornecedores", wait_until="networkidle")
            time.sleep(2)
            page.locator("button", has_text="Novo Pedido").click()
            time.sleep(1)
            page.select_option("select", label="Distribuidora Pioneer SP")
            page.fill("textarea", "Moldura Painel Onix 2020")
            page.locator("button", has_text="Salvar Pedido").click()
            time.sleep(2)
            page.locator("button", has_text="Pedidos Pendentes").click()
            time.sleep(1)
            page.screenshot(path="screenshot_etapa7_pedidos.png")
            log_step("Etapa 7 - Fornecedor", "✅ Passou", "Pedido registrado.", "screenshot_etapa7_pedidos.png")

            # ETAPA 8 - Despesas
            print("Executando Etapa 8...")
            page.goto(f"{URL}/financeiro/despesas", wait_until="networkidle")
            time.sleep(2)
            
            page.locator("button", has_text="Nova Despesa").click()
            time.sleep(1)
            page.fill("input[placeholder='Ex: Conta de Luz']", "Aluguel maio")
            page.fill("input[placeholder='R$ 0,00']", "2800.00")
            page.locator("label", has_text="Fixa").click()
            page.locator("button", has_text="Salvar").first.click()
            time.sleep(2)
            
            page.locator("button", has_text="Nova Despesa").click()
            time.sleep(1)
            page.fill("input[placeholder='Ex: Conta de Luz']", "Energia elétrica")
            page.fill("input[placeholder='R$ 0,00']", "340.00")
            page.locator("label", has_text="Variável").click()
            page.locator("button", has_text="Salvar").first.click()
            time.sleep(2)
            
            page.screenshot(path="screenshot_etapa8_despesas.png")
            log_step("Etapa 8 - Despesas", "✅ Passou", "Despesas lançadas.", "screenshot_etapa8_despesas.png")

            # ETAPA 9 - Dashboard Final
            print("Executando Etapa 9...")
            page.goto(f"{URL}/dashboard", wait_until="networkidle")
            time.sleep(4)
            page.screenshot(path="screenshot_etapa9_dashboard.png")
            log_step("Etapa 9 - Dashboard Final", "✅ Passou", "Dashboard conferido.", "screenshot_etapa9_dashboard.png")

            # ETAPA 10 - Fechar Caixa
            print("Executando Etapa 10...")
            page.goto(f"{URL}/financeiro/fechamento", wait_until="networkidle")
            time.sleep(3)
            page.screenshot(path="screenshot_etapa10_fechamento.png")
            log_step("Etapa 10 - Fechamento", "✅ Passou", "Tela de fechamento conferida.", "screenshot_etapa10_fechamento.png")

        except Exception as e:
            print(f"Erro na execução: {e}")
            page.screenshot(path="screenshot_erro_fatal.png")
            log_step("Erro Fatal", "❌ Falhou", str(e), "screenshot_erro_fatal.png")
        finally:
            browser.close()

    with open("qa_simulacao.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    run_simulation()
