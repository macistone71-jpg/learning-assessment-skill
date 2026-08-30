# 知测云｜UI Acceptance

日期：2026-08-30

## 环境

- 正式地址：https://macistone71-jpg.github.io/learning-assessment-skill/
- GitHub Pages commit：`e4982e4`

## 实际结果

| 任务 | 结果 |
|---|---|
| 示例材料 | 337 字、3 个主题，source check good |
| 生成检测方案 | 通过，候选题 6 道，审核计数 6 |
| 键盘焦点 | Tab 后 `:focus-visible = true`，outline `solid 3px` |
| reduced-motion | transition 计算值 `0.00001s` |
| 390px | `innerWidth = scrollWidth = 390` |
| 单元与结构测试 | Node 25+ 断言；Python Assessment Package 通过 |

## 2026-08-31 可靠性复测

- Node 25+ 核心断言与 Python Package 校验连续运行 3 次，全部通过；
- SOURCE_GAP：短素材正确阻断，并列出 3 项补充原因；
- 中风险链路：生成 6 题 → 未审核时学员端阻断 → 全部审核 → 完成 6 题 → 生成 3 个知识点诊断，通过；
- 正确答案链路：6/6 正确，报告显示 100%，3 个知识点均形成一致证据；
- 低风险链路：规则检查后允许试答，同时保留 6 题抽样审核计数；
- 刷新恢复、重新试答与 JSON 实际下载通过，导出状态为 `approved`；
- 390px：`innerWidth = scrollWidth = 390`，reduced-motion 匹配；
- 本轮未发现需要修改产品代码的阻断缺陷。

## 仍需真实灰度

题目修改率、一次审核通过率、真实难度、区分度、可靠性和再测变化未采集，不计入技术验收。
