package ai.cosplay.controller;

import ai.cosplay.domain.ChatHistory;
import ai.cosplay.service.ChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Validated
public class ChatController {
    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatService.ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        var response = chatService.chat(request.getRoleId(), request.getSessionId(), request.getMessage());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatHistory>> history(@RequestParam("sessionId") String sessionId) {
        return ResponseEntity.ok(chatService.getHistoryBySession(sessionId));
    }

    @Data
    public static class ChatRequest {
        @NotNull
        private Long roleId;
        private String sessionId;
        @NotBlank
        private String message;
    }
}


