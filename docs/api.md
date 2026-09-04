# API

## Chat

`POST /api/v1/assistant/chat`

Request:

```json
{
  "message": "Explain dependency injection in Spring Boot"
}
```

Response:

```json
{
  "answer": "...",
  "conversationId": "..."
}
```

Blank messages return `400 Bad Request`. Ollama/model connectivity failures are returned
as server errors until the error contract is expanded in a later phase.