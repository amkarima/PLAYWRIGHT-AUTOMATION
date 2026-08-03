import React from 'react';
import { CheckCircle, XCircle, Clock, Play, Download, User, GitCommit, GitBranch } from 'lucide-react';
import { TestResult } from '../types';

interface TestCardProps {
  test: TestResult;
  onViewDetails?: (test: TestResult) => void;
}

export const TestCard: React.FC<TestCardProps> = ({ test, onViewDetails }) => {
  const getWeatherForTest = (test: TestResult): 'sunny' | 'cloudy' | 'rainy' | 'stormy' => {
    const successCount = test.successCount || 0;
    const failureCount = test.failureCount || 0;
    const totalTests = successCount + failureCount;

    if (totalTests === 0) return 'sunny';

    const successRate = (successCount / totalTests) * 100;

    if (successRate >= 90) return 'sunny';
    if (successRate >= 70) return 'cloudy';
    if (successRate >= 50) return 'rainy';
    return 'stormy';
  };

  const getWeatherIcon = (weather: 'sunny' | 'cloudy' | 'rainy' | 'stormy') => {
    switch (weather) {
      case 'sunny':
        return <span className="text-2xl">☀️</span>;
      case 'cloudy':
        return <span className="text-2xl">☁️</span>;
      case 'rainy':
        return <span className="text-2xl">🌧️</span>;
      case 'stormy':
        return <span className="text-2xl">⛈️</span>;
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Play className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getCardColor = (test: TestResult) => {
    const successCount = test.successCount || 0;
    const failureCount = test.failureCount || 0;
    const totalTests = successCount + failureCount;

    // Si pas de tests, utiliser la couleur basée sur le statut
    if (totalTests === 0) {
      return getStatusColor(test.status);
    }

    const successRate = (successCount / totalTests) * 100;

    // Nuances de vert à rouge basées sur le taux de réussite
    if (successRate === 100) {
      return 'bg-green-100 border-green-300';
    } else if (successRate >= 90) {
      return 'bg-green-50 border-green-200';
    } else if (successRate >= 80) {
      return 'bg-lime-50 border-lime-200';
    } else if (successRate >= 70) {
      return 'bg-yellow-50 border-yellow-200';
    } else if (successRate >= 60) {
      return 'bg-orange-50 border-orange-200';
    } else if (successRate >= 50) {
      return 'bg-orange-100 border-orange-300';
    } else {
      return 'bg-red-100 border-red-300';
    }
  };
  const formatDuration = (seconds: number) => {
    const roundedSeconds = Math.floor(seconds);
    if (roundedSeconds < 60) return `${roundedSeconds}s`;
    const minutes = Math.floor(roundedSeconds / 60);
    const remainingSeconds = roundedSeconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const weather = getWeatherForTest(test);

  return (
    <div
      className={`border rounded-lg p-6 transition-all hover:shadow-md cursor-pointer ${getCardColor(test)}`}
      onClick={() => onViewDetails?.(test)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getWeatherIcon(weather)}
          <div>
            <h3 className="font-semibold text-gray-900">{test.name}</h3>
            <p className="text-xs text-gray-500 mt-1">
              Cliquez pour charger les détails et artifacts
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {test.duration > 0 ? formatDuration(test.duration) : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 capitalize">{test.status}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-1">
          <GitBranch className="w-4 h-4" />
          <span>{test.branch}</span>
        </div>
        <div className="flex items-center space-x-1">
          <GitCommit className="w-4 h-4" />
          <span>{test.commit}</span>
        </div>
      </div>
      
      {/* Test Results Summary */}
      {(test.successCount !== undefined || test.failureCount !== undefined) && (
        <div className="flex items-center justify-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-700">
              {test.successCount || 0} réussis
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              {test.failureCount || 0} échecs
            </span>
          </div>
        </div>
      )}
      
      {test.artifacts && test.artifacts.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Artifacts:</p>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Download className="w-3 h-3" />
            <span>{test.artifacts.length} artifact(s) disponible(s)</span>
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          Cliquez pour voir les détails et télécharger les artifacts
        </p>
      </div>
    </div>
  );
};