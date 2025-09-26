package ai.cosplay.service;

import ai.cosplay.controller.RoleController;
import ai.cosplay.domain.CreateRoleRequest;
import ai.cosplay.domain.Role;
import ai.cosplay.repository.RoleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoleService {
    private static final Logger log = LoggerFactory.getLogger(RoleService.class);
    private final RoleRepository roleRepository;
    private final ChatClient chatClient;

    public List<Role> listAll() {
        return roleRepository.findAll();
    }

    public Optional<Role> findById(Long id) {
        return roleRepository.findById(id);
    }
    public Role createRole(CreateRoleRequest request) {
        // 检查角色名称是否已存在
        if (roleRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("角色名称已存在: " + request.getName());
        }

        // 使用AI生成专业的角色信息
        RoleAIContent aiContent = generateRoleContentWithAI(request.getName(), request.getDescription());

        Role role = Role.builder()
                .name(request.getName())
                .archetype(aiContent.getArchetype())
                .description(aiContent.getDescription())
                .systemPrompt(aiContent.getSystemPrompt())
                .createdAt(Instant.now())
                .build();

        Role savedRole = roleRepository.save(role);
        log.info("AI增强角色创建成功: {}", savedRole.getName());

        return savedRole;
    }

    // AI生成角色内容
    private RoleAIContent generateRoleContentWithAI(String roleName, String userDescription) {
        try {
            String prompt = buildAIPrompt(roleName, userDescription);

            String aiResponse = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            return parseAIResponse(aiResponse, roleName, userDescription);

        } catch (Exception e) {
            log.error("AI生成角色内容失败，使用默认模板: {}", e.getMessage());
            return createDefaultRoleContent(roleName, userDescription);
        }
    }

    // 构建AI提示词
    private String buildAIPrompt(String roleName, String userDescription) {
        return String.format("""
                请根据以下信息为角色扮演聊天机器人创建一个专业的角色设定：
                
                角色名称：%s
                用户描述：%s
                
                请按照以下JSON格式返回，不要包含其他内容：
                {
                  "archetype": "角色类型（如：魔法专家、哲学导师、文学大师等）",
                  "description": "专业完整的角色描述（50-100字）",
                  "systemPrompt": "完整的系统提示词，包含以下部分：\\n1. 角色身份介绍\\n2. 知识问答技能\\n3. 情感共鸣技能\\n4. 教学引导技能\\n5. 回复要求"
                }
                
                参考示例（哈利波特）：
                - archetype: "魔法专家"
                - description: "来自霍格沃茨的年轻巫师，擅长魔法知识与冒险指导"
                - systemPrompt: "你是哈利·波特，一位勇敢而富有同理心的魔法专家。
                    【技能：知识问答】以魔法世界的设定进行知识问答，引用霍格沃茨课程与咒语。
                    【技能：情感共鸣】以温暖、鼓励的语气回应，理解用户情绪，给予安慰与激励。
                    【技能：教学引导】作为导师，引导用户分步学习与实践，如教授基础咒语的学习路径。
                     回复要求：
                              - 使用中文优先，必要时包含简短英文术语。
                              - 回答分段清晰，必要时给出要点列表与示例。
                              - 保持角色一致性。\s"
                """, roleName, userDescription);
    }

    // 解析AI响应
    private RoleAIContent parseAIResponse(String aiResponse,String roleName, String userDescription) {
        try {
            // JSON解析
            String archetype = extractValue(aiResponse, "archetype");
            String description = extractValue(aiResponse, "description");
            String systemPrompt = extractValue(aiResponse, "systemPrompt");

            return new RoleAIContent(
                    archetype != null ? archetype : roleName,
                    description != null ? description : userDescription,
                    systemPrompt != null ? systemPrompt : buildSystemPrompt()
            );

        } catch (Exception e) {
            log.error("解析AI响应失败: {}", e.getMessage());
            return createDefaultRoleContent(roleName, userDescription);
        }
    }

    private String extractValue(String text, String key) {
        try {
            int start = text.indexOf("\"" + key + "\":") + key.length() + 3;
            int end = text.indexOf("\",", start);
            if (end == -1) end = text.indexOf("\"}", start);
            if (end == -1) end = text.length();
            return text.substring(start, end).replace("\"", "").trim();
        } catch (Exception e) {
            return null;
        }
    }

    // 默认角色内容（AI调用失败时使用）
    private RoleAIContent createDefaultRoleContent(String roleName, String userDescription) {
        String defaultArchetype = "对话伙伴";
        String defaultDescription = userDescription != null ? userDescription : "一个有趣的角色";

        String defaultSystemPrompt = buildSystemPrompt(
                "你是" + roleName + "，一个独特有趣的角色。",
                "基于你的角色背景进行知识问答。",
                "以友好、理解的态度回应用户的情感需求。",
                "根据对话内容自然地引导话题和提供建议。"
        );

        return new RoleAIContent(defaultArchetype, defaultDescription, defaultSystemPrompt);
    }

    // 构建系统提示词
    private String buildSystemPrompt() {
        return String.join("\n\n",
                "你是一个AI角色扮演助手。",
                "【技能：知识问答】" + "基于角色设定进行相关的知识问答。",
                "【技能：情感共鸣】" + "理解用户情绪并提供适当的情感支持。",
                "【技能：教学引导】" + "自然地引导对话并提供有用的建议。",
                "回复要求：\n- 使用中文优先，必要时包含简短英文术语。\n- 回答分段清晰，必要时给出要点列表与示例。\n- 保持角色一致性。"
        );
    }


    // AI生成内容的容器类
    private static class RoleAIContent {
        private final String archetype;
        private final String description;
        private final String systemPrompt;

        public RoleAIContent(String archetype, String description, String systemPrompt) {
            this.archetype = archetype;
            this.description = description;
            this.systemPrompt = systemPrompt;
        }

        public String getArchetype() { return archetype; }
        public String getDescription() { return description; }
        public String getSystemPrompt() { return systemPrompt; }
    }

//    @PostConstruct
//    public void seedPresetRolesIfEmpty() {
//        if (roleRepository.count() > 0) {
//            return;
//        }
//        log.info("Seeding preset roles...");
//        roleRepository.saveAll(List.of(
//                Role.builder()
//                        .name("哈利波特")
//                        .archetype("魔法专家")
//                        .description("来自霍格沃茨的年轻巫师，擅长魔法知识与冒险指导")
//                        .systemPrompt(buildSystemPrompt(
//                                "你是哈利·波特，一位勇敢而富有同理心的魔法专家。",
//                                "以魔法世界的设定进行知识问答，引用霍格沃茨课程与咒语。",
//                                "以温暖、鼓励的语气回应，理解用户情绪，给予安慰与激励。",
//                                "作为导师，引导用户分步学习与实践，如教授基础咒语的学习路径。"
//                        ))
//                        .build(),
//                Role.builder()
//                        .name("苏格拉底")
//                        .archetype("哲学导师")
//                        .description("古希腊的哲学家，以苏格拉底式提问法启发思考")
//                        .systemPrompt(buildSystemPrompt(
//                                "你是苏格拉底，理性、耐心且善于启发式提问。",
//                                "以哲学史与逻辑学知识进行严谨的问答，引用经典观点。",
//                                "保持平和与尊重，关注对话者情绪，给予理解与同理。",
//                                "通过层层追问引导用户澄清概念、审视前提、构建论证。"
//                        ))
//                        .build(),
//                Role.builder()
//                        .name("莎士比亚")
//                        .archetype("文学大师")
//                        .description("文艺复兴时期的戏剧家与诗人，擅长意象与修辞")
//                        .systemPrompt(buildSystemPrompt(
//                                "你是莎士比亚，语言优雅且富有诗性。",
//                                "以文学与戏剧知识进行问答，适度引用十四行诗与戏剧片段。",
//                                "以细腻的情感表达与意象共鸣，体察用户心境。",
//                                "作为写作导师，提供结构化的写作建议与范例改写。"
//                        ))
//                        .build()
//        ));
//        log.info("Preset roles seeded.");
//    }

    private String buildSystemPrompt(String identity, String qa, String empathy, String teaching) {
        return String.join("\n\n",
                identity,
                "【技能：知识问答】" + qa,
                "【技能：情感共鸣】" + empathy,
                "【技能：教学引导】" + teaching,
                "回复要求：\n- 使用中文优先，必要时包含简短英文术语。\n- 回答分段清晰，必要时给出要点列表与示例。\n- 保持角色一致性。"
        );
    }
}


