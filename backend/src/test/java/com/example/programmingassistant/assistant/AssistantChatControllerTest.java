package com.example.programmingassistant.assistant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AssistantChatController.class)
class AssistantChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AssistantChatService assistantChatService;

    @Test
    void returnsChatResponse() throws Exception {
        when(assistantChatService.chat(any(ChatRequest.class)))
                .thenReturn(new ChatResponse("Use constructor injection.", "conversation-1"));

        mockMvc.perform(post("/api/v1/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Explain dependency injection\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("Use constructor injection."))
                .andExpect(jsonPath("$.conversationId").value("conversation-1"));
    }

    @Test
    void rejectsBlankMessage() throws Exception {
        mockMvc.perform(post("/api/v1/assistant/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\" \"}"))
                .andExpect(status().isBadRequest());
    }
}