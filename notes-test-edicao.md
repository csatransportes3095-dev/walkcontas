# Test: EDIÇÃO DOC CARRO card flow

## What's showing:
- "Enviar Arquivos" header
- "Selecione seus arquivos"  
- **EDIÇÃO DOC CARRO** with **R$ 250,00** ✅ (valor aparecendo!)
- "Documento PDF (PDF) OBRIGATORIO"
- "Selecionar Documento PDF" button
- ENVIAR button
- Voltar button

## Issue:
- The card has only 1 model (random), so it auto-selects and goes to the `selectedNameOption === "random"` branch
- This branch shows the `renderUploadFields("random")` which renders the doc upload
- But the "Qual ano deseja?" field is in the PDF-only modal (`showPDFUpload`), NOT in this branch
- Need to add the year field to the random upload branch when the card is PDF-only type

## Fix needed:
- Add docYear input field in the `selectedNameOption === "random"` section when `isCardPDFOnly()` is true
