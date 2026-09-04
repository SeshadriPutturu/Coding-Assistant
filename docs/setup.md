# Setup

Install Java 17+, Gradle 8+, Node.js 18+ (for the extension), and Ollama.

Install Ollama from [ollama.com/download](https://ollama.com/download), then pull the model
used by default:

```text
ollama pull qwen2.5-coder:1.5b
ollama list
```

Ollama should be available at `http://localhost:11434`. Start the Ollama application or run
`ollama serve` if the service is not already running.

From the repository root, start the backend:

```text
gradle bootRun
```

Open `http://localhost:8080/` for the browser chat and
`http://localhost:8080/actuator/health` to verify the service.

The application reads these environment variables:

- `OLLAMA_BASE_URL`, default `http://localhost:11434`
- `OLLAMA_MODEL`, default `qwen2.5-coder:1.5b`
- `OLLAMA_TEMPERATURE`, default `0.15`
- `OLLAMA_NUM_PREDICT`, default `192`

The selected model must be installed locally with `ollama pull`.