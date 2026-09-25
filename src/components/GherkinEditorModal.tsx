import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, FileCode2, ChevronDown, ChevronUp, Languages } from 'lucide-react';

type Language = 'en' | 'fr';

interface GherkinStep {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
}

interface GherkinScenario {
  type: 'Scenario' | 'Scenario Outline';
  name: string;
  steps: GherkinStep[];
  examples: string;
}

interface GherkinEditorModalProps {
  initialScript: string;
  testName: string;
  onSave: (script: string) => void;
  onClose: () => void;
}

const STEP_KEYWORDS: GherkinStep['keyword'][] = ['Given', 'When', 'Then', 'And', 'But'];

const FR_STEP_KEYWORDS: Record<GherkinStep['keyword'], string> = {
  Given: 'Soit',
  When: 'Quand',
  Then: 'Alors',
  And: 'Et',
  But: 'Mais',
};

const FR_STRUCT_KEYWORDS: Record<string, string> = {
  'Feature': 'Fonctionnalité',
  'Background': 'Contexte',
  'Scenario': 'Scénario',
  'Scenario Outline': 'Plan de scénario',
  'Examples': 'Exemples',
};

const FR_TYPE_LABELS: Record<string, string> = {
  'Scenario': 'Scénario',
  'Scenario Outline': 'Plan de scénario',
};

const STEP_ALIASES: Record<string, GherkinStep['keyword']> = {
  'given': 'Given', 'soit': 'Given',
  'étant donné': 'Given', 'etant donné': 'Given',
  'when': 'When', 'quand': 'When', 'lorsque': 'When',
  'then': 'Then', 'alors': 'Then',
  'and': 'And', 'et': 'And',
  'but': 'But', 'mais': 'But',
};

const STEP_ALIAS_KEYS = Object.keys(STEP_ALIASES).sort((a, b) => b.length - a.length);

const STRUCT_ALIASES: Record<string, string> = {
  'feature:': 'feature', 'fonctionnalité:': 'feature',
  'background:': 'background', 'contexte:': 'background',
  'scenario:': 'scenario', 'scénario:': 'scenario', 'exemple:': 'scenario',
  'scenario outline:': 'scenario_outline',
  'plan de scénario:': 'scenario_outline',
  'plan du scénario:': 'scenario_outline',
  'examples:': 'examples', 'exemples:': 'examples',
};

const GHERKIN_KEYWORDS_ALL = [
  'Feature', 'Fonctionnalité',
  'Background', 'Contexte',
  'Scenario', 'Scénario', 'Scenario Outline', 'Plan de scénario', 'Plan du scénario',
  'Examples', 'Exemples',
  'Given', 'Soit', 'Étant donné', 'Etant donné',
  'When', 'Quand', 'Lorsque',
  'Then', 'Alors',
  'And', 'Et',
  'But', 'Mais',
];

