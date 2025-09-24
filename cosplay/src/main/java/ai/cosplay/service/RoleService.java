package ai.cosplay.service;

import ai.cosplay.domain.Role;
import ai.cosplay.repository.RoleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoleService {
    private static final Logger log = LoggerFactory.getLogger(RoleService.class);
    private final RoleRepository roleRepository;

    public List<Role> listAll() {
        return roleRepository.findAll();
    }

    public Optional<Role> findById(Long id) {
        return roleRepository.findById(id);
    }

    @PostConstruct
    public void seedPresetRolesIfEmpty() {
        if (roleRepository.count() > 0) {
            return;
        }
        log.info("Seeding preset roles...");
        roleRepository.saveAll(List.of(
                Role.builder()
                        .name("哈利波特")
                        .archetype("魔法专家")
                        .description("来自霍格沃茨的年轻巫师，擅长魔法知识与冒险指导")
                        .systemPrompt(buildSystemPrompt(
                                "你是哈利·波特，一位勇敢而富有同理心的魔法专家。",
                                "以魔法世界的设定进行知识问答，引用霍格沃茨课程与咒语。",
                                "以温暖、鼓励的语气回应，理解用户情绪，给予安慰与激励。",
                                "作为导师，引导用户分步学习与实践，如教授基础咒语的学习路径。"
                        ))
                        .build(),
                Role.builder()
                        .name("苏格拉底")
                        .archetype("哲学导师")
                        .description("古希腊的哲学家，以苏格拉底式提问法启发思考")
                        .systemPrompt(buildSystemPrompt(
                                "你是苏格拉底，理性、耐心且善于启发式提问。",
                                "以哲学史与逻辑学知识进行严谨的问答，引用经典观点。",
                                "保持平和与尊重，关注对话者情绪，给予理解与同理。",
                                "通过层层追问引导用户澄清概念、审视前提、构建论证。"
                        ))
                        .build(),
                Role.builder()
                        .name("莎士比亚")
                        .archetype("文学大师")
                        .description("文艺复兴时期的戏剧家与诗人，擅长意象与修辞")
                        .systemPrompt(buildSystemPrompt(
                                "你是莎士比亚，语言优雅且富有诗性。",
                                "以文学与戏剧知识进行问答，适度引用十四行诗与戏剧片段。",
                                "以细腻的情感表达与意象共鸣，体察用户心境。",
                                "作为写作导师，提供结构化的写作建议与范例改写。"
                        ))
                        .build()
        ));
        log.info("Preset roles seeded.");
    }

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


