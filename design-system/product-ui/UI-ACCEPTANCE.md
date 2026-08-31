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
- 首轮未发现阻断缺陷；第二轮深查发现刷新后流程指示与答题位置不能完整恢复，现已修复；
- 中途完成第 1 题进入 QUESTION 02 后刷新，仍恢复 QUESTION 02；
- 审核待办、证据诊断、报告完成与重新试答的流水线状态均与数据同步；
- “恢复示例材料”现在立即保存，刷新后仍为 337 字完整材料。

## 仍需真实灰度

题目修改率、一次审核通过率、真实难度、区分度、可靠性和再测变化未采集，不计入技术验收。

## 2026-08-31 桌面图标验收

- SVG 已输出 1024px PNG 与含 16–1024px 多档位的 ICNS；
- 1024px 与 128px 实际渲染检查通过：证据环、审核清单及非颜色勾选状态可辨认；
- 桌面 `.app` 的图标资源与设计源 ICNS 校验和一致；
- 应用重新临时签名后 `codesign --verify --deep --strict` 通过。