const highlightGherkin = (text: string): string => {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text.split('\n').map(line => {
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;
    const lower = trimmed.toLowerCase();

    // Comments
    if (trimmed.startsWith('#')) {
      return ' '.repeat(indent) + `<span style="color:#94a3b8;font-style:italic">${esc(trimmed)}</span>`;
    }

    // Doc strings
    if (trimmed.startsWith('"""')) {
      return ' '.repeat(indent) + `<span style="color:#a78bfa;font-weight:600">${esc(trimmed)}</span>`;
    }

    // Table rows
    if (trimmed.startsWith('|')) {
      return ' '.repeat(indent) + `<span style="color:#64748b">${esc(trimmed)}</span>`;
    }

    // Structural keywords (Feature, Scenario, Background, Examples)
    const structMatch = GHERKIN_KEYWORDS_ALL.find(kw => {
      const kwLower = kw.toLowerCase() + ':';
      return lower.startsWith(kwLower) || lower.startsWith(kw.toLowerCase() + ' ');
    });
    if (structMatch && (structMatch === 'Feature' || structMatch === 'Fonctionnalité' ||
        structMatch === 'Background' || structMatch === 'Contexte' ||
        structMatch === 'Scenario' || structMatch === 'Scénario' ||
        structMatch === 'Scenario Outline' || structMatch === 'Plan de scénario' ||
        structMatch === 'Plan du scénario' || structMatch === 'Examples' ||
        structMatch === 'Exemples')) {
      const after = trimmed.substring(structMatch.length);
      const colorMap: Record<string, string> = {
        'Feature': '#7c3aed', 'Fonctionnalité': '#7c3aed',
        'Background': '#0891b2', 'Contexte': '#0891b2',
        'Scenario': '#2563eb', 'Scénario': '#2563eb',
        'Scenario Outline': '#2563eb', 'Plan de scénario': '#2563eb', 'Plan du scénario': '#2563eb',
        'Examples': '#c026d3', 'Exemples': '#c026d3',
      };
      const color = colorMap[structMatch] || '#2563eb';
      return ' '.repeat(indent) + `<span style="color:${color};font-weight:700">${esc(structMatch)}</span>` + esc(after);
    }

    // Step keywords (Given, When, Then, And, But + French variants)
    const stepMatch = GHERKIN_KEYWORDS_ALL.find(kw => {
      if (kw === 'Feature' || kw === 'Fonctionnalité' || kw === 'Background' || kw === 'Contexte' ||
          kw === 'Scenario' || kw === 'Scénario' || kw === 'Scenario Outline' || kw === 'Plan de scénario' ||
          kw === 'Plan du scénario' || kw === 'Examples' || kw === 'Exemples') return false;
      return lower.startsWith(kw.toLowerCase() + ' ') || lower === kw.toLowerCase();
    });
    if (stepMatch) {
      const rest = trimmed.substring(stepMatch.length);
      const stepColors: Record<string, string> = {
        'Given': '#1d4ed8', 'Soit': '#1d4ed8', 'Étant donné': '#1d4ed8', 'Etant donné': '#1d4ed8',
        'When': '#d97706', 'Quand': '#d97706', 'Lorsque': '#d97706',
        'Then': '#16a34a', 'Alors': '#16a34a',
        'And': '#64748b', 'Et': '#64748b',
        'But': '#dc2626', 'Mais': '#dc2626',
      };
      const color = stepColors[stepMatch] || '#64748b';
      return ' '.repeat(indent) + `<span style="color:${color};font-weight:700">${esc(stepMatch)}</span>` + esc(rest);
    }

    return esc(line);
  }).join('\n');
};

