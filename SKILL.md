---
name: ai-quiz-generator
description: "企业级 AI 知识检测与学习诊断：从课程包、教材、笔记或题库建立知识模型和考试蓝图，生成可追溯题目，经答案唯一性、来源、难度、重复度和人工审核门禁后发布，并基于作答证据生成知识点诊断与补练。适用于随堂测、章节测、题库建设和低/中风险学习评估。"
argument-hint: "[课程材料/题库/作答数据] [测评目的] [考生与时长]"
---

# 企业级 AI 知识检测与学习诊断

## 1. 定位

考试不是“生成几道题”，而是用可解释证据判断学习目标是否达成。本 Skill 把测评拆成：

```text
来源 → 知识模型 → 考试蓝图 → 候选题池 → 质量门禁 → 人工审核
→ 发布/导出 → 作答 → 诊断 → 补练 → 再测
```

核心原则：

1. **先有蓝图，再有题目**：题量、知识点、认知层级和难度来自测评目的，不固定套 60/30/10。
2. **每道题都有证据链**：题目、答案、解析、知识点和来源绑定。
3. **高风险测评必须人工审核**：AI 不独立决定升学、认证、奖惩或人员评价。
4. **STEM 结果优先确定性计算**：答案、解析和互动演示必须同源一致。
5. **诊断表达证据强度，不给学生贴标签**：区分“本次证据不足”和“不会”。
6. **上线后的题目数据反哺题库**：难度、区分度和干扰项质量必须基于真实作答数据校准。

## 2. 适用范围与风险分级

### 输入入口

1. **课程入口**：来自 `lesson-package.json`、教材、PPT、讲稿或课堂笔记；
2. **题库入口**：已有题库，需要补题、改写、去重、组卷或审核；
3. **作答入口**：已有匿名化作答数据，需要知识点诊断和补练；
4. **图片入口**：从题目图片抽取内容，必须回显确认后再处理。

### 风险等级

| 等级 | 示例 | AI 权限 |
|---|---|---|
| low | 自测、随堂练习 | 可自动生成，发布前抽检 |
| medium | 章节测、课程结业测 | 全量规则检查 + 教师/教研审核 |
| high | 升学、认证、奖惩、人事决策 | AI 只辅助；专业测量人员负责设计、审核和效度证据 |

用户未指定时按 `medium` 处理。不得把低风险题目质量标准直接用于高风险考试。

## 3. 工作流

### 阶段 0：生成并确认 AssessmentBrief

集中补齐：

```yaml
assessment_brief:
  title: 测评名称
  purpose: diagnostic | formative | summative | practice
  stakes: low | medium | high
  audience: 年级/能力水平/无障碍需要
  duration_minutes: 20
  delivery_mode: online | paper | oral | practical
  scoring_mode: auto | rubric | mixed
  allowed_sources: [S1, S2]
  prohibited_content: []
  item_types: [single_choice, short_response]
  review_roles: [teacher, subject_reviewer]
  export_target: generic-json
```

必须回显确认测评目的、风险、学员、时长、评分和来源。没有平台 API/适配器时，`export_target` 只能是通用 JSON/CSV/Markdown，不得承诺已经生成线上链接。

### 阶段 1：建立来源与知识模型

从来源提取知识点，但不把段落标题直接当知识点。每个知识点包含：

```yaml
knowledge_point:
  id: K1
  name: 用户价值公式
  type: concept | principle | procedure | skill
  importance: core | supporting | extension
  prerequisite_ids: []
  objective_ids: [O1]
  source_ids: [S1]
  observable_evidence: 学员能用公式分析案例
```

来源不足或笔记碎片化时标记 `SOURCE_GAP`，先补材料，不直接大量出题。

### 阶段 2：生成考试蓝图

参考 `references/assessment-blueprint.md`，确定：

- 知识点及其权重；
- Bloom 认知层级；
- 难度目标；
- 题型和分值；
- 预计时长；
- 每个目标需要几条独立证据；
- 自动判分与人工评分边界。

蓝图示例：

```yaml
blueprint_row:
  knowledge_id: K1
  objective_id: O1
  bloom_level: apply
  item_type: case_single_choice
  difficulty: medium
  count: 2
  points: 4
```

若题量很少，不要输出虚假的精确百分比；直接说明每个目标对应几题。

### 阶段 3：生成候选题池

先按蓝图生成约 1.3–2 倍候选题，再筛选正式题。每题至少包含：

- 唯一 ID 和版本；
- 题型、题干、选项/作答要求；
- 正确答案或评分 Rubric；
- 解析以及错误选项为什么错；
- `knowledge_ids`、`objective_ids`、Bloom 层级、预估难度；
- `source_ids` 和可核验依据；
- 预计作答时间；
- AI 生成与人工审核状态。

题型按证据选择：

| 要证明什么 | 合适题型 |
|---|---|
| 识记概念 | 选择、填空（低权重） |
| 理解因果/边界 | 情境选择、解释题 |
| 应用方法 | 案例题、计算题、实操题 |
| 分析与评价 | 多材料题、论证题、项目任务 |
| 创造 | 作品任务 + 明确 Rubric |

### 阶段 4：确定性校验与学科插件（可选）

通用检查：

- 单选题是否恰有一个正确答案；
- 选项是否互斥、语法平行、无长度暗示；
- 题干是否包含作答所需信息；
- 答案和解析是否得到来源支持；
- 题目是否超纲或泄露答案；
- 与题库是否语义重复；
- 评分 Rubric 是否可操作。

STEM 题：

