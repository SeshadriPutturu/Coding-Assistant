# Architecture

Phase 1 is a VS Code-independent Spring Boot API. The controller accepts a validated
request and delegates to a service. The service uses Spring AI's `ChatClient`, while
Spring AI's Ollama model integration handles communication with Ollama.

```text
HTTP client -> AssistantChatController -> AssistantChatService
                                      -> Spring AI ChatClient -> Ollama
```

The model provider and endpoint are configuration values, keeping business code free of
Ollama-specific HTTP calls and leaving room for another Spring AI provider later.