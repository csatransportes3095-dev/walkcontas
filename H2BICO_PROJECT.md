# H2BICO

Módulo interno do H2 Colombiano para organização e uso controlado de registros com nome, CPF e fotos.

## Identidade
- Nome do projeto: H2BICO
- Card no ADM: H2BICO
- Rota proposta: /adm/h2bico
- Acesso: somente ADM
- Status atual: projeto criado em branch isolada, sem publicação

## Objetivo
Centralizar cadastros com:
- Nome
- CPF
- Foto principal
- Fotos adicionais
- Observações
- Data de entrada
- Origem
- Status
- Histórico de utilização

## Status
- DISPONÍVEL
- RESERVADO
- EM USO
- USADO
- ARQUIVADO

## Funções previstas
1. Pesquisa por nome ou CPF.
2. Importação em lote.
3. Extração de CPF para TXT, um por linha.
4. Detecção de CPF duplicado.
5. Upload de várias fotos.
6. Associação automática por nome/CPF quando possível.
7. Reserva de registro antes do uso.
8. Vínculo com pedido.
9. Histórico completo de utilização.
10. Integração com /similaridade para comparação de imagens.
11. Registro da última porcentagem de similaridade.
12. Filtros por status.
13. Auditoria de ações do ADM.

## Regra importante
Ao marcar um registro como USADO, ele não deve ser apagado fisicamente. Deve sair da lista de disponíveis e permanecer no histórico para impedir reutilização acidental e manter rastreabilidade.

## Segurança
- Rota apenas ADM.
- CPF mascarado em listagens.
- Registro de auditoria.
- Imagens em armazenamento privado.
- Sem exposição pública do acervo.
