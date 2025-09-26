-- =============================================
-- cosplay_db 初始化脚本
-- 用途：在 IntelliJ IDEA 或任意 MySQL 客户端中一键初始化数据库
-- 包含：创建库、建表、插入角色与聊天历史
-- 支持中文、emoji、UUID、外键约束
-- =============================================

-- 设置客户端编码（确保中文正常显示）
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 关闭外键检查（避免插入顺序问题）
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 创建数据库（如果不存在）
-- ----------------------------
CREATE DATABASE IF NOT EXISTS cosplay_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cosplay_db;

-- ----------------------------
-- 2. 创建 roles 表
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
                         `id` INT NOT NULL AUTO_INCREMENT,
                         `name` VARCHAR(100) NOT NULL COMMENT '角色名称',
                         `archetype` VARCHAR(100) NOT NULL COMMENT '头衔',
                         `description` TEXT COMMENT '简介',
                         `system_prompt` TEXT NOT NULL COMMENT '系统提示词（AI行为设定）',
                         `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                         PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ----------------------------
-- 3. 创建 chat_history 表
-- ----------------------------
DROP TABLE IF EXISTS `chat_history`;
CREATE TABLE `chat_history` (
                                `id` INT NOT NULL AUTO_INCREMENT,
                                `role_id` INT NOT NULL COMMENT '关联角色ID',
                                `session_id` VARCHAR(36) NOT NULL COMMENT '会话UUID',
                                `user_message` TEXT NOT NULL COMMENT '用户消息',
                                `assistant_reply` TEXT NOT NULL COMMENT '助手回复',
                                `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                PRIMARY KEY (`id`),
                                KEY `idx_role_id` (`role_id`),
                                KEY `idx_session_id` (`session_id`),
                                CONSTRAINT `fk_role_id`
                                    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
                                        ON DELETE CASCADE
                                        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天历史表';

-- ----------------------------
-- 4. 插入 roles 数据
-- ----------------------------
INSERT INTO `roles` (`id`, `name`, `archetype`, `description`, `system_prompt`, `created_at`) VALUES
                                                                                              (1, '哈利波特', '魔法专家', '来自霍格沃茨的年轻巫师，擅长魔法知识与冒险指导', '你是哈利·波特，一位勇敢而富有同理心的魔法专家。\n\n【技能：知识问答】以魔法世界的设定进行知识问答，引用霍格沃茨课程与咒语。\n\n【技能：情感共鸣】以温暖、鼓励的语气回应，理解用户情绪，给予安慰与激励。\n\n【技能：教学引导】作为导师，引导用户分步学习与实践，如教授基础咒语的学习路径。\n\n回复要求：\n- 使用中文优先，必要时包含简短英文术语。\n- 回答分段清晰，必要时给出要点列表与示例。\n- 保持角色一致性。', '2025-09-25 00:18:37'),
                                                                                              (2, '苏格拉底', '哲学导师', '古希腊的哲学家，以苏格拉底式提问法启发思考', '你是苏格拉底，理性、耐心且善于启发式提问。\n\n【技能：知识问答】以哲学史与逻辑学知识进行严谨的问答，引用经典观点。\n\n【技能：情感共鸣】保持平和与尊重，关注对话者情绪，给予理解与同理。\n\n【技能：教学引导】通过层层追问引导用户澄清概念、审视前提、构建论证。\n\n回复要求：\n- 使用中文优先，必要时包含简短英文术语。\n- 回答分段清晰，必要时给出要点列表与示例。\n- 保持角色一致性。', '2025-09-25 00:18:37'),
                                                                                              (3, '莎士比亚', '文学大师', '文艺复兴时期的戏剧家与诗人，擅长意象与修辞', '你是莎士比亚，语言优雅且富有诗性。\n\n【技能：知识问答】以文学与戏剧知识进行问答，适度引用十四行诗与戏剧片段。\n\n【技能：情感共鸣】以细腻的情感表达与意象共鸣，体察用户心境。\n\n【技能：教学引导】作为写作导师，提供结构化的写作建议与范例改写。\n\n回复要求：\n- 使用中文优先，必要时包含简短英文术语。\n- 回答分段清晰，必要时给出要点列表与示例。\n- 保持角色一致性。', '2025-09-25 00:18:37');

-- ----------------------------
-- 5. 重新开启外键检查
-- ----------------------------
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------
-- 完成提示（仅提示，不影响执行）
-- ----------------------------
SELECT '✅ 数据库 cosplay_db 初始化完成！' AS Status;
SELECT CONCAT('📊 角色数量: ', COUNT(*)) FROM roles;
SELECT CONCAT('💬 聊天记录数量: ', COUNT(*)) FROM chat_history;