const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Core = require('../docs/core.js');

const analysis = Core.analyzeSource(Core.DEFAULT_SOURCE);
assert.equal(analysis.sufficient, true, '示例材料应通过充分性检查');
assert.equal(analysis.sections.length, 3, '应识别三个知识主题');
assert.ok(analysis.sentenceCount >= 6, '应识别至少六条陈述');
assert.equal(Core.analyzeSource('内容很短。').sufficient, false, '短素材必须被拦截');

assert.throws(() => Core.createAssessment({}, '内容很短。'), /SOURCE_GAP/, '不足素材不得强行出题');
const assessment = Core.createAssessment({
  title: '自动化测试测评', purpose: 'formative', stakes: 'medium',
  audience: '测试学习者', duration: 10, sourceName: '自动化测试材料'
}, Core.DEFAULT_SOURCE);

assert.equal(assessment.meta.status, 'teacher_review');
assert.equal(assessment.items.length, 6, '每个知识点应生成两条证据');
assert.equal(assessment.knowledge_points.length, 3);
assert.equal(assessment.blueprint.targets.length, 3);
assert.equal(assessment.brief.total_points, 12);
assert.equal(assessment.quality.hard_failures.length, 0);
assert.equal(new Set(assessment.items.map((item) => item.id)).size, 6, '题目 ID 不得重复');
assert.ok(assessment.items.every((item) => item.options.length === 4), '每题必须四个选项');
assert.ok(assessment.items.every((item) => item.options.some((option) => option.id === item.answer)), '答案必须存在于选项');
assert.ok(assessment.items.every((item) => item.source_quote.length >= 12), '每题必须绑定原文依据');
assert.ok(assessment.items.every((item) => item.difficulty_calibrated === null), '无实测数据不得伪造校准难度');
assert.equal(Core.validatePackage(assessment).valid, true, '生成包应通过结构校验');

const broken = JSON.parse(JSON.stringify(assessment));
broken.items[0].answer = 'Z';
assert.equal(Core.validatePackage(broken).valid, false, '非法答案必须被拦截');

const approved = Core.approvePackage(assessment, '测试审核员');
assert.equal(approved.meta.status, 'approved');
assert.ok(approved.items.every((item) => item.review_status === 'approved'));
assert.deepEqual(approved.governance.reviewers, ['测试审核员']);
assert.equal(assessment.meta.status, 'teacher_review', '审核不应原地修改历史版本');

const allCorrect = Object.fromEntries(approved.items.map((item) => [item.id, item.answer]));
const report = Core.diagnose(approved, allCorrect);
assert.equal(report.accuracy, 100);
assert.equal(report.details.length, 3);
assert.ok(report.details.every((item) => item.status === 'demonstrated'), '两条一致证据应标记 demonstrated');

const partial = { [approved.items[0].id]: approved.items[0].answer };
const partialReport = Core.diagnose(approved, partial);
assert.equal(partialReport.details[0].status, 'insufficient_evidence', '仅一条证据不得形成掌握结论');

const wrong = Object.fromEntries(approved.items.map((item) => [item.id, item.options.find((o) => o.id !== item.answer).id]));
const wrongReport = Core.diagnose(approved, wrong);
assert.ok(wrongReport.details.every((item) => item.status === 'developing'), '完整但错误的证据应进入发展中而非永久标签');

const fixture = path.join(__dirname, 'generated-assessment-package.json');
fs.writeFileSync(fixture, JSON.stringify(approved, null, 2));
console.log('OK: 25+ core assertions passed');
