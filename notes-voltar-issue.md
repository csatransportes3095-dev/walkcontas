# Issue: Voltar button behavior

When clicking Voltar in the upload screen for EDIÇÃO DOC CARRO (single model, auto-selected):
- It goes BACK to the model selection screen ("Selecione uma Opção") showing "Edição Ano, vencimento Etc R$ 250,00"
- This is actually correct behavior - it unsets selectedNameOption and shows the model selection
- But since there's only 1 model, it should probably just close the modal entirely

The current flow is: auto-select → upload screen → Voltar → model selection (1 option) → click option → upload screen again
Better flow would be: auto-select → upload screen → Voltar → close modal

Need to fix the Voltar button to close the modal when there's only 1 model.