const detectLanguage = (script: string): Language => {
  for (const line of script.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^#\s*language:\s*(\w+)/i);
    if (m) return m[1].toLowerCase().startsWith('fr') ? 'fr' : 'en';
    if (trimmed.match(/^#/) || trimmed.startsWith('"""')) continue;
    return 'en';
  }
  return 'en';
};

const parseGherkin = (script: string): {
  featureName: string;
  scenarios: GherkinScenario[];
  background: GherkinStep[];
  language: Language;
} => {
  const language = detectLanguage(script);
  const filtered: string[] = [];
  for (const l of script.split('\n').map(l => l.trim())) {
    if (!l) continue;
    if (l.match(/^#\s*language:/i)) continue;
    if (l.match(/^#/)) continue;
    filtered.push(l);
  }

  let featureName = '';
  const scenarios: GherkinScenario[] = [];
  const background: GherkinStep[] = [];
  let currentScenario: GherkinScenario | null = null;
  let currentSteps: GherkinStep[] | null = null;
  let inExamples = false;
  let examplesLines: string[] = [];

  for (const line of filtered) {
    const lower = line.toLowerCase();

    const structMatch = Object.entries(STRUCT_ALIASES).find(([k]) => lower.startsWith(k));
    if (structMatch) {
      const kind = structMatch[1];
      if (kind === 'feature') {
        featureName = line.substring(line.indexOf(':') + 1).trim();
        continue;
      }
      if (kind === 'background') {
        currentScenario = null;
        currentSteps = background;
        inExamples = false;
        continue;
      }
      if (kind === 'scenario' || kind === 'scenario_outline') {
        if (currentScenario && inExamples) {
          currentScenario.examples = examplesLines.join('\n');
          examplesLines = [];
        }
        inExamples = false;
        currentScenario = {
          type: kind === 'scenario_outline' ? 'Scenario Outline' : 'Scenario',
          name: line.substring(line.indexOf(':') + 1).trim(),
          steps: [],
          examples: '',
        };
        scenarios.push(currentScenario);
        currentSteps = currentScenario.steps;
        continue;
      }
      if (kind === 'examples') {
        inExamples = true;
        examplesLines = [];
        continue;
      }
    }

    if (inExamples && line.startsWith('|')) {
      examplesLines.push(line);
      continue;
    }

    const kwAlias = STEP_ALIAS_KEYS.find(k => lower.startsWith(k));
    if (kwAlias && currentSteps !== null) {
      const matchedKeyword = STEP_ALIASES[kwAlias];
      const rest = line.substring(kwAlias.length).trim();
      currentSteps.push({ keyword: matchedKeyword, text: rest });
    }
  }

  if (currentScenario && inExamples) {
    currentScenario.examples = examplesLines.join('\n');
  }

  return { featureName, scenarios, background, language };
};

const serializeGherkin = (
  featureName: string,
  scenarios: GherkinScenario[],
  background: GherkinStep[],
  language: Language,
): string => {
  const kw = (en: string): string => language === 'fr' ? (FR_STRUCT_KEYWORDS[en] ?? en) : en;
  const stepKw = (en: GherkinStep['keyword']): string => language === 'fr' ? FR_STEP_KEYWORDS[en] : en;

  const parts: string[] = [];

  if (language === 'fr') {
    parts.push('# language: fr');
    parts.push('');
  }

  if (featureName) {
    parts.push(`${kw('Feature')}: ${featureName}`);
    parts.push('');
  }

  if (background.length > 0) {
    parts.push(`${kw('Background')}:`);
    for (const step of background) {
      parts.push(`  ${stepKw(step.keyword)} ${step.text}`);
    }
    parts.push('');
  }

  for (const scenario of scenarios) {
    parts.push(`${kw(scenario.type)}: ${scenario.name}`);
    for (const step of scenario.steps) {
      parts.push(`  ${stepKw(step.keyword)} ${step.text}`);
    }
    if (scenario.examples) {
      parts.push(`  ${kw('Examples')}:`);
      scenario.examples.split('\n').forEach(line => {
        if (line.trim()) parts.push(`    ${line.trim()}`);
      });
    }
    parts.push('');
  }

  return parts.join('\n').trim();
};

const GherkinEditorModal: React.FC<GherkinEditorModalProps> = ({ initialScript, testName, onSave, onClose }) => {
  const [mode, setMode] = useState<'visual' | 'text'>('visual');
  const [featureName, setFeatureName] = useState('');
  const [scenarios, setScenarios] = useState<GherkinScenario[]>([]);
  const [background, setBackground] = useState<GherkinStep[]>([]);
  const [textScript, setTextScript] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [expandedScenarios, setExpandedScenarios] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (initialScript && initialScript.trim()) {
      const parsed = parseGherkin(initialScript);
      setLanguage(parsed.language);
      setFeatureName(parsed.featureName || testName);
      setScenarios(parsed.scenarios.length > 0 ? parsed.scenarios : [{ type: 'Scenario', name: '', steps: [], examples: '' }]);
      setBackground(parsed.background);
      setTextScript(initialScript);
    } else {
      setLanguage('fr');
      setFeatureName(testName);
      setScenarios([{ type: 'Scenario', name: '', steps: [{ keyword: 'Given', text: '' }], examples: '' }]);
      setTextScript(`# language: fr\nFeature: ${testName}\n  Scénario: \n    Soit \n`);
    }
  }, [initialScript, testName]);

  const toggleScenario = (idx: number) => {
    setExpandedScenarios(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const updateStep = (scenarioIdx: number, stepIdx: number, field: keyof GherkinStep, value: string) => {
    setScenarios(prev => prev.map((s, si) => {
      if (si !== scenarioIdx) return s;
      return {
        ...s,
        steps: s.steps.map((step, sti) => {
          if (sti !== stepIdx) return step;
          return { ...step, [field]: value } as GherkinStep;
        }),
      };
    }));
  };

  const updateBackgroundStep = (stepIdx: number, field: keyof GherkinStep, value: string) => {
    setBackground(prev => prev.map((step, sti) => {
      if (sti !== stepIdx) return step;
      return { ...step, [field]: value } as GherkinStep;
    }));
  };

  const addStep = (scenarioIdx: number) => {
    setScenarios(prev => prev.map((s, si) => {
      if (si !== scenarioIdx) return s;
      const lastStep = s.steps[s.steps.length - 1];
      const defaultKeyword: GherkinStep['keyword'] = lastStep && lastStep.keyword !== 'Then' ? 'And' : 'Given';
      return { ...s, steps: [...s.steps, { keyword: defaultKeyword, text: '' }] };
    }));
  };

  const addBackgroundStep = () => {
    const lastStep = background[background.length - 1];
    const defaultKeyword: GherkinStep['keyword'] = lastStep ? 'And' : 'Given';
    setBackground([...background, { keyword: defaultKeyword, text: '' }]);
  };

  const removeStep = (scenarioIdx: number, stepIdx: number) => {
    setScenarios(prev => prev.map((s, si) => {
      if (si !== scenarioIdx) return s;
      return { ...s, steps: s.steps.filter((_, sti) => sti !== stepIdx) };
    }));
  };

  const removeBackgroundStep = (stepIdx: number) => {
    setBackground(prev => prev.filter((_, sti) => sti !== stepIdx));
  };

  const addScenario = () => {
    setScenarios(prev => [...prev, { type: 'Scenario', name: '', steps: [{ keyword: 'Given', text: '' }], examples: '' }]);
    setExpandedScenarios(prev => new Set([...prev, prev.size]));
  };

  const removeScenario = (idx: number) => {
    if (scenarios.length <= 1) return;
    setScenarios(prev => prev.filter((_, si) => si !== idx));
  };

  const updateScenarioName = (idx: number, name: string) => {
    setScenarios(prev => prev.map((s, si) => si === idx ? { ...s, name } : s));
  };

  const updateScenarioType = (idx: number, type: 'Scenario' | 'Scenario Outline') => {
    setScenarios(prev => prev.map((s, si) => si === idx ? { ...s, type } : s));
  };

  const updateExamples = (idx: number, examples: string) => {
    setScenarios(prev => prev.map((s, si) => si === idx ? { ...s, examples } : s));
  };

  const switchToText = () => {
    setTextScript(serializeGherkin(featureName, scenarios, background, language));
    setMode('text');
  };

  const switchToVisual = () => {
    const parsed = parseGherkin(textScript);
    setLanguage(parsed.language);
    setFeatureName(parsed.featureName || testName);
    setScenarios(parsed.scenarios.length > 0 ? parsed.scenarios : [{ type: 'Scenario', name: '', steps: [], examples: '' }]);
    setBackground(parsed.background);
    setMode('visual');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fr' ? 'en' : 'fr');
  };

  const handleSave = () => {
    if (mode === 'text') {
      onSave(textScript.trim());
    } else {
      onSave(serializeGherkin(featureName, scenarios, background, language));
    }
  };

  const stepColor = (keyword: GherkinStep['keyword']): string => {
    switch (keyword) {
      case 'Given': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'When': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Then': return 'text-green-700 bg-green-50 border-green-200';
      case 'And': return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'But': return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const keywordLabel = (kw: GherkinStep['keyword']): string =>
    language === 'fr' ? FR_STEP_KEYWORDS[kw] : kw;

  const typeLabel = (type: string): string =>
    language === 'fr' ? (FR_TYPE_LABELS[type] ?? type) : type;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileCode2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Script de test Gherkin</h2>
              <p className="text-sm text-slate-500">{testName || 'Nouveau test'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode toggle + Language toggle */}
        <div className="flex items-center justify-between px-6 pt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => mode !== 'visual' && switchToVisual()}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${mode === 'visual' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Édition visuelle
            </button>
            <button
              onClick={() => mode !== 'text' && switchToText()}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${mode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Édition texte
            </button>
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Changer la langue du script Gherkin"
          >
            <Languages className="w-4 h-4" />
            <span>{language === 'fr' ? 'FR' : 'EN'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === 'visual' ? (
            <div className="space-y-5">
              {language === 'fr' && (
                <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-mono">
                  # language: fr
                </div>
              )}

              {/* Feature name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {language === 'fr' ? 'Fonctionnalité' : 'Feature'}
                </label>
                <input
                  type="text"
                  value={featureName}
                  onChange={e => setFeatureName(e.target.value)}
                  placeholder={language === 'fr' ? 'Nom de la fonctionnalité testée' : 'Feature name'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Background */}
              {background.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">
                      {language === 'fr' ? 'Contexte (commun à tous les scénarios)' : 'Background (common to all scenarios)'}
                    </p>
                  </div>
                  <div className="p-3 space-y-2">
                    {background.map((step, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <select
                          value={step.keyword}
                          onChange={e => updateBackgroundStep(si, 'keyword', e.target.value)}
                          className={`px-2 py-1.5 text-xs font-bold rounded-lg border ${stepColor(step.keyword)} focus:outline-none`}
                        >
                          {STEP_KEYWORDS.map(k => <option key={k} value={k}>{keywordLabel(k)}</option>)}
                        </select>
                        <input
                          type="text"
                          value={step.text}
                          onChange={e => updateBackgroundStep(si, 'text', e.target.value)}
                          placeholder={language === 'fr' ? "Description de l'étape" : 'Step description'}
                          className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <button onClick={() => removeBackgroundStep(si)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={addBackgroundStep} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mt-1">
                      <Plus className="w-3.5 h-3.5" /> {language === 'fr' ? 'Ajouter une étape' : 'Add step'}
                    </button>
                  </div>
                </div>
              )}

              {/* Scenarios */}
              {scenarios.map((scenario, si) => {
                const isExpanded = expandedScenarios.has(si);
                return (
                  <div key={si} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                      <button onClick={() => toggleScenario(si)} className="flex items-center gap-2 flex-1 text-left">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        <select
                          value={scenario.type}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateScenarioType(si, e.target.value as 'Scenario' | 'Scenario Outline')}
                          className="px-2 py-0.5 text-xs font-bold rounded border border-slate-200 bg-white focus:outline-none"
                        >
                          <option value="Scenario">{typeLabel('Scenario')}</option>
                          <option value="Scenario Outline">{typeLabel('Scenario Outline')}</option>
                        </select>
                        <span className="text-sm font-semibold text-slate-700 truncate">
                          {scenario.name || (language === 'fr' ? '(sans nom)' : '(unnamed)')}
                        </span>
                      </button>
                      <button onClick={() => removeScenario(si)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="p-3 space-y-3">
                        <input
                          type="text"
                          value={scenario.name}
                          onChange={e => updateScenarioName(si, e.target.value)}
                          placeholder={language === 'fr' ? 'Nom du scénario' : 'Scenario name'}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                        />

                        <div className="space-y-2">
                          {scenario.steps.map((step, sti) => (
                            <div key={sti} className="flex items-center gap-2">
                              <select
                                value={step.keyword}
                                onChange={e => updateStep(si, sti, 'keyword', e.target.value)}
                                className={`px-2 py-1.5 text-xs font-bold rounded-lg border ${stepColor(step.keyword)} focus:outline-none`}
                              >
                                {STEP_KEYWORDS.map(k => <option key={k} value={k}>{keywordLabel(k)}</option>)}
                              </select>
                              <input
                                type="text"
                                value={step.text}
                                onChange={e => updateStep(si, sti, 'text', e.target.value)}
                                placeholder={language === 'fr' ? "Description de l'étape" : 'Step description'}
                                className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                              <button onClick={() => removeStep(si, sti)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addStep(si)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> {language === 'fr' ? 'Ajouter une étape' : 'Add step'}
                          </button>
                        </div>

                        {scenario.type === 'Scenario Outline' && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              {language === 'fr' ? 'Exemples (tableaux Gherkin)' : 'Examples (Gherkin tables)'}
                            </label>
                            <textarea
                              value={scenario.examples}
                              onChange={e => updateExamples(si, e.target.value)}
                              placeholder="| colonne1 | colonne2 |&#10;| valeur1 | valeur2 |"
                              rows={4}
                              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={addScenario}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> {language === 'fr' ? 'Ajouter un scénario' : 'Add scenario'}
              </button>

              {background.length === 0 && (
                <button onClick={addBackgroundStep} className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> {language === 'fr' ? 'Ajouter un Contexte (étapes communes)' : 'Add Background (common steps)'}
                </button>
              )}
            </div>
          ) : (
            <div>
              <div
                className="relative w-full rounded-lg border border-slate-300 bg-slate-50 focus-within:ring-2 focus-within:ring-sky-300 focus-within:border-sky-500 transition-colors overflow-hidden"
                style={{ height: '560px' }}
              >
                <pre
                  className="gherkin-highlight absolute inset-0 overflow-y-auto pointer-events-none"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: highlightGherkin(textScript) + '\n' }}
                />
                <textarea
                  value={textScript}
                  onChange={e => setTextScript(e.target.value)}
                  className="gherkin-textarea focus:outline-none"
                  spellCheck={false}
                  placeholder="# language: fr&#10;Fonctionnalité: Ma fonctionnalité&#10;&#10;  Scénario: Mon scénario&#10;    Soit un prérequis&#10;    Quand une action&#10;    Alors un résultat attendu"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Mode texte brut — syntaxe Gherkin. Utilisez <code className="font-mono">{'# language: fr'}</code> en première ligne pour les mots-clés français (Soit, Quand, Alors, Et, Mais, Fonctionnalité, Scénario, Plan de scénario, Exemples).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GherkinEditorModal;