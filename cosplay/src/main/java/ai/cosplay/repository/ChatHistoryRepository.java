package ai.cosplay.repository;

import ai.cosplay.domain.ChatHistory;
import ai.cosplay.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {
    List<ChatHistory> findTop50ByRoleOrderByCreatedAtDesc(Role role);
    List<ChatHistory> findTop100BySessionIdOrderByCreatedAtDesc(String sessionId);
}


