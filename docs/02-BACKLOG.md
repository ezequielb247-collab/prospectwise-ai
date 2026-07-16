# Backlog

## Próximas entregas

- Repositório D1 para análises e atividades, substituindo a implementação temporária em memória.
- Autenticação e isolamento completo por usuário.
- Importação real via Outscraper com tratamento de limites e reprocessamento.
- Aprovação e envio real de mensagens somente após integração autorizada.
- Configuração visual das regras de score e histórico de versões.
- Paginação do Radar no servidor para grandes volumes.
- Observabilidade, telemetria e alertas de falha.

## Dívidas e auditoria

- Os mocks antigos ainda possuem um score de referência usado em telas legadas.
- Ratings do esquema legado usam inteiros; normalizar a escala ao persistir dados reais.
- A migração 0003 descarta análises do protótipo anterior, incompatíveis com o novo formato.
- Garantir que a futura persistência mantenha unicidade por lead e trilha de recálculos.
