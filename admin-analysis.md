# Análise de Elementos Gerenciáveis do Home.tsx

## 1. HEADER (linha 1106-1117)
- Título: "WALK CONTAS"
- Subtítulo: "Atendimento Rápido no WhatsApp"
- Ícone: Zap

## 2. HERO SECTION (linha 1119-1213)
- Título hero: "Atendimento Rápido no WhatsApp"
- Subtítulo hero: "Suporte direto para motoristas..."
- Vídeo URL: cloudfront mp4
- 3 Features: Atendimento 24h, Resposta Imediata, Múltiplas Plataformas
- Botão Promoção (desativado): texto e valor do desconto

## 3. CARDS DE SERVIÇO (linha 1216-1331) - 5 cards
Cada card tem:
- Nome do serviço (ex: "CONTA UBER")
- Imagem/ícone URL
- Texto de garantia
- Cor da borda
- Texto do botão
- Serviço vinculado (para o modal)
- Ativo/inativo

Cards atuais:
1. Conta Uber - img: pasted_file_LHCgM5 - border-primary/30
2. Conta 99 - img: pasted_file_JrgoAF - border-secondary/30
3. Conta InDrive - img: pasted_file_21g0zm - border-primary/30
4. Serviços Documento Carro - img: pasted_file_DdeEjL - border-accent/30
5. UBER TAXI - img: pasted_file_hsKF9V - border-yellow-500/30

## 4. MODELOS POR CARD (serviceValues, linha 69-76)
Cada serviço tem opções de nome com valores:
- "Conta Uber": random R$400, first R$550
- "UBER TAXI": random R$650, first R$850
- "Conta 99": random R$450, first R$650
- "Conta InDrive": random R$300, first R$450
- "EDIÇÃO DE DOCUMENTO 250,00": random R$175, first R$175

## 5. DOCUMENTOS OBRIGATÓRIOS (por card)
- Padrão: foto perfil + doc carro
- UBER TAXI: foto perfil + doc carro + alvará + condutaxi
- EDIÇÃO DOCUMENTO: apenas PDF

## 6. DADOS PIX (linha 63-66)
- PIX_KEY: "11915193551"
- PIX_NAME: "Adiel Cardeal dos Santos"
- PIX_BANK: "99Pay"

## 7. FOOTER (linha 1337-1367)
- Título: "WALK CONTAS"
- Descrição
- Lista de serviços
- WhatsApp: (11) 97830-7371
- Horário: 24H

## 8. WHATSAPP (usado em vários fluxos)
- Número: 5511978307371
