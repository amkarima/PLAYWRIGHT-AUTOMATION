import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CreditCard as Edit2, Trash2, RefreshCw, Clock, GitBranch, Play, Pause } from 'lucide-react';
import { gitlabApi } from '../services/gitlabApi';
import { GitLabPipelineSchedule } from '../types';

interface PlanificationPageProps {
  onBack: () => void;
}

export const PlanificationPage: React.FC<PlanificationPageProps> = ({ onBack }) => {
  const [schedules, setSchedules] = useState<GitLabPipelineSchedule[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<GitLabPipelineSchedule | null>(null);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const [formData, setFormData] = useState({
    description: '',
    ref: 'master',
    cron: '0 2 * * *',
    cron_timezone: 'UTC',
    active: true,
    variables: {} as Record<string, string>,
  });

  const [cronMode, setCronMode] = useState<'simple' | 'custom'>('simple');
  const [simpleSchedule, setSimpleSchedule] = useState({
    frequency: 'daily',
    time: '02:00',
    dayOfWeek: '1',
    dayOfMonth: '1',
  });

  useEffect(() => {
    fetchSchedules();
    fetchBranches();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await gitlabApi.getPipelineSchedules();
      setSchedules(data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des planifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await gitlabApi.getBranches();
      const branchNames = data
        .filter(branch => branch && branch.name)
        .map(branch => branch.name);
      setBranches(branchNames.length > 0 ? branchNames : ['master', 'main']);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setBranches(['master', 'main']);
    }
  };

  const parseCronToSimple = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      setSimpleSchedule({
        frequency: 'daily',
        time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
        dayOfWeek: '1',
        dayOfMonth: '1',
      });
      setCronMode('simple');
    } else if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
      setSimpleSchedule({
        frequency: 'weekly',
        time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
        dayOfWeek: dayOfWeek,
        dayOfMonth: '1',
      });
      setCronMode('simple');
    } else if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
      setSimpleSchedule({
        frequency: 'monthly',
        time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
        dayOfWeek: '1',
        dayOfMonth: dayOfMonth,
      });
      setCronMode('simple');
    } else {
      setCronMode('custom');
    }
  };

  const convertSimpleToCron = () => {
    const [hour, minute] = simpleSchedule.time.split(':');

    switch (simpleSchedule.frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        return `${minute} ${hour} * * ${simpleSchedule.dayOfWeek}`;
      case 'monthly':
        return `${minute} ${hour} ${simpleSchedule.dayOfMonth} * *`;
      default:
        return formData.cron;
    }
  };

  useEffect(() => {
    if (cronMode === 'simple') {
      const newCron = convertSimpleToCron();
      setFormData(prev => ({ ...prev, cron: newCron }));
    }
  }, [cronMode, simpleSchedule]);

  const handleOpenModal = (schedule?: GitLabPipelineSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      const variables: Record<string, string> = {};
      if (schedule.variables) {
        schedule.variables.forEach(v => {
          variables[v.key] = v.value;
        });
      }
      setFormData({
        description: schedule.description,
        ref: schedule.ref,
        cron: schedule.cron,
        cron_timezone: schedule.cron_timezone,
        active: schedule.active,
        variables,
      });
      parseCronToSimple(schedule.cron);
    } else {
      setEditingSchedule(null);
      setCronMode('simple');
      setSimpleSchedule({
        frequency: 'daily',
        time: '02:00',
        dayOfWeek: '1',
        dayOfMonth: '1',
      });
      setFormData({
        description: '',
        ref: 'master',
        cron: '0 2 * * *',
        cron_timezone: 'UTC',
        active: true,
        variables: {
          ENV: 'CI',
          SELECTED_TESTS: 'all',
        },
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setNewVarKey('');
    setNewVarValue('');
  };

  const handleAddVariable = () => {
    if (!newVarKey.trim()) return;

    setFormData({
      ...formData,
      variables: {
        ...formData.variables,
        [newVarKey.trim()]: newVarValue.trim(),
      },
    });
    setNewVarKey('');
    setNewVarValue('');
  };

  const handleRemoveVariable = (key: string) => {
    const newVariables = { ...formData.variables };
    delete newVariables[key];
    setFormData({
      ...formData,
      variables: newVariables,
    });
  };

  const handleSaveSchedule = async () => {
    try {
      if (!formData.description.trim()) {
        setError('La description est obligatoire');
        return;
      }

      const scheduleData = {
        description: formData.description,
        ref: formData.ref,
        cron: formData.cron,
        cron_timezone: formData.cron_timezone,
        active: formData.active,
      };

      let scheduleId: number;

      if (editingSchedule) {
        const updated = await gitlabApi.updatePipelineSchedule(editingSchedule.id, scheduleData);
        scheduleId = updated.id;

        const existingVars = editingSchedule.variables || [];
        const existingKeys = new Set(existingVars.map(v => v.key));
        const newKeys = new Set(Object.keys(formData.variables));

        for (const key of existingKeys) {
          if (!newKeys.has(key)) {
            await gitlabApi.deletePipelineScheduleVariable(scheduleId, key);
          }
        }

        for (const [key, value] of Object.entries(formData.variables)) {
          if (existingKeys.has(key)) {
            await gitlabApi.updatePipelineScheduleVariable(scheduleId, key, { value });
          } else {
            await gitlabApi.createPipelineScheduleVariable(scheduleId, { key, value });
          }
        }
      } else {
        const created = await gitlabApi.createPipelineSchedule(scheduleData);
        scheduleId = created.id;

        for (const [key, value] of Object.entries(formData.variables)) {
          await gitlabApi.createPipelineScheduleVariable(scheduleId, { key, value });
        }
      }

      handleCloseModal();
      fetchSchedules();
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette planification ?')) {
      return;
    }

    try {
      await gitlabApi.deletePipelineSchedule(id);
      fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (schedule: GitLabPipelineSchedule) => {
    try {
      await gitlabApi.updatePipelineSchedule(schedule.id, { active: !schedule.active });
      fetchSchedules();
    } catch (err) {
      console.error('Error toggling schedule:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
    }
  };

  const parseCronExpression = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length < 5) return 'Expression cron invalide';

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return `Tous les jours à ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    } else if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      return `Tous les ${days[parseInt(dayOfWeek)]} à ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }

    return cron;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors mb-6"
          >
            ← Retour au dashboard
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Planifications de pipelines</h1>
                <p className="text-gray-600">Gérez les planifications automatiques d'exécution de tests</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => fetchSchedules()}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle planification</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune planification</h3>
            <p className="text-gray-600 mb-6">
              Créez votre première planification pour automatiser l'exécution de vos tests
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Créer une planification</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`bg-white rounded-lg shadow-sm border p-6 ${
                  !schedule.active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{schedule.description}</h3>
                      {schedule.active ? (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <Play className="w-3 h-3" />
                          <span>Actif</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                          <Pause className="w-3 h-3" />
                          <span>Inactif</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <GitBranch className="w-4 h-4" />
                        <span className="text-sm">Branche: <span className="font-medium">{schedule.ref}</span></span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{parseCronExpression(schedule.cron)}</span>
                      </div>
                    </div>

                    {schedule.variables && schedule.variables.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Variables:</p>
                        <div className="flex flex-wrap gap-2">
                          {schedule.variables.map((variable) => (
                            <span
                              key={variable.key}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {variable.key}: {variable.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Créé par {schedule.owner?.name || 'Inconnu'} le {new Date(schedule.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(schedule)}
                      className={`p-2 rounded-md transition-colors ${
                        schedule.active
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={schedule.active ? 'Désactiver' : 'Activer'}
                    >
                      {schedule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenModal(schedule)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSchedule ? 'Modifier la planification' : 'Nouvelle planification'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    id="description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Tests quotidiens de l'environnement CI"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ref" className="block text-sm font-medium text-gray-700 mb-2">
                      Branche *
                    </label>
                    <select
                      id="ref"
                      value={formData.ref}
                      onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {branches.length === 0 ? (
                        <option value="">Chargement des branches...</option>
                      ) : (
                        branches.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="cron_timezone" className="block text-sm font-medium text-gray-700 mb-2">
                      Fuseau horaire
                    </label>
                    <select
                      id="cron_timezone"
                      value={formData.cron_timezone}
                      onChange={(e) => setFormData({ ...formData, cron_timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fréquence d'exécution *
                  </label>

                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setCronMode('simple')}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        cronMode === 'simple'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Configuration simple
                    </button>
                    <button
                      type="button"
                      onClick={() => setCronMode('custom')}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        cronMode === 'custom'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Expression Cron
                    </button>
                  </div>

                  {cronMode === 'simple' ? (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                          Fréquence
                        </label>
                        <select
                          id="frequency"
                          value={simpleSchedule.frequency}
                          onChange={(e) => setSimpleSchedule({ ...simpleSchedule, frequency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="daily">Tous les jours</option>
                          <option value="weekly">Toutes les semaines</option>
                          <option value="monthly">Tous les mois</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                          Heure d'exécution
                        </label>
                        <input
                          id="time"
                          type="time"
                          value={simpleSchedule.time}
                          onChange={(e) => setSimpleSchedule({ ...simpleSchedule, time: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      {simpleSchedule.frequency === 'weekly' && (
                        <div>
                          <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-2">
                            Jour de la semaine
                          </label>
                          <select
                            id="dayOfWeek"
                            value={simpleSchedule.dayOfWeek}
                            onChange={(e) => setSimpleSchedule({ ...simpleSchedule, dayOfWeek: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="1">Lundi</option>
                            <option value="2">Mardi</option>
                            <option value="3">Mercredi</option>
                            <option value="4">Jeudi</option>
                            <option value="5">Vendredi</option>
                            <option value="6">Samedi</option>
                            <option value="0">Dimanche</option>
                          </select>
                        </div>
                      )}

                      {simpleSchedule.frequency === 'monthly' && (
                        <div>
                          <label htmlFor="dayOfMonth" className="block text-sm font-medium text-gray-700 mb-2">
                            Jour du mois
                          </label>
                          <select
                            id="dayOfMonth"
                            value={simpleSchedule.dayOfMonth}
                            onChange={(e) => setSimpleSchedule({ ...simpleSchedule, dayOfMonth: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-300">
                        <p className="text-xs text-gray-600">
                          Expression cron générée: <code className="bg-white px-2 py-1 rounded text-blue-600">{convertSimpleToCron()}</code>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        id="cron"
                        type="text"
                        value={formData.cron}
                        onChange={(e) => setFormData({ ...formData, cron: e.target.value })}
                        placeholder="0 2 * * *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: minute heure jour mois jour-semaine. Ex: "0 2 * * *" = tous les jours à 2h
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variables de pipeline
                  </label>

                  {Object.keys(formData.variables).length > 0 && (
                    <div className="mb-3 space-y-2">
                      {Object.entries(formData.variables).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200"
                        >
                          <div className="flex-1">
                            <span className="font-medium text-gray-700">{key}</span>
                            <span className="text-gray-500"> = </span>
                            <span className="text-gray-600">{value}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariable(key)}
                            className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newVarKey}
                      onChange={(e) => setNewVarKey(e.target.value)}
                      placeholder="Clé (ex: ENV)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddVariable();
                        }
                      }}
                    />
                    <input
                      type="text"
                      value={newVarValue}
                      onChange={(e) => setNewVarValue(e.target.value)}
                      placeholder="Valeur (ex: CI)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddVariable();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddVariable}
                      disabled={!newVarKey.trim()}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ajoutez des variables qui seront passées au pipeline (ex: ENV=CI, SELECTED_TESTS=TST-001)
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="active"
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Activer immédiatement
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingSchedule ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
