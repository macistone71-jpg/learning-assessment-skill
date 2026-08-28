(function (global) {
  "use strict";

  const DEFAULT_SOURCE = `# 用户价值
用户价值等于新体验减去旧体验与替换成本。旧体验不仅包括竞品，也包括表格、纸笔和人工流程等现有替代方案。替换成本包括迁移数据、学习新工具和改变习惯所付出的时间与风险。

# Agent 工作流
稳定的 Agent 应先把模糊目标转化为结构化任务，再调用工具并校验结果。模型输出不能直接视为完成，只有结果实际存在、质量门禁通过且状态成功写入，任务才算完成。低置信度或关键字段缺失时，应交给人工确认而不是继续猜测。

# 评测与质量门禁
考试设计必须先建立知识模型与考试蓝图，再生成候选题。每道题都要绑定知识点、学习目标和来源证据。中高风险测评必须经过人工审核，预估难度不能冒充真实作答数据校准后的难度。单个知识点至少需要两条独立证据，才能形成较高置信度的学习诊断。`;

  const PURPOSE_LABELS = {
    diagnostic: "诊断性检测",
    formative: "形成性检测",
    summative: "总结性检测",
    practice: "自主练习"
  };

  function normalize(text) {
    return String(text || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  }

  function splitSentences(text) {
    return normalize(text)
      .split(/(?<=[。！？!?；;])|\n+/)
      .map((s) => s.replace(/^[-*\d.、\s]+/, "").trim())
      .filter((s) => s.length >= 12);
  }

  function analyzeSource(text) {
    const clean = normalize(text);
    const lines = clean.split("\n");
    const sections = [];
    let current = { title: "核心知识", body: [] };

    lines.forEach((line) => {
      const value = line.trim();
      if (!value) return;
      const heading = value.match(/^#{1,4}\s+(.+)$/);
      if (heading) {
        if (current.body.length) sections.push(current);
        current = { title: heading[1].trim(), body: [] };
      } else {
        current.body.push(value);
      }
    });
    if (current.body.length) sections.push(current);

    const usableSections = sections
      .map((section, index) => ({
        id: `K${index + 1}`,
        name: section.title.slice(0, 28),
        sentences: splitSentences(section.body.join("\n")),
        sourceText: section.body.join(" ")
      }))
      .filter((section) => section.sentences.length > 0);

    const sentenceCount = usableSections.reduce((sum, section) => sum + section.sentences.length, 0);
    const gaps = [];
    if (clean.length < 180) gaps.push("素材少于 180 字，证据链可能不足");
    if (usableSections.length < 2) gaps.push("建议至少提供 2 个主题或章节");
    if (sentenceCount < 6) gaps.push("可独立考查的陈述少于 6 条");

    return {
      charCount: clean.length,
      sentenceCount,
      sections: usableSections,
      sufficient: clean.length >= 180 && usableSections.length >= 2 && sentenceCount >= 6,
      gaps
    };
  }

  function rotateOptions(correct, distractors, answerIndex) {
    const values = distractors.slice(0, 3);
    while (values.length < 3) values.push("材料没有给出这一结论");
    values.splice(answerIndex, 0, correct);
    return values.slice(0, 4).map((text, index) => ({ id: "ABCD"[index], text }));
  }

  function shorten(text, max) {
    const value = String(text || "").trim();
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
  }

  function buildQuestion(section, allSections, index, variant) {
    const sourceSentence = section.sentences[variant % section.sentences.length];
    const otherSentences = allSections
      .filter((item) => item.id !== section.id)
      .flatMap((item) => item.sentences)
      .slice(0, 3)
      .map((item) => shorten(item, 62));
    const fallback = [
      `只要模型生成了内容，就可以判定「${section.name}」已达成`,
      `「${section.name}」只适用于高风险考试，与日常学习无关`,
      `材料认为「${section.name}」不需要来源或人工复核`
    ];
    const answerIndex = index % 4;
    const questionNumber = index + 1;
    const options = rotateOptions(shorten(sourceSentence, 66), otherSentences.concat(fallback), answerIndex);

    return {
      id: `I${questionNumber}`,
      version: "1.0.0",
      type: "single_choice",
      knowledge_ids: [section.id],
      objective_ids: [`O${section.id.slice(1)}`],
      bloom_level: variant === 0 ? "understand" : "apply",
      difficulty_estimated: variant === 0 ? "easy" : "medium",
      difficulty_calibrated: null,
      stem: variant === 0
        ? `根据材料，关于「${section.name}」的哪项表述最准确？`
        : `在实际工作中落实「${section.name}」时，哪项做法最符合材料要求？`,
      options,
      answer: "ABCD"[answerIndex],
      explanation: `正确选项直接得到来源材料支持：${sourceSentence}`,
      source_quote: sourceSentence,
      points: 2,
      source_ids: ["S1"],
      review_status: "teacher_review",
      quality_score: 92 - (index % 3),
      quality_flags: []
    };
  }

  function createAssessment(config, sourceText) {
    const analysis = analyzeSource(sourceText);
    if (!analysis.sufficient) {
      const error = new Error("SOURCE_GAP");
      error.analysis = analysis;
      throw error;
    }

    const items = [];
    analysis.sections.slice(0, 4).forEach((section) => {
      items.push(buildQuestion(section, analysis.sections, items.length, 0));
      items.push(buildQuestion(section, analysis.sections, items.length, 1));
    });

    const knowledgePoints = analysis.sections.slice(0, 4).map((section, index) => ({
      id: section.id,
      name: section.name,
      type: "concept",
      importance: index < 2 ? "core" : "supporting",
      source_ids: ["S1"],
      objective_ids: [`O${index + 1}`],
      observable_evidence: `学习者能解释并在情境中应用「${section.name}」`
    }));

    const title = normalize(config.title) || "AI 知识效果检测";
    const stakes = ["low", "medium", "high"].includes(config.stakes) ? config.stakes : "medium";
    const now = new Date().toISOString();

    return {
      meta: {
        package_id: `AP-${Date.now()}`,
        title,
        version: "1.0.0",
        status: stakes === "low" ? "rule_checked" : "teacher_review",
        language: "zh-CN"
      },
      brief: {
        purpose: config.purpose || "formative",
        stakes,
        audience: normalize(config.audience) || "学习者",
        duration_minutes: Number(config.duration) || 10,
        total_points: items.reduce((sum, item) => sum + item.points, 0),
        export_target: "generic-json"
      },
      sources: [{
        id: "S1",
        title: normalize(config.sourceName) || "用户提交的学习材料",
        type: "pasted-text",
        authoritative: false,
        usage_scope: "assessment-only",
        char_count: analysis.charCount
      }],
      knowledge_points: knowledgePoints,
      blueprint: {
        targets: knowledgePoints.map((point) => ({
          knowledge_id: point.id,
          objective_id: point.objective_ids[0],
          bloom_level: "understand/apply",
          difficulty: "easy/medium",
          item_type: "single_choice",
          count: 2,
          points: 4,
          evidence_rule: "至少 2 条独立作答证据"
        }))
      },
      items,
      diagnostic_rules: knowledgePoints.map((point) => ({
        knowledge_id: point.id,
        item_ids: items.filter((item) => item.knowledge_ids.includes(point.id)).map((item) => item.id),
        minimum_evidence_count: 2,
        mastery_threshold: 1
      })),
      quality: {
        hard_failures: [],
        review_status: stakes === "low" ? "sampling-required" : "pending-human-review",
        checks: {
          source_traceability: true,
          unique_answer: true,
          blueprint_coverage: true,
          difficulty_is_estimated: true,
          privacy_scan: true,
          duplicate_scan: true
        }
      },
      governance: {
        generated_by: "知测云 MVP · learning-assessment-skill",
        human_owner: "待指定教师",
        reviewers: [],
        created_at: now
      },
      analysis
    };
  }

  function validatePackage(data) {
    const errors = [];
    const required = ["meta", "brief", "sources", "knowledge_points", "blueprint", "items", "diagnostic_rules", "quality", "governance"];
    required.forEach((key) => { if (!data || !(key in data)) errors.push(`缺少字段 ${key}`); });
    if (errors.length) return { valid: false, errors };

    const sourceIds = new Set(data.sources.map((item) => item.id));
    const knowledgeIds = new Set(data.knowledge_points.map((item) => item.id));
    const itemIds = new Set();
    let points = 0;

    data.items.forEach((item) => {
      if (itemIds.has(item.id)) errors.push(`题目 ID 重复：${item.id}`);
      itemIds.add(item.id);
      points += Number(item.points || 0);
      if (!item.explanation) errors.push(`${item.id} 缺少解析`);
      if (!item.source_quote) errors.push(`${item.id} 缺少原文依据`);
      if (!item.knowledge_ids.every((id) => knowledgeIds.has(id))) errors.push(`${item.id} 引用了未知知识点`);
      if (!item.source_ids.every((id) => sourceIds.has(id))) errors.push(`${item.id} 引用了未知来源`);
      if (item.type === "single_choice") {
        const optionIds = item.options.map((option) => option.id);
        if (optionIds.length !== 4 || new Set(optionIds).size !== 4) errors.push(`${item.id} 选项不完整`);
        if (!optionIds.includes(item.answer)) errors.push(`${item.id} 答案不在选项中`);
      }
    });
    if (points !== Number(data.brief.total_points)) errors.push("总分与题目分值不一致");

    data.blueprint.targets.forEach((target) => {
      const actual = data.items.filter((item) => item.knowledge_ids.includes(target.knowledge_id)).length;
      if (actual < target.count) errors.push(`${target.knowledge_id} 未达到蓝图题量`);
    });
    return { valid: errors.length === 0, errors };
  }

  function approvePackage(data, reviewer) {
    const copy = JSON.parse(JSON.stringify(data));
    copy.items.forEach((item) => { item.review_status = "approved"; });
    copy.meta.status = "approved";
    copy.quality.review_status = "approved-by-human";
    copy.governance.human_owner = reviewer || "演示审核员";
    copy.governance.reviewers = [reviewer || "演示审核员"];
    copy.governance.reviewed_at = new Date().toISOString();
    return copy;
  }

  function diagnose(data, answers) {
    const answered = Object.keys(answers || {}).length;
    const correct = data.items.filter((item) => answers[item.id] === item.answer).length;
    const details = data.knowledge_points.map((point) => {
      const relevant = data.items.filter((item) => item.knowledge_ids.includes(point.id));
      const responses = relevant.filter((item) => answers[item.id]);
      const hits = responses.filter((item) => answers[item.id] === item.answer).length;
      let status = "insufficient_evidence";
      if (responses.length >= 2 && hits === responses.length) status = "demonstrated";
      else if (responses.length >= 2) status = "developing";
      return {
        knowledge_id: point.id,
        name: point.name,
        status,
        evidence_count: responses.length,
        correct_count: hits,
        item_count: relevant.length,
        suggestion: status === "demonstrated"
          ? "保持：换一个情境做迁移再测"
          : status === "developing"
            ? "补练：回看原文依据，完成一题带提示练习和一题无提示迁移题"
            : "证据不足：至少再完成 2 道质量合格的独立题目"
      };
    });
    return {
      answered,
      correct,
      total: data.items.length,
      accuracy: data.items.length ? Math.round((correct / data.items.length) * 100) : 0,
      details,
      completed_at: new Date().toISOString()
    };
  }

  const api = {
    DEFAULT_SOURCE,
    PURPOSE_LABELS,
    normalize,
    splitSentences,
    analyzeSource,
    createAssessment,
    validatePackage,
    approvePackage,
    diagnose
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.AssessmentCore = api;
})(typeof window !== "undefined" ? window : globalThis);
