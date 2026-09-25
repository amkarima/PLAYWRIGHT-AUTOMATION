interface AxeNode {
  target: string[];
  html: string;
  failureSummary?: string;
  screenshot?: string;
  impact?: string | null;
}

interface AxeRule {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  tags?: string[];
  nodes: AxeNode[];
}

interface AxeReport {
  url: string;
  timestamp: string;
  pageName?: string;
  fullPageScreenshot?: string;
  violations: AxeRule[];
  passes: AxeRule[];
  incomplete?: AxeRule[];
  inapplicable?: AxeRule[];
}

export interface HtmlExportData {
  name: string;
  standard: string;
  date: string;
  report: AxeReport;
  resolveScreenshot: (screenshot: string | undefined, pageName: string | undefined) => string | null;
}

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const impactLabel = (impact: string | null | undefined): string => {
  const labels: Record<string, string> = { critical: 'Critique', serious: 'Sérieux', moderate: 'Modéré', minor: 'Mineur' };
  return labels[impact || 'minor'] || 'Mineur';
};

const impactColor = (impact: string | null | undefined): string => {
  const colors: Record<string, string> = {
    critical: '#dc2626',
    serious: '#ea580c',
    moderate: '#d97706',
    minor: '#2563eb',
  };
  return colors[impact || 'minor'] || '#2563eb';
};

