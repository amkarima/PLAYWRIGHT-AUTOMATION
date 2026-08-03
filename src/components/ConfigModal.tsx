import React, { useState } from 'react';
import { X, Settings, GitBranch } from 'lucide-react';
import { GitLabConfig, XrayConfig } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gitlabConfig: GitLabConfig, xrayConfig: XrayConfig) => void;
  initialGitLabConfig?: GitLabConfig;
  initialXrayConfig?: XrayConfig;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGitLabConfig,
  initialXrayConfig
}) => {
  const [gitlabConfig, setGitlabConfig] = useState<GitLabConfig>({
    baseUrl: initialGitLabConfig?.baseUrl || '',
    token: initialGitLabConfig?.token || '',
    projectId: initialGitLabConfig?.projectId || '',
  });

  const [xrayConfig, setXrayConfig] = useState<XrayConfig>({
    url: initialXrayConfig?.url || '',
    type: initialXrayConfig?.type || 'server',
    apiVersion: initialXrayConfig?.apiVersion || '1.0',
    token: initialXrayConfig?.token || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(gitlabConfig, xrayConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configuration GitLab</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-2">
              URL GitLab
            </label>
            <input
              type="url"
              id="baseUrl"
              value={gitlabConfig.baseUrl}
              onChange={(e) => setGitlabConfig({ ...gitlabConfig, baseUrl: e.target.value })}
              placeholder="https://gitlab.example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              Token d'accès personnel
            </label>
            <input
              type="password"
              id="token"
              value={gitlabConfig.token}
              onChange={(e) => setGitlabConfig({ ...gitlabConfig, token: e.target.value })}
              placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Créez un token d'accès personnel avec les scopes 'api' et 'write_repository' dans vos paramètres GitLab
            </p>
          </div>
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <p className="text-yellow-800 font-medium">⚠️ Sécurité:</p>
              <p className="text-yellow-700">
                Le token sera visible dans les outils de développement du navigateur. 
                Utilisez un token avec des permissions minimales et renouvelez-le régulièrement.
              </p>
          </div>
          
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
              ID du projet
            </label>
            <input
              type="text"
              id="projectId"
              value={gitlabConfig.projectId}
              onChange={(e) => setGitlabConfig({ ...gitlabConfig, projectId: e.target.value })}
              placeholder="123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <hr className="my-6" />
          
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration Xray</h3>
          
          <div>
            <label htmlFor="xrayUrl" className="block text-sm font-medium text-gray-700 mb-2">
              URL Jira/Xray
            </label>
            <input
              type="url"
              id="xrayUrl"
              value={xrayConfig.url}
              onChange={(e) => setXrayConfig({ ...xrayConfig, url: e.target.value })}
              placeholder="https://jira.example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label htmlFor="xrayToken" className="block text-sm font-medium text-gray-700 mb-2">
              Token d'accès Xray
            </label>
            <input
              type="password"
              id="xrayToken"
              value={xrayConfig.token}
              onChange={(e) => setXrayConfig({ ...xrayConfig, token: e.target.value })}
              placeholder="Votre token d'accès Xray"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <GitBranch className="w-4 h-4" />
              <span>Sauvegarder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}