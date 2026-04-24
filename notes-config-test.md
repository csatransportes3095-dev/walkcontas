# Teste de Configurações Admin → Home

## Dados do banco (via API):
- site_title: "WALK CONTAS DE APP" 
- site_subtitle: "PEÇA SEU CUPOM DE DESCONTO"
- hero_title: "Seja Ciente VIP <span class=\"text-primary\"> Grupo de Ajunda</span> no WhatsApp"
- hero_subtitle: "Suporte direto para motoristas de Uber, 99 e InDrive. Respostas Rapidas, Grupo de ajuda"

## O que aparece na Home:
- Header: "WALK CONTAS DE APP" ✅ (correto - reflete site_title)
- Header direita: "PEÇA SEU CUPOM DE DESCONTO" ✅ (correto - reflete site_subtitle)
- Hero título: "Atendimento Rápido no WhatsApp" ❌ (NÃO reflete hero_title do banco!)
- Hero subtítulo: "Suporte direto para motoristas de Uber, 99 e InDrive. Respostas em minutos, não em horas." ❌ (NÃO reflete hero_subtitle do banco!)

## Problema:
O hero_title e hero_subtitle do banco NÃO estão sendo usados no Home.tsx!
O Home.tsx está usando textos hardcoded em vez dos valores do banco.

## Cards:
- Todos os 6 cards aparecem com dados do banco ✅
- Imagens dos cards carregam ✅
- Garantias aparecem ✅
