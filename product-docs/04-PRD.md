# 知测云 Web MVP PRD

## 1. 用户故事

- 作为教师，我希望粘贴课程材料并确认检测目的，以便获得与课程目标一致的检测方案；
- 作为审核员，我希望逐题看到答案、来源和质量状态，以便决定是否发布；
- 作为学员，我希望在简洁界面完成试答，以便知道下一步该练什么；
- 作为教研员，我希望导出结构化包，以便进入题库或平台适配流程。

## 2. 页面与功能

### 测评工作台
输入名称、目的、风险、学员、时长、来源名和学习材料。实时显示字符、主题、可考查陈述和来源缺口。素材不足时禁止生成。

### 题目审核台
显示质量分、知识点、蓝图覆盖、来源绑定、硬失败、题目答案和原文依据。medium/high 必须全部审核通过；low 仍提示抽检。

### 学员试答
一次一题，四个选项，记录作答。完成前不展示答案，避免泄题；不采集姓名。

### 诊断报告
总览正确率，但以知识点证据为主。两条一致正确证据为 demonstrated；有完整但不一致/错误证据为 developing；证据少于两条为 insufficient_evidence。

### 导出
输出 Assessment Package JSON，包含 meta、brief、sources、knowledge_points、blueprint、items、diagnostic_rules、quality、governance。

## 3. 状态

`draft → teacher_review → approved → learner_attempt → diagnosed`

修改正确答案或核心逻辑时，正式版本必须创建新版本；MVP 仅演示，不覆盖真实历史答卷。

## 4. 验收标准

1. 少于 180 字、少于 2 个主题或少于 6 条陈述时显示 SOURCE_GAP；
2. 每个知识点生成 2 道题，每题 4 个唯一选项；
3. 每题有 source_quote、explanation、estimated difficulty；
4. medium/high 未审核时学员端不可开始；
5. 结构验证器返回 OK；
6. 仅答 1 题时不得输出 demonstrated；
7. 所有题答对时每个知识点为 demonstrated；
8. 支持桌面与 390px 移动视口；
9. 刷新后保留本机状态；
10. 可下载有效 JSON。

## 5. 非功能边界

- 隐私：浏览器本地处理、不采集姓名；
- 可用性：按钮可键盘聚焦、正文对比度与触控尺寸合格；
- 安全：不在前端内置 API Key，不渲染未转义材料；
- 性能：静态资源，无运行时框架与后端冷启动；
- 合规：高风险测评仅辅助，不替代人工决策。