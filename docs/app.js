(() => {
  "use strict";
  const Core = window.AssessmentCore;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const state = { package: null, answers: {}, questionIndex: 0, report: null };

  const els = {
    source: $("#sourceInput"), sourceMeta: $("#sourceMeta"), sourceCheck: $("#sourceCheck"),
    title: $("#titleInput"), purpose: $("#purposeInput"), stakes: $("#stakesInput"),
    audience: $("#audienceInput"), duration: $("#durationInput"), sourceName: $("#sourceNameInput"),
    reviewCount: $("#reviewCount"), reviewStatus: $("#reviewStatus"),
    reviewSummary: $("#reviewSummary"), questionList: $("#questionList"),
    examShell: $("#examShell"), reportContent: $("#reportContent"), toast: $("#toast")
  };

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2400);
  }

  function save() {
    try {
      localStorage.setItem("zhice-demo-state", JSON.stringify({
        package: state.package, answers: state.answers, report: state.report,
        form: { source: els.source.value, title: els.title.value, purpose: els.purpose.value, stakes: els.stakes.value, audience: els.audience.value, duration: els.duration.value, sourceName: els.sourceName.value }
      }));
    } catch (_) {}
  }

  function restore() {
    els.source.value = Core.DEFAULT_SOURCE;
    try {
      const saved = JSON.parse(localStorage.getItem("zhice-demo-state") || "null");
      if (!saved) return;
      state.package = saved.package || null;
      state.answers = saved.answers || {};
      state.report = saved.report || null;
      if (saved.form) Object.entries(saved.form).forEach(([key, value]) => {
        if (key === "source") els.source.value = value;
        else if (els[key]) els[key].value = value;
      });
    } catch (_) {}
  }

  function showView(name) {
    $$(".view").forEach((view) => view.classList.toggle("active", view.dataset.viewPanel === name));
    $$(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.view === name));
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (name === "review") renderReview();
    if (name === "exam") renderExam();
    if (name === "report") renderReport();
  }

  function updateSourceCheck() {
    const analysis = Core.analyzeSource(els.source.value);
    els.sourceMeta.textContent = `${analysis.charCount} 字 · ${analysis.sections.length} 个主题`;
    els.sourceCheck.className = `source-check ${analysis.sufficient ? "good" : "bad"}`;
    els.sourceCheck.textContent = analysis.sufficient
      ? `✓ 素材可用：识别到 ${analysis.sections.length} 个主题、${analysis.sentenceCount} 条可考查陈述。将为每个知识点生成 2 条独立证据。`
      : `需要补充：${analysis.gaps.join("；") || "请提供更完整的材料"}`;
  }

  function config() {
    return { title: els.title.value, purpose: els.purpose.value, stakes: els.stakes.value, audience: els.audience.value, duration: els.duration.value, sourceName: els.sourceName.value };
  }

  function setPipeline(stage) {
    $$("#pipelineList li").forEach((item, index) => {
      item.classList.toggle("done", index < stage);
      item.classList.toggle("active", index === stage);
      const marker = item.querySelector("i");
      marker.textContent = index === stage ? "现在" : index < stage ? "完成" : "";
    });
  }

  function generate() {
    const button = $("#generateButton");
    button.disabled = true;
    button.querySelector("span").textContent = "构建知识模型…";
    try {
      const assessment = Core.createAssessment(config(), els.source.value);
      const validation = Core.validatePackage(assessment);
      if (!validation.valid) throw new Error(validation.errors.join("；"));
      state.package = assessment;
      state.answers = {};
      state.report = null;
      state.questionIndex = 0;
      setPipeline(4);
      save();
      renderReview();
      renderExam();
      els.reviewCount.textContent = assessment.items.length;
      toast(`已生成 ${assessment.items.length} 道候选题，结构校验通过`);
      setTimeout(() => showView("review"), 380);
    } catch (error) {
      if (error.message === "SOURCE_GAP") toast(`素材不足：${error.analysis.gaps.join("；")}`);
      else toast(`生成失败：${error.message}`);
    } finally {
      button.disabled = false;
      button.querySelector("span").textContent = "生成检测方案";
    }
  }

  function renderReview() {
    const data = state.package;
    if (!data) {
      els.reviewSummary.innerHTML = '<div class="empty-state">先在测评工作台生成检测方案</div>';
      els.questionList.innerHTML = '<div class="panel empty-state">暂无候选题</div>';
      els.reviewStatus.textContent = "待生成";
      return;
    }
    const approved = data.items.filter((item) => item.review_status === "approved").length;
    const average = Math.round(data.items.reduce((sum, item) => sum + item.quality_score, 0) / data.items.length);
    els.reviewStatus.textContent = approved === data.items.length ? "审核完成" : `${approved}/${data.items.length} 已通过`;
    els.reviewStatus.className = `status-chip ${approved === data.items.length ? "" : "warn"}`;
    els.reviewCount.textContent = data.items.length - approved;
    els.reviewSummary.innerHTML = `
      <span class="step-label">QUALITY REPORT</span>
      <div class="summary-score"><strong>${average}</strong><span>/ 100 平均质量分</span></div>
      <div class="summary-list">
        <div><span>知识点</span><b>${data.knowledge_points.length}</b></div>
        <div><span>候选题</span><b>${data.items.length}</b></div>
        <div><span>蓝图覆盖</span><b>100%</b></div>
        <div><span>来源绑定</span><b>100%</b></div>
        <div><span>硬失败</span><b>${data.quality.hard_failures.length}</b></div>
      </div>
      <div class="coverage-row"><span class="step-label">BLUEPRINT COVERAGE</span>${data.knowledge_points.map((point) => `<label><span>${escapeHtml(point.name)}</span><b>2/2</b></label><div class="bar"><i style="width:100%"></i></div>`).join("")}</div>`;
    els.questionList.innerHTML = data.items.map((item, index) => `
      <article class="panel question-card">
        <div class="question-top"><div class="question-tags"><span>${item.id}</span><span>${item.bloom_level}</span><span>${item.difficulty_estimated} · 预估</span><span class="score">${item.quality_score} 分</span></div><span class="status-chip ${item.review_status === "approved" ? "" : "warn"}">${item.review_status === "approved" ? "已通过" : "待人工审核"}</span></div>
        <h3>${escapeHtml(item.stem)}</h3>
        <div class="options-preview">${item.options.map((option) => `<div class="${option.id === item.answer ? "correct" : ""}"><b>${option.id}</b> ${escapeHtml(option.text)}</div>`).join("")}</div>
        <div class="source-quote"><b>来源依据 · ${escapeHtml(data.sources[0].title)}</b><br>${escapeHtml(item.source_quote)}</div>
      </article>`).join("");
  }

  function approveAll() {
    if (!state.package) return toast("请先生成检测方案");
    state.package = Core.approvePackage(state.package, "产品演示审核员");
    setPipeline(5);
    save();
    renderReview();
    renderExam();
    toast("人工审核记录已写入，学员试答已开放");
  }

  function renderExam() {
    const data = state.package;
    if (!data) return void (els.examShell.innerHTML = '<div class="panel empty-state">生成并审核检测方案后，可在这里进行学员试答。</div>');
    const approved = data.items.every((item) => item.review_status === "approved") || data.brief.stakes === "low";
    if (!approved) return void (els.examShell.innerHTML = `<div class="panel exam-intro"><span class="eyebrow">REVIEW REQUIRED</span><h1>${escapeHtml(data.meta.title)}</h1><div class="exam-rules">当前为 ${data.brief.stakes.toUpperCase()} 风险测评。规则检查已通过，但仍需要人工审核全部题目后才可发布。</div><button class="primary-button" data-go="review"><span>前往题目审核</span><b>→</b></button></div>`);
    if (state.report) return void (els.examShell.innerHTML = `<div class="panel exam-intro"><span class="eyebrow">COMPLETED</span><h1>本次试答已完成</h1><p>报告已基于 ${state.report.answered} 条作答证据生成。</p><button class="primary-button" data-go="report"><span>查看诊断报告</span><b>→</b></button></div>`);
    if (state.questionIndex === 0 && Object.keys(state.answers).length === 0) return renderExamIntro();
    renderQuestion();
  }

  function renderExamIntro() {
    const data = state.package;
    els.examShell.innerHTML = `<div class="panel exam-intro"><span class="eyebrow">LEARNER PREVIEW</span><h1>${escapeHtml(data.meta.title)}</h1><p>面向 ${escapeHtml(data.brief.audience)} 的${Core.PURPOSE_LABELS[data.brief.purpose] || "学习检测"}。</p><div class="exam-meta"><div><strong>${data.items.length}</strong><span>道单选题</span></div><div><strong>${data.brief.total_points}</strong><span>总分</span></div><div><strong>${data.brief.duration_minutes}</strong><span>预计分钟</span></div></div><div class="exam-rules"><b>作答说明</b><br>每个核心知识点包含 2 条独立证据。提交后显示知识点诊断；报告不使用“会 / 不会”的绝对标签。演示模式不采集姓名。</div><button class="primary-button" id="startExamButton"><span>开始试答</span><b>→</b></button></div>`;
    $("#startExamButton").addEventListener("click", () => { state.questionIndex = 0; renderQuestion(); });
  }

  function renderQuestion() {
    const data = state.package;
    const item = data.items[state.questionIndex];
    const selected = state.answers[item.id];
    els.examShell.innerHTML = `<div class="panel exam-question"><div class="exam-progress"><span>QUESTION ${String(state.questionIndex + 1).padStart(2, "0")} / ${String(data.items.length).padStart(2, "0")}</span><span>${item.difficulty_estimated.toUpperCase()} · ${item.bloom_level.toUpperCase()}</span></div><div class="progress-track"><i style="width:${((state.questionIndex + 1) / data.items.length) * 100}%"></i></div><span class="question-label">${escapeHtml(data.knowledge_points.find((point) => point.id === item.knowledge_ids[0]).name)}</span><h2>${escapeHtml(item.stem)}</h2><div class="exam-options">${item.options.map((option) => `<button class="option-button ${selected === option.id ? "selected" : ""}" data-answer="${option.id}"><span class="option-letter">${option.id}</span><span>${escapeHtml(option.text)}</span></button>`).join("")}</div><div class="exam-nav"><span class="answered-hint">${selected ? "已记录本题作答" : "请选择最符合材料的选项"}</span><button class="primary-button compact" id="nextQuestionButton" ${selected ? "" : "disabled"}>${state.questionIndex === data.items.length - 1 ? "提交检测" : "下一题 →"}</button></div></div>`;
    $$(".option-button").forEach((button) => button.addEventListener("click", () => {
      state.answers[item.id] = button.dataset.answer;
      save();
      renderQuestion();
    }));
    $("#nextQuestionButton").addEventListener("click", () => {
      if (!state.answers[item.id]) return;
      if (state.questionIndex < data.items.length - 1) { state.questionIndex += 1; renderQuestion(); }
      else finishExam();
    });
  }

  function finishExam() {
    state.report = Core.diagnose(state.package, state.answers);
    save();
    setPipeline(6);
    renderReport();
    toast("诊断报告已生成：结论仅基于本次作答证据");
    showView("report");
  }

  function renderReport() {
    if (!state.report || !state.package) return void (els.reportContent.innerHTML = '<div class="panel empty-state">完成一次学员试答后，这里会生成知识点证据报告。</div>');
    const report = state.report;
    const demonstrated = report.details.filter((item) => item.status === "demonstrated").length;
    els.reportContent.innerHTML = `<section class="panel report-hero"><div class="score-block"><strong>${report.accuracy}%</strong><span>本次作答正确率</span><p>${report.correct}/${report.total} 题正确 · ${report.answered} 条证据</p></div><div class="report-copy"><span class="step-label">EVIDENCE SUMMARY</span><h2>${demonstrated ? `已有 ${demonstrated} 个知识点形成一致证据` : "当前还没有知识点形成充分的一致证据"}</h2><p>这不是能力定论。系统同时考虑证据数量与一致性；后续应通过换情境、撤脚手架的迁移再测继续验证。</p><div class="legend"><span><i style="background:#55a06f"></i>已展现</span><span><i style="background:#e7a548"></i>发展中</span><span><i style="background:#adb4ae"></i>证据不足</span></div></div></section><section class="diagnosis-grid">${report.details.map((item) => `<article class="panel diagnosis-card"><header><h3>${escapeHtml(item.name)}</h3><span class="diag-status ${item.status}">${item.status.replace("_", " ")}</span></header><div class="evidence-dots">${Array.from({ length: item.item_count }, (_, index) => `<i class="${index < item.correct_count ? "hit" : index < item.evidence_count ? "miss" : ""}"></i>`).join("")}</div><p><b>${item.correct_count}/${item.evidence_count} 条作答证据支持</b><br>${escapeHtml(item.suggestion)}</p></article>`).join("")}</section>`;
  }

  function retry() {
    if (!state.package) return showView("studio");
    state.answers = {}; state.report = null; state.questionIndex = 0; save(); renderExam(); showView("exam");
  }

  function exportJson() {
    if (!state.package) return toast("请先生成检测方案");
    const blob = new Blob([JSON.stringify(state.package, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "zhice-assessment-package.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Assessment Package 已导出");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  restore();
  updateSourceCheck();
  if (state.package) { renderReview(); renderExam(); els.reviewCount.textContent = state.package.items.filter((item) => item.review_status !== "approved").length; }
  if (state.report) renderReport();
  $$(".nav-link").forEach((link) => link.addEventListener("click", () => showView(link.dataset.view)));
  document.addEventListener("click", (event) => { const target = event.target.closest("[data-go]"); if (target) showView(target.dataset.go); });
  els.source.addEventListener("input", () => { updateSourceCheck(); save(); });
  $("#loadSampleButton").addEventListener("click", () => { els.source.value = Core.DEFAULT_SOURCE; updateSourceCheck(); toast("已恢复可直接体验的示例材料"); });
  $("#generateButton").addEventListener("click", generate);
  $("#approveAllButton").addEventListener("click", approveAll);
  $("#exportButton").addEventListener("click", exportJson);
  $("#retryButton").addEventListener("click", retry);
})();
