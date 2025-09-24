package ai.cosplay.service;

import ai.cosplay.domain.ChatHistory;
import ai.cosplay.domain.Role;
import ai.cosplay.repository.ChatHistoryRepository;
import ai.cosplay.repository.RoleRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {
    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private final ChatModel chatClient;
    private final RoleRepository roleRepository;
    private final ChatHistoryRepository chatHistoryRepository;

    @Transactional
    public ChatResponse chat(Long roleId, String sessionId, String userMessageText) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("角色不存在: " + roleId));

        String resolvedSessionId = StringUtils.hasText(sessionId) ? sessionId : UUID.randomUUID().toString();

        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(role.getSystemPrompt()));

        List<ChatHistory> recent = chatHistoryRepository.findTop100BySessionIdOrderByCreatedAtDesc(resolvedSessionId);
        // reverse chronological to chronological
        for (int i = recent.size() - 1; i >= 0; i--) {
            ChatHistory h = recent.get(i);
            messages.add(new UserMessage(h.getUserMessage()));
            messages.add(new AssistantMessage(h.getAssistantReply()));
        }

        messages.add(new UserMessage(userMessageText));

        var prompt = new Prompt(messages);
        var response = chatClient.call(prompt);
        String reply = response.getResult().getOutput().getText();

        ChatHistory saved = chatHistoryRepository.save(ChatHistory.builder()
                .role(role)
                .sessionId(resolvedSessionId)
                .userMessage(userMessageText)
                .assistantReply(reply)
                .build());

        log.debug("Saved chat history id={} session={}", saved.getId(), resolvedSessionId);

        return new ChatResponse(resolvedSessionId, reply);
    }

    public List<ChatHistory> getHistoryBySession(String sessionId) {
        return chatHistoryRepository.findTop100BySessionIdOrderByCreatedAtDesc(sessionId);
    }

    public record ChatResponse(String sessionId, String reply) {}
}


