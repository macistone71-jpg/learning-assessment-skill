# 知测云｜UI Design System Master

## 产品机制

把材料变成知识模型、考试蓝图、候选题、人工审核、学员试答与证据诊断。UI 必须强调来源、证据充分性、审核门禁和谨慎诊断，而不是“快速出题”的娱乐化体验。

## 产品签名

- 版式：材料工作台 + 右侧证据流水线；
- 信息：证据环、蓝图覆盖、题目来源、demonstrated/developing/insufficient evidence；
- 交互：生成 → 审核 → 试答 → 诊断，多视图状态保留。

## Tokens

- Ink `#17211b`；Paper `#f6f7f2`；Surface `#ffffff`；Primary `#195b3f`；Accent `#c9ef75`；Warning `#ea6b45`；
- 数据编号、分数与证据计数使用等宽数字；
- 正文使用系统中文字体，行高 1.6–1.9；
- 风险、状态和诊断不得只依赖颜色。

## Accessibility / Responsive

- 交互焦点 3px orange；按钮最小高度 44px；
- 使用 `100dvh` 适配移动浏览器 chrome；
- 390px 不允许水平滚动；
- reduced-motion 下关闭非必要位移与过渡；
- 试题选项必须键盘可选并有清晰 selected 状态。

## 禁止

把预估难度冒充校准难度；一次答错直接判定“不会”；用游戏化颜色掩盖测评风险；无来源题目进入学员端；虚构可靠性、区分度或提升数据。
