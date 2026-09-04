# Setup

Install Java 17+, Gradle 8+, and Ollama. Pull the configured model:

```text
ollama pull qwen3-coder
```

Start Ollama, then from the repository root run:

```text
gradle bootRun
```

Override defaults with `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and `OLLAMA_TEMPERATURE`.
Check `http://localhost:8080/actuator/health` after startup.