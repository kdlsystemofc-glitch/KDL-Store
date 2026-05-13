import time
import json
from playwright.sync_api import sync_playwright

URL = "https://kdl-store.vercel.app/"
EMAIL = "kkubia797@gmail.com"
PASSWORD = "Kkubia6697"

def run_tests():
    report = []
    logs = []
    errors = []
    failed_requests = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        
        page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        
        def handle_response(response):
            if response.status >= 400:
                failed_requests.append(f"[{response.status}] {response.request.method} {response.url}")
                
        page.on("response", handle_response)
        
        # 1. Login
        print("Acessando página inicial...")
        page.goto(URL, wait_until="networkidle")
        time.sleep(2)
        page.screenshot(path="screenshot_01_login.png")
        
        print("Realizando login...")
        page.fill("input[type='email']", EMAIL)
        page.fill("input[type='password']", PASSWORD)
        page.click("button[type='submit']")
        page.wait_for_url("**/dashboard", timeout=15000)
        time.sleep(3)
        page.screenshot(path="screenshot_02_dashboard.png")
        
        # 2. Vendas (PDV)
        print("Acessando PDV...")
        page.goto(f"{URL}vendas/nova", wait_until="networkidle")
        time.sleep(3)
        page.screenshot(path="screenshot_03_pdv.png")
        
        # 3. Produtos
        print("Acessando Produtos...")
        page.goto(f"{URL}produtos", wait_until="networkidle")
        time.sleep(3)
        page.screenshot(path="screenshot_04_produtos.png")
        
        # 4. Clientes
        print("Acessando Clientes...")
        page.goto(f"{URL}clientes", wait_until="networkidle")
        time.sleep(3)
        page.screenshot(path="screenshot_05_clientes.png")
        
        # 5. Financeiro
        print("Acessando Financeiro...")
        page.goto(f"{URL}financeiro", wait_until="networkidle")
        time.sleep(3)
        page.screenshot(path="screenshot_06_financeiro.png")
        
        browser.close()
        
    with open("qa_results.json", "w", encoding="utf-8") as f:
        json.dump({
            "logs": logs,
            "errors": errors,
            "failed_requests": failed_requests
        }, f, indent=2)
        
    print("Testes concluídos. Resultados salvos.")

if __name__ == "__main__":
    run_tests()
