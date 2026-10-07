# 论文讲解与知识讲解 Agent Skills

这是两个相互独立、可以协同使用的 Agent Skills：

| Skill | 适用请求 | 核心方法 |
| --- | --- | --- |
| `paper-tutor` | 阅读一篇已确定的论文，或直接比较少量已指定论文 | 先恢复作者的论证主线，再依据目标粗读、逐章精读或回答局部问题；重要结论关联原文证据 |
| `knowledge-tutor` | 系统学习一个知识点、模型、机制、工具或学科板块 | 先收集完整学习自述，再依据目标和知识类型建立可迁移的理解路径 |

当论文是主要对象时使用 `paper-tutor`；当要独立学习一项知识时使用 `knowledge-tutor`。用户只问单个事实、代码错误或一处句子时，可直接回答，无需运行完整教学流程。两项技能正文会沿用用户的语言。

## 项目状态

两个技能的主体规则已完成静态审阅；仓库脚本检查技能目录、元数据和评测案例的结构。**真实模型的触发率、教学质量、两章分页稳定性及跨轮恢复尚未通过自动评测或用户试讲证实。** `evals/` 提供可复现的测试入口和预期行为，发布后应持续记录实际结果。

## 目录

```text
skills/
  paper-tutor/SKILL.md
  knowledge-tutor/SKILL.md
evals/
  cases.json
  fixtures/sample-paper.md
scripts/
  validate.mjs
.github/workflows/
  validate.yml
.trae/skills/
  paper-tutor/SKILL.md
  knowledge-tutor/SKILL.md
prompts/
  llm-paper-tutor.md
  llm-knowledge-tutor.md
```

每个 skill 都有独立目录和标准文件名 `SKILL.md`。它们不依赖本项目之外的脚本才能工作。支持 Agent Skills 的客户端可按自身说明加载单个目录；各客户端的显式调用语法可能不同，使用自然语言描述任务也可触发。有关标准目录与元数据约束，见 [Agent Skills 规范](https://agentskills.io/specification)。

## TRAE 使用与 LLM Prompt

`.trae/skills/` 保存两份技能的 TRAE 项目级副本。用 TRAE 打开本项目后，可在“设置 > 技能与命令”中启用或导入项目技能。两份 `SKILL.md` 与 `skills/` 下的发布源保持一致。

`prompts/` 下的两个文件是面向普通 LLM 对话的纯 prompt 版本，不含 Agent Skills 元数据、仓库工具、自动化或 CI 约定。可将对应文件全文作为系统提示词或首条指令；若模型不支持持久系统提示，可在新对话首条消息中粘贴，并按其上下文窗口调整论文材料范围。

## 本地验证

需要 Node.js 22 或更高版本。项目不依赖第三方 npm 包。

```text
node scripts/validate.mjs
```

该命令检查两个技能的目录和 YAML 头部基本字段、名称、长度、相对路径，以及 `evals/cases.json` 的完整性。发布前另运行 `node scripts/validate.mjs --release`，要求正式 MIT 许可文件和版权署名已就位。它**不会**调用大模型，也不能证明输出质量。行为验收见 [评测说明](evals/README.md)。

## 贡献与修改

请阅读 [贡献说明](CONTRIBUTING.md)。修改技能规则时，同时更新受影响的评测案例，尤其关注：一次性上下文收集、前置知识自学边界、论文精读的固定两章批次，以及证据不足时的输出限制。

## 许可证

许可证为 MIT，版权署名采用仓库所有者标识 `54334-bit`。正式文本见 [LICENSE](LICENSE)。两个技能的元数据已标记为 MIT。
