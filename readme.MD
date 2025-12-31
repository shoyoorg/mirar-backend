# 🚀 MIRAR API - Rotas e Exemplos

## 🟢 Rotas Públicas

| Método | Rota | Parâmetros | Descrição | Exemplo |
|--------|------|------------|-----------|---------|
| POST | `/mirar/register/:botId/:value` | `botId` → ID do bot<br>`value` → valor da moeda | Registra um bot. Status inicial: `pending`. | ```bash curl -X POST http://localhost:3000/mirar/register/1234/10``` |
| POST | `/mirar/change/:fromBot/:toBot/:userId/:amount` | `fromBot` → bot que envia moedas<br>`toBot` → bot que recebe<br>`userId` → usuário<br>`amount` → quantidade de moedas | Troca moedas entre dois bots aprovados para um usuário. | ```bash curl -X POST http://localhost:3000/mirar/change/1234/5678/42/5``` |
| GET | `/mirar/balance/:botId/:userId` | `botId`, `userId` | Consulta o saldo do usuário em um bot. | ```bash curl http://localhost:3000/mirar/balance/1234/42``` |

---

## 🔒 Rotas Privadas (Team)

> Protegidas pelo header `Authorization: Bearer <TEAM_TOKEN>`

| Método | Rota | Parâmetros | Descrição | Exemplo |
|--------|------|------------|-----------|---------|
| POST | `/team/confirm/:botId` | `botId` | Aprova um bot. Necessário para ele participar de trocas. | ```bash curl -X POST http://localhost:3000/team/confirm/1234 -H "Authorization: Bearer Mir4rTeam!23"``` |
| GET | `/team/pending` | — | Lista todos os bots pendentes de aprovação. | ```bash curl http://localhost:3000/team/pending -H "Authorization: Bearer Mir4rTeam!23"``` |
| POST | `/team/update/:botId/:value` | `botId`, `value` | Atualiza o valor da moeda de um bot (apenas team). | ```bash curl -X POST http://localhost:3000/team/update/1234/20 -H "Authorization: Bearer Mir4rPow!77"``` |
