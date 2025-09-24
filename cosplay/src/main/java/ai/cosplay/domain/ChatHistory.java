package ai.cosplay.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "chat_history", indexes = {
        @Index(name = "idx_chat_role", columnList = "role_id"),
        @Index(name = "idx_chat_session", columnList = "session_id")
})
public class ChatHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(name = "session_id", nullable = false, length = 64)
    private String sessionId;

    @Lob
    @Column(name = "user_message", nullable = false)
    private String userMessage;

    @Lob
    @Column(name = "assistant_reply", nullable = false)
    private String assistantReply;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}


