# API

## Chat

`POST /api/v1/assistant/chat`

Request:

```json
{
  "message": "Explain dependency injection in Spring Boot",
  "conversationId": "optional-id-from-a-previous-response"
}
```

Response:

```json
{
  "answer": "...",
  "conversationId": "..."
}
```

Omit `conversationId` to start a new conversation. Include the returned ID in follow-up
requests to preserve recent context. Blank messages return `400 Bad Request`. Ollama/model
connectivity failures are returned as server errors until the error contract is expanded in a
later phase.

## Health

`GET /actuator/health` returns the backend status and does not require Ollama to answer a chat
request.