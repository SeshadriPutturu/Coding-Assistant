package com.example.programmingassistant.assistant;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.UUID;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class AssistantChatService {

    private static final String SYSTEM_PROMPT = """
            You are a helpful, precise programming assistant. Answer the user's latest message directly;
            never ask them to provide a topic when they already asked a question. For coding requests,
            provide a complete runnable example in the requested language, followed by a short explanation
            and example output when useful. Preserve all required imports, classes, methods, and closing
            code fences. For project requests, give a practical structure and the next implementation steps.
            Prefer clear, concise Markdown. State assumptions briefly and do not invent APIs or results.
            Focus on Java, Spring Boot, Spring AI, REST APIs, SQL, Docker, testing, debugging, performance,
            and software architecture. If the request is ambiguous, make a reasonable assumption and say what it is.
            """;
            private static final int MAX_HISTORY_TURNS = 6;

    private final ChatClient chatClient;
            private final java.util.concurrent.ConcurrentHashMap<String, Deque<ConversationTurn>> conversations =
                new java.util.concurrent.ConcurrentHashMap<>();

    public AssistantChatService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    public ChatResponse chat(ChatRequest request) {
        String conversationId = request.conversationId();
        if (conversationId == null || conversationId.isBlank()) {
            conversationId = UUID.randomUUID().toString();
        }

        Deque<ConversationTurn> history = conversations.computeIfAbsent(conversationId, ignored -> new ArrayDeque<>());
        String userPrompt;
        synchronized (history) {
            StringBuilder context = new StringBuilder();
            for (ConversationTurn turn : history) {
                context.append(turn.role()).append(": ").append(turn.text()).append("\n\n");
            }
            context.append("user: ").append(request.message());
            userPrompt = context.toString();
        }

        String answer = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .user(userPrompt)
                .call()
                .content();

        if (answer == null || answer.isBlank()) {
            answer = "I could not generate an answer. Please try rephrasing the question.";
        }

        synchronized (history) {
            history.addLast(new ConversationTurn("user", request.message()));
            history.addLast(new ConversationTurn("assistant", answer));
            while (history.size() > MAX_HISTORY_TURNS * 2) {
                history.removeFirst();
            }
        }

        return new ChatResponse(answer, conversationId);
    }

    private record ConversationTurn(String role, String text) {
    }
}