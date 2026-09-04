package com.example.programmingassistant.assistant;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
	@NotBlank(message = "message must not be blank") String message,
	String conversationId) {
}