const renderRule = (
  rule: AxeRule,
  index: number,
  variant: 'violation' | 'pass',
  resolveScreenshot: (s: string | undefined, p: string | undefined) => string | null,
  pageName?: string
): string => {
  const isViolation = variant === 'violation';
  const borderColor = isViolation ? impactColor(rule.impact) : '#16a34a';
  const bgColor = isViolation ? '#fef2f2' : '#f0fdf4';
  const icon = isViolation ? '✕' : '✓';
  const nodeCount = rule.nodes?.length || 0;
  const wcagTags = (rule.tags || []).filter(t => t.startsWith('wcag')).slice(0, 4);

  const nodesHtml = (rule.nodes || []).map((node, idx) => {
    const screenshotUrl = resolveScreenshot(node.screenshot, pageName);
    return `
      <div class="node">
        <div class="node-header">#${idx + 1}${node.impact && isViolation ? ` <span class="badge" style="background:${impactColor(node.impact)}1a;color:${impactColor(node.impact)}">${impactLabel(node.impact)}</span>` : ''}</div>
        <div class="node-section"><span class="label">Sélecteur cible :</span><pre class="selector">${escapeHtml(node.target.join(' → '))}</pre></div>
        ${node.html ? `<div class="node-section"><span class="label">HTML :</span><pre class="html-snippet">${escapeHtml(node.html)}</pre></div>` : ''}
        ${node.failureSummary ? `<div class="node-section"><span class="label">Détail des échecs :</span><p class="failure">${escapeHtml(node.failureSummary)}</p></div>` : ''}
        ${screenshotUrl ? `<div class="node-section"><span class="label">Capture d'écran :</span><img src="${escapeHtml(screenshotUrl)}" alt="Capture ${escapeHtml(rule.id)} #${idx + 1}" class="screenshot" /></div>` : ''}
      </div>`;
  }).join('');

  return `
    <div class="rule-card" style="border-color:${borderColor}40;background:${bgColor}">
      <div class="rule-header">
        <span class="rule-icon" style="color:${borderColor}">${icon}</span>
        <div class="rule-title">
          <h3>${escapeHtml(rule.id)}</h3>
          ${isViolation && rule.impact ? `<span class="badge" style="background:${impactColor(rule.impact)}1a;color:${impactColor(rule.impact)}">${impactLabel(rule.impact)}</span>` : ''}
          <span class="node-count">${nodeCount} élément${nodeCount > 1 ? 's' : ''}</span>
        </div>
      </div>
      <p class="rule-help">${escapeHtml(rule.help)}</p>
      ${wcagTags.length > 0 ? `<div class="tags">${wcagTags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      <p class="rule-desc">${escapeHtml(rule.description)}</p>
      <a href="${escapeHtml(rule.helpUrl)}" target="_blank" rel="noopener noreferrer" class="doc-link">Documentation axe-core →</a>
      ${nodesHtml}
    </div>`;
};

export const generateHtmlReport = (data: HtmlExportData): string => {
  const { name, standard, date, report, resolveScreenshot } = data;
  const violations = report.violations || [];
  const passes = report.passes || [];
  const violationNodes = violations.reduce((s, r) => s + (r.nodes?.length || 0), 0);
  const passNodes = passes.reduce((s, r) => s + (r.nodes?.length || 0), 0);
  const totalRules = violations.length + passes.length;
  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  violations.forEach(v => {
    const key = (v.impact || 'minor') as keyof typeof byImpact;
    if (key in byImpact) byImpact[key]++;
  });

  const fullPageUrl = resolveScreenshot(report.fullPageScreenshot, report.pageName);

  const violationsHtml = violations.map((r, i) => renderRule(r, i, 'violation', resolveScreenshot, report.pageName)).join('');
  const passesHtml = passes.slice(0, 20).map((r, i) => renderRule(r, i, 'pass', resolveScreenshot, report.pageName)).join('');
  const passesOverflow = passes.length > 20 ? `<p class="overflow-note">+ ${passes.length - 20} autres règles réussies</p>` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rapport d'accessibilité — ${escapeHtml(name)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #111827; line-height: 1.6; }
  .container { max-width: 900px; margin: 0 auto; padding: 24px; }
  .header { background: linear-gradient(135deg, #1f2937, #111827); color: #fff; border-radius: 16px; padding: 28px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  .header-meta { display: flex; gap: 20px; flex-wrap: wrap; font-size: 14px; color: #d1d5db; }
  .header-meta a { color: #93c5fd; text-decoration: underline; }
  .standard-badge { display: inline-block; background: rgba(255,255,255,0.15); padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 10px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { border-radius: 12px; padding: 16px; border: 1px solid #e5e7eb; }
  .stat-card .stat-label { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
  .stat-card .stat-value { font-size: 28px; font-weight: 700; }
  .stat-card .stat-sub { font-size: 12px; margin-top: 2px; }
  .stat-violations { background: #fef2f2; border-color: #fecaca; } .stat-violations .stat-label, .stat-violations .stat-value, .stat-violations .stat-sub { color: #b91c1c; }
  .stat-passes { background: #f0fdf4; border-color: #bbf7d0; } .stat-passes .stat-label, .stat-passes .stat-value, .stat-passes .stat-sub { color: #15803d; }
  .stat-rules { background: #eff6ff; border-color: #bfdbfe; } .stat-rules .stat-label, .stat-rules .stat-value, .stat-rules .stat-sub { color: #1d4ed8; }
  .stat-critical { background: #fffbeb; border-color: #fde68a; } .stat-critical .stat-label, .stat-critical .stat-value, .stat-critical .stat-sub { color: #b45309; }
  .impact-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
  .impact-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid; }
  .screenshot-section { margin-bottom: 24px; }
  .screenshot-section .label { font-size: 13px; font-weight: 600; color: #6b7280; margin-bottom: 8px; display: block; }
  .screenshot-section img { width: 100%; border-radius: 12px; border: 1px solid #e5e7eb; }
  .section-title { font-size: 18px; font-weight: 700; margin: 28px 0 14px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
  .rule-card { border: 1px solid; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
  .rule-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 6px; }
  .rule-icon { font-size: 20px; font-weight: 700; flex-shrink: 0; }
  .rule-title { flex: 1; }
  .rule-title h3 { font-size: 15px; font-weight: 700; display: inline; }
  .rule-title .badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; font-weight: 600; margin-left: 6px; }
  .node-count { font-size: 12px; color: #9ca3af; margin-left: 8px; }
  .rule-help { font-size: 14px; color: #4b5563; margin-bottom: 6px; }
  .tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
  .tag { font-size: 11px; padding: 2px 6px; background: #f3f4f6; color: #6b7280; border-radius: 4px; font-family: monospace; }
  .rule-desc { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  .doc-link { font-size: 12px; color: #2563eb; text-decoration: none; }
  .doc-link:hover { text-decoration: underline; }
  .node { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-top: 12px; }
  .node-header { font-size: 12px; font-weight: 700; color: #9ca3af; margin-bottom: 8px; }
  .node-header .badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; font-weight: 600; margin-left: 6px; }
  .node-section { margin-bottom: 10px; }
  .node-section .label { font-size: 12px; font-weight: 600; color: #6b7280; display: block; margin-bottom: 4px; }
  .selector { background: #111827; color: #4ade80; padding: 8px; border-radius: 6px; font-size: 12px; font-family: monospace; overflow-x: auto; }
  .html-snippet { background: #f3f4f6; color: #374151; padding: 8px; border-radius: 6px; font-size: 12px; font-family: monospace; overflow-x: auto; max-height: 160px; overflow-y: auto; }
  .failure { background: #fffbeb; border: 1px solid #fde68a; padding: 8px; border-radius: 6px; font-size: 12px; color: #4b5563; white-space: pre-line; }
  .screenshot { width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 4px; }
  .overflow-note { text-align: center; font-size: 14px; color: #9ca3af; padding: 12px; }
  .empty-state { text-align: center; padding: 40px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; color: #15803d; }
  .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  @media print { body { background: #fff; } .container { padding: 0; } }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${escapeHtml(name)}</h1>
    <div class="header-meta">
      <span>🌐 <a href="${escapeHtml(report.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(report.url)}</a></span>
      <span>🕐 ${new Date(date).toLocaleString('fr-FR')}</span>
    </div>
    <span class="standard-badge">${escapeHtml(standard.toUpperCase())}</span>
  </div>

  <div class="stats">
    <div class="stat-card stat-violations">
      <div class="stat-label">✕ Violations</div>
      <div class="stat-value">${violations.length}</div>
      <div class="stat-sub">${violationNodes} éléments</div>
    </div>
    <div class="stat-card stat-passes">
      <div class="stat-label">✓ Réussis</div>
      <div class="stat-value">${passes.length}</div>
      <div class="stat-sub">${passNodes} éléments</div>
    </div>
    <div class="stat-card stat-rules">
      <div class="stat-label">🛡 Règles</div>
      <div class="stat-value">${totalRules}</div>
      <div class="stat-sub">évaluées</div>
    </div>
    <div class="stat-card stat-critical">
      <div class="stat-label">⚠ Critique/Sérieux</div>
      <div class="stat-value">${byImpact.critical + byImpact.serious}</div>
      <div class="stat-sub">à corriger</div>
    </div>
  </div>

  <div class="impact-bar">
    ${Object.entries(byImpact).filter(([, c]) => c > 0).map(([key, count]) =>
      `<span class="impact-chip" style="background:${impactColor(key)}1a;color:${impactColor(key)};border-color:${impactColor(key)}40">${impactLabel(key)} : ${count}</span>`
    ).join('')}
  </div>

  ${fullPageUrl ? `<div class="screenshot-section"><span class="label">Capture pleine page :</span><img src="${escapeHtml(fullPageUrl)}" alt="Capture pleine page" /></div>` : ''}

  ${violations.length > 0 ? `<h2 class="section-title">Violations (${violations.length})</h2>${violationsHtml}` : '<div class="empty-state"><p>Aucune violation détectée</p><p style="font-size:14px;margin-top:6px">Toutes les règles évaluées sont conformes.</p></div>'}

  ${passes.length > 0 ? `<h2 class="section-title">Réussis (${passes.length})</h2>${passesHtml}${passesOverflow}` : ''}

  <div class="footer">Rapport généré le ${new Date().toLocaleString('fr-FR')} — Tests d'accessibilité axe-core</div>
</div>
</body>
</html>`;
};

export const downloadHtmlReport = (data: HtmlExportData): void => {
  const html = generateHtmlReport(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rapport-accessibilite-${data.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
