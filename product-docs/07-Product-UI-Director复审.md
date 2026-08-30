# 知测云｜Product UI Director 升级报告

日期：2026-08-30

## 使用能力

定制 Skill：https://github.com/macistone71-jpg/heqingfeng-product-ui-skill

## 发现与修复

- 增加统一 3px orange `:focus-visible`，补齐键盘焦点；
- 增加 `prefers-reduced-motion`，关闭非必要平滑滚动并把动画/过渡降为近零；
- 按钮最小高度提升到 44px；
- `100vh` 改为 `100dvh`，适配移动浏览器动态工具栏；
- 建立 `design-system/product-ui/MASTER.md`、产品 Brief、决策记录与 UI 验收记忆；
- 静态复扫后不再出现 focus、reduced-motion 与 viewport-unit 风险。

## 工程验证

- Node 25+ 核心断言通过；
- Assessment Package Python 校验通过；
- 正式 Pages 浏览器复验记录在 `design-system/product-ui/UI-ACCEPTANCE.md`。
