# Assessment Package Schema

## 顶层字段

```json
{
  "meta": {},
  "brief": {},
  "sources": [],
  "knowledge_points": [],
  "blueprint": {},
  "items": [],
  "diagnostic_rules": [],
  "quality": {},
  "governance": {}
}
```

## 关键字段

- `meta`：`package_id`、`title`、`version`、`status`、`language`。
- `brief`：`purpose`、`stakes`、`audience`、`duration_minutes`、`total_points`、`export_target`。
- `sources[]`：`id`、`title`、`type`、`authoritative`、`usage_scope`。
- `knowledge_points[]`：`id`、`name`、`type`、`importance`、`source_ids`、`objective_ids`。
- `blueprint.targets[]`：`knowledge_id`、`bloom_level`、`difficulty`、`item_type`、`count`、`points`。
- `items[]`：题干、答案/Rubric、解析、知识点、来源、难度、分值、审核状态。
- `diagnostic_rules[]`：知识点、关联题目、证据要求和阈值。
- `quality`：结构检查、内容检查、硬失败和人工审核状态。
- `governance`：模型/Skill 版本、责任人、审核人和时间。

## 单选题约定

```json
{
  "type": "single_choice",
  "options": [
    {"id": "A", "text": "..."},
    {"id": "B", "text": "..."}
  ],
  "answer": "B"
}
```

`answer` 必须对应且只对应一个 option ID。简答、项目任务等使用 `rubric`，不得伪装成可自动精准判分。

## 难度字段

- `difficulty_estimated`：生成阶段预测，只用于组卷初稿。
- `difficulty_calibrated`：基于真实作答数据得到；没有数据时必须为 null。

结构验证不等于测量效度验证。