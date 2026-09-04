# Local Programming Assistant

Phase 1 provides a Spring Boot REST backend using Spring AI and Ollama.

The `vscode-extension` directory contains the Phase 2 local VS Code frontend.

## Prerequisites

- Java 17 or newer
- Gradle 8+
- Ollama with a coding model installed, for example `ollama pull qwen3-coder`

## Run

Start Ollama, then run the backend from the repository root:

```text
gradle bootRun
```

Try the API:

```text
curl -X POST http://localhost:8080/api/v1/assistant/chat -H "Content-Type: application/json" -d "{\"message\":\"Explain dependency injection in Spring Boot\"}"
```

The model and Ollama URL are configurable with `OLLAMA_MODEL`, `OLLAMA_BASE_URL`, and
`OLLAMA_TEMPERATURE`. The backend does not call Ollama directly; Spring AI's `ChatClient`
uses the configured model provider.

## Verify

```text
gradle test
```

Health is available at `http://localhost:8080/actuator/health`.

## VS Code frontend

From `vscode-extension`, run `npm install` followed by `npm run compile`. Open the repository
in VS Code, press `F5`, and run the extension development host. The extension connects to the
backend at `http://localhost:8080` by default.