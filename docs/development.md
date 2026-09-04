# Development

Run the Phase 1 checks from the repository root:

```text
gradle test
```

The controller tests mock the chat service, so they do not require a running Ollama
instance. A live API request requires Ollama and the configured model to be available.