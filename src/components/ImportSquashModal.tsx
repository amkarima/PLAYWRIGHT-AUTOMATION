import React, { useState, useRef, useCallback } from 'react';
import { Upload, File as FileIcon, X, CheckCircle, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import { detectPartnerFromText, type Partner } from '../utils/partnerLogos';

interface ImportedTestRow {
  id: string;
  name: string;
  test_type: string;
  partner: string;
  is_active: boolean;
  is_automated: boolean;
  sort_order: number;
  tags: string[];
  gherkin_script: string;
  tc_path: string;
  status: 'pending' | 'imported' | 'error';
  error?: string;
  selected: boolean;
}

interface ImportSquashModalProps {
  onClose: () => void;
  onImport: (rows: Omit<ImportedTestRow, 'status' | 'error'>[]) => Promise<void>;
  existingIds: string[];
  nextSortOrder: number;
}

const SQUASH_COLUMN_MAP: Record<string, string> = {
  'TC_ID': 'id',
  'TC_NUM': 'id',
  'TC_REFERENCE': 'reference',
  'TC_NAME': 'name',
  'TC_PATH': 'path',
  'TC_TYPE': 'test_type',
  'TC_NATURE': 'nature',
  'TC_STATUS': 'status',
  'TC_AUTOMATABLE': 'automatable',
  'TC_KIND': 'kind',
  'TC_DESCRIPTION': 'description',
  'TC_WEIGHT': 'weight',
  'TC_UUID': 'uuid',
  'TC_SCRIPT': 'gherkin_script',
  'PROJECT_NAME': 'project',
};

const STATUS_VALUES = ['APPROVED', 'WORK_IN_PROGRESS', 'OBSOLETE'];
const AUTOMATABLE_VALUES = ['Y', 'N', 'M'];

function mapSquashRow(row: Record<string, any>): Omit<ImportedTestRow, 'status' | 'error'> | null {
  const tcId = String(row['TC_ID'] ?? row['TC_NUM'] ?? '').trim();
  const tcName = String(row['TC_NAME'] ?? '').trim();
  if (!tcId || !tcName) return null;

  const tcPath = String(row['TC_PATH'] ?? '').trim();
  const tcType = String(row['TC_TYPE'] ?? '').trim();
  const tcStatus = String(row['TC_STATUS'] ?? '').trim().toUpperCase();
  const tcAutomatable = String(row['TC_AUTOMATABLE'] ?? '').trim().toUpperCase();
  const tcKind = String(row['TC_KIND'] ?? '').trim().toUpperCase();
  const tcScript = String(row['TC_SCRIPT'] ?? '').trim();

  // Extract test_type from path: /DBF - WEB/TNR/Circuit Court full web/Amundi → "Circuit Court full web"
  const pathSegments = tcPath.split('/').filter(Boolean);
  const testType = pathSegments.length >= 3
    ? pathSegments[2]
    : (tcType && tcType !== 'TYP_UNDEFINED' ? tcType.replace(/^TYP_/, '').replace(/_/g, ' ') : 'Standard');

  // Partner from test name or path
  const partner = detectPartnerFromText(tcName + ' ' + tcPath) as string;

  // is_automated: Y = yes, N = no, M = maybe (treat as no)
  const isAutomated = tcAutomatable === 'Y' || tcKind === 'GHERKIN';

  // is_active: APPROVED or WORK_IN_PROGRESS = active, OBSOLETE = inactive
  const isActive = tcStatus !== 'OBSOLETE';

  // Tags from nature + type + kind
  const tags: string[] = [];
  const nature = String(row['TC_NATURE'] ?? '').trim();
  if (nature && nature !== 'NAT_UNDEFINED') tags.push(nature.replace(/^NAT_/, '').replace(/_/g, ' '));
  if (tcType && tcType !== 'TYP_UNDEFINED') tags.push(tcType.replace(/^TYP_/, '').replace(/_/g, ' '));
  if (tcKind && tcKind !== 'STANDARD') tags.push(tcKind);

  return {
    id: tcId,
    name: tcName,
    test_type: testType,
    partner,
    is_active: isActive,
    is_automated: isAutomated,
    sort_order: 0,
    tags,
    gherkin_script: tcScript,
    tc_path: tcPath,
  };
}

export const ImportSquashModal: React.FC<ImportSquashModalProps> = ({ onClose, onImport, existingIds, nextSortOrder }) => {
  const [phase, setPhase] = useState<'idle' | 'parsing' | 'preview' | 'importing' | 'done'>('idle');
  const [parsedRows, setParsedRows] = useState<ImportedTestRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleRow = (index: number) => {
    setParsedRows(prev => prev.map((r, i) =>
      i === index && r.status === 'pending' ? { ...r, selected: !r.selected } : r
    ));
  };

  const selectableRows = parsedRows.filter(r => r.status === 'pending');
  const allSelected = selectableRows.length > 0 && selectableRows.every(r => r.selected);

  const toggleAll = () => {
    const newSel = !allSelected;
    setParsedRows(prev => prev.map(r =>
      r.status === 'pending' ? { ...r, selected: newSel } : r
    ));
  };

  const handleFile = useCallback(async (file: File) => {
    setPhase('parsing');
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error('Aucune feuille trouvée dans le fichier');
      const ws = wb.Sheets[sheetName];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

      if (jsonRows.length === 0) throw new Error('Le fichier ne contient aucune donnée');

      // Check if it has Squash columns
      const firstRow = jsonRows[0];
      const hasSquashCols = Object.keys(firstRow).some(k =>
        k.startsWith('TC_') || k === 'PROJECT_ID' || k === 'PROJECT_NAME'
      );
      if (!hasSquashCols) throw new Error('Format non reconnu. Le fichier doit contenir des colonnes Squash (TC_ID, TC_NAME, TC_PATH, etc.)');

      const existingSet = new Set(existingIds);
      const rows: ImportedTestRow[] = [];
      let sortOrder = nextSortOrder;

      for (const raw of jsonRows) {
        const mapped = mapSquashRow(raw);
        if (!mapped) continue;
        if (existingSet.has(mapped.id)) {
          rows.push({ ...mapped, status: 'error', error: 'ID déjà existant', selected: false });
        } else {
          rows.push({ ...mapped, sort_order: sortOrder++, status: 'pending', selected: true });
        }
      }

      if (rows.length === 0) throw new Error('Aucun test valide trouvé dans le fichier');
      setParsedRows(rows);
      setPhase('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier');
      setPhase('idle');
    }
  }, [existingIds, nextSortOrder]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    const toImport = parsedRows.filter(r => r.status === 'pending' && r.selected);
    if (toImport.length === 0) return;
    setPhase('importing');
    setImportProgress({ current: 0, total: toImport.length });
    let imported = 0;
    let skipped = 0;
    try {
      await onImport(toImport.map(r => ({
        id: r.id, name: r.name, test_type: r.test_type, partner: r.partner,
        is_active: r.is_active, is_automated: r.is_automated, sort_order: r.sort_order, tags: r.tags,
        gherkin_script: r.gherkin_script, tc_path: r.tc_path,
      })));
      imported = toImport.length;
      setImportedCount(imported);
      setSkippedCount(parsedRows.length - toImport.length);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
      setPhase('preview');
    }
  };

  const selectedCount = parsedRows.filter(r => r.status === 'pending' && r.selected).length;
  const pendingCount = parsedRows.filter(r => r.status === 'pending').length;
  const duplicateCount = parsedRows.filter(r => r.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose} style={{ animation: 'fade-in 0.2s ease both' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()} style={{ animation: 'card-enter 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Importer un catalogue Squash</h3>
              <p className="text-sm text-gray-500">Format XLS, XLSX ou CSV exporté depuis Squash TM</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {phase === 'idle' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                dragOver ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${
                dragOver ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Upload className={`w-8 h-8 ${dragOver ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">Glissez votre fichier ici</p>
              <p className="text-sm text-gray-500">ou cliquez pour parcourir</p>
              <p className="text-xs text-gray-400 mt-3">Formats acceptés: .xls, .xlsx, .csv</p>
              {error && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg py-2 px-4">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".xls,.xlsx,.csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}

          {phase === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Lecture du fichier...</p>
            </div>
          )}

          {phase === 'preview' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}</span>
                </div>
                <span className="text-sm text-gray-400">/ {pendingCount} disponible{pendingCount > 1 ? 's' : ''}</span>
                {duplicateCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">{duplicateCount} déjà existants</span>
                  </div>
                )}
                <button onClick={() => { setPhase('idle'); setParsedRows([]); setError(null); }}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Changer de fichier
                </button>
              </div>
              {error && (
                <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg py-2 px-4">
                  <AlertCircle className="w-4 h-4" />{error}
                </div>
              )}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-10">
                          <input type="checkbox" checked={allSelected} onChange={toggleAll}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Nom</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Partenaire</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Dossier (TC_PATH)</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Auto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {parsedRows.map((row, i) => (
                        <tr key={i} className={
                          row.status === 'error'
                            ? 'bg-orange-50'
                            : row.selected
                              ? 'bg-blue-50/40 hover:bg-blue-50'
                              : 'hover:bg-gray-50'
                        }>
                          <td className="px-4 py-2">
                            {row.status === 'pending' ? (
                              <input type="checkbox" checked={row.selected} onChange={() => toggleRow(i)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-orange-600" title={row.error}>
                                <AlertCircle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {row.status === 'error' ? (
                              <span className="text-xs text-orange-600" title={row.error}>Ignoré</span>
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-gray-700">{row.id}</td>
                          <td className="px-4 py-2 text-gray-900 max-w-xs truncate" title={row.name}>{row.name}</td>
                          <td className="px-4 py-2 text-gray-600 text-xs">{row.test_type}</td>
                          <td className="px-4 py-2 text-gray-600 capitalize text-xs">{row.partner}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs max-w-[200px] truncate" title={row.tc_path}>{row.tc_path || <span className="text-gray-300">—</span>}</td>
                          <td className="px-4 py-2">
                            {row.is_automated ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Oui</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Non</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {phase === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600 font-medium mb-2">Import en cours...</p>
              <div className="w-64 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }} />
              </div>
              <p className="text-sm text-gray-500 mt-2">{importProgress.current} / {importProgress.total}</p>
            </div>
          )}

          {phase === 'done' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">Import terminé</p>
              <p className="text-gray-600">{importedCount} test{importedCount > 1 ? 's' : ''} importé{importedCount > 1 ? 's' : ''}</p>
              {skippedCount > 0 && (
                <p className="text-sm text-orange-600 mt-1">{skippedCount} test{skippedCount > 1 ? 's' : ''} ignoré{skippedCount > 1 ? 's' : ''} (déjà existants)</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === 'preview' && selectedCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">{selectedCount} test{selectedCount > 1 ? 's' : ''} seront ajoutés au catalogue</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Annuler</button>
              <button onClick={handleImport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                <Upload className="w-4 h-4" />Importer {selectedCount} test{selectedCount > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
        {phase === 'preview' && selectedCount === 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-400">Aucun test sélectionné</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Annuler</button>
              <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-white rounded-lg cursor-not-allowed text-sm font-medium">
                <Upload className="w-4 h-4" />Importer
              </button>
            </div>
          </div>
        )}
        {phase === 'done' && (
          <div className="flex justify-end px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
};
