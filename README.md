# Local Programming Assistant

A local programming assistant powered by Spring Boot, Spring AI, Ollama, and a lightweight
browser chat UI. A VS Code extension is also included for asking questions from the editor.

## Prerequisites

- Java 17 or newer
- Gradle 8 or newer
- Node.js 18+ and npm (only required for the VS Code extension)
- Ollama

### Install Ollama and the model

Install Ollama from [ollama.com/download](https://ollama.com/download), then verify it is
available in a terminal:

```text
ollama --version
```

Pull the default local coding model:

```text
ollama pull qwen2.5-coder:1.5b
```

Confirm that it is installed:

```text
ollama list
```

Ollama normally runs as a local service at `http://localhost:11434`. If it is not running,
start the Ollama application or run `ollama serve` in a separate terminal.

## Run the application

From the repository root, start the backend:

```text
gradle bootRun
```

Open the browser chat at:

```text
http://localhost:8080/
```

The browser UI supports new chats and recent chats stored in the browser's local storage.
The backend health endpoint is:

```text
http://localhost:8080/actuator/health
```

It should return `{"status":"UP"}`.

## Configuration

The defaults are defined in `backend/src/main/resources/application.yml`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama service URL |
| `OLLAMA_MODEL` | `qwen2.5-coder:1.5b` | Installed Ollama model |
| `OLLAMA_TEMPERATURE` | `0.15` | Response randomness |
| `OLLAMA_NUM_PREDICT` | `192` | Maximum generated tokens |

For example, in PowerShell:

```powershell
$env:OLLAMA_MODEL = "qwen2.5-coder:1.5b"
$env:OLLAMA_BASE_URL = "http://localhost:11434"
gradle bootRun
```

The selected model must already be installed with `ollama pull`.

## Test the API

```text
curl -X POST http://localhost:8080/api/v1/assistant/chat -H "Content-Type: application/json" -d "{\"message\":\"Explain dependency injection in Spring Boot\"}"
```

Follow-up requests can include the `conversationId` returned by the previous response.

## Verify the project

Run backend tests from the repository root:

```text
gradle test
```

Compile the VS Code extension:

```text
cd vscode-extension
npm install
npm run compile
```

## VS Code extension

1. Open the repository in VS Code.
2. Run `npm install` in `vscode-extension`.
3. Press `F5` and choose **Run Programming Assistant Extension**.
4. Open **Programming Assistant** from the Activity Bar.

The extension connects to `http://localhost:8080` by default. Change the URL with the
`programmingAssistant.backendUrl` VS Code setting if the backend runs elsewhere.

## Troubleshooting

- **Whitelabel 404 at `/`**: restart the backend after pulling the latest code, then open
	`http://localhost:8080/`. The backend must be running from the repository's `backend` project.
- **Model not found**: run `ollama list` and pull the exact model named by `OLLAMA_MODEL`.
- **Slow first response**: the model is loaded into memory on the first request. Smaller models
	respond faster on CPU-only machines.
- **Port 8080 already in use**: stop the other process or configure a different Spring server
	port before starting the backend.