- 数学表达式和数值使用计算工具复算；
- 化学方程式检查配平与守恒；
- 几何/解析几何可选调用 `wy51ai/edulab` 的对应 Skill 生成互动解析；
- 检查“计算核心、正确答案、解析末值、互动显示”四者一致；
- 插件不可用时保留结构化规格并明确降级，不以模型心算冒充验证。

### 阶段 5：题目质量门禁

按 `references/item-quality-gates.md` 执行。

硬失败包括：

- 无法证明答案正确或单选题有多个合理答案；
- 题目引用不存在的来源；
- STEM 计算结果前后不一致；
- 蓝图核心知识点完全没有覆盖；
- 题干包含隐私、歧视或不必要的敏感信息；
- medium/high 测评未经人工审核却标记为可发布；
- 声称有“准确难度/区分度”，但没有真实作答数据。

失败题退回候选池，不要靠改措辞掩盖逻辑问题。

### 阶段 6：人工审核与题库治理

状态建议：

```text
draft_ai → rule_checked → teacher_review → subject_review → approved
→ active → retired
```

记录题目版本、来源、审核人、退回原因、使用次数和统计表现。修改正确答案或核心逻辑必须创建新版本，不覆盖历史答卷引用的版本。

### 阶段 7：组卷与导出

标准交付：

```text
assessment-package/
├── assessment-brief.md
├── source-pack.md
├── knowledge-model.json
├── blueprint.json
├── item-bank.json
├── answer-key-and-rubrics.md
├── assessment.json
├── import/
│   ├── generic.csv
│   └── generic.json
├── quality-report.md
├── review-log.md
└── diagnostic-rules.json
```

只有配置了真实适配器时才导出到问卷星、腾讯问卷、Google Forms、Quizizz、Kahoot 或 LMS。否则交付通用格式和导入说明，不虚构考试链接。

### 阶段 8：作答诊断

诊断按知识点聚合**证据**：

- 正确与否；
- 题目难度和认知层级；
- 作答时间（仅作辅助，不单独判定能力）；
- Rubric 各维度；
- 同知识点是否有多道独立题支持。

输出三档而非绝对标签：

- `demonstrated`：已有多条一致证据；
- `developing`：部分证据支持，仍有不稳定表现；
- `insufficient_evidence`：题量不足、题目质量存疑或证据冲突。

详细规则见 `references/diagnostic-model.md`。不得把一次答错解释为永久能力缺陷。

### 阶段 9：补练与再测

补练题必须：

- 对准同一知识点和错误类型；
- 换数字、材料或场景，避免背答案；
- 初次补练可降低一个难度层级并提供脚手架；
- 再测时撤掉脚手架，验证能否迁移；
- 记录补练前后证据变化。

## 4. 上线后的测量分析

只有样本量和数据质量足够时才计算并解释：

- 题目难度（通过率）；
- 区分度；
- 干扰项选择分布；
- 作答时长异常；
- 题目—总分相关；
- 测验可靠性。

这些是实测指标，不是生成时可准确预测的属性。生成阶段的 `difficulty` 必须标记为 `estimated`，有数据后再更新为 `calibrated`。

## 5. 企业级治理

### 角色

| 角色 | 权限 |
|---|---|
| Teacher | 创建测评、组卷、查看本班诊断 |
| Item Reviewer | 审核题目、答案和 Rubric |
| Assessment Admin | 管理蓝图、题库、发布和退役 |
| Organization Admin | 管理模型、成本、数据和权限 |
| Learner | 作答并查看被授权的反馈 |

### 隐私与公平

- 学生使用匿名 ID；导出最小必要字段；
- 未成年人数据不得进入公开示例；
- 诊断结果按角色授权访问，并设置保留期限；
- 检查题目文化偏差、性别刻板印象和无关语言负荷；
- 提供合理的无障碍替代形式；
- 高风险决策不能只依赖 AI 生成题或自动诊断。

## 6. 结构化输出与验证

字段见 `references/assessment-package-schema.md`。生成后运行：

```bash
python3 scripts/validate_assessment_package.py path/to/assessment-package.json
```

验证器检查 ID、蓝图覆盖、来源、分值、单选唯一答案和审核状态。通过验证不代表题目具有效度，仍需专业审核和真实作答数据。

## 7. 面试/复盘指标

只使用真实数据：

- 单份测评/单道题生产耗时与成本；
- AI 候选题审核通过率、人工修改率和主要退回原因；
- 蓝图覆盖率、重复题率、答案错误率；
- 发布后题目通过率、区分度和干扰项表现；
- 学生完成率、补练完成率和再测变化；
- 教师查看/采用诊断的比例；
- 隐私、安全或内容事故数。

## 8. 失败模式

- 直接从一段笔记生成试卷，没有知识模型和蓝图；
- 固定套“基础 60% + 进阶 30% + 挑战 10%”，不看测评目的；
- 每个知识点只用一道题就下掌握结论；
- 选择题只有答案没有干扰项解释；
- 生成时把预估难度当成真实难度；
- 没有平台适配器却承诺自动生成考试链接；
- 高风险考试跳过专业审核；
- 补练只是原题换个数字，没有诊断错误类型。

## 9. 相关文件

- `references/assessment-blueprint.md`：考试蓝图设计；
- `references/assessment-package-schema.md`：结构化包字段；
- `references/item-quality-gates.md`：题目审核门禁；
- `references/diagnostic-model.md`：证据式诊断和补练；
- `scripts/validate_assessment_package.py`：结构校验；
- `examples/assessment-package.example.json`：最小完整示例。
