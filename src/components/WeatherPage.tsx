import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sun, Cloud, CloudRain, Wind, Play, RotateCcw } from 'lucide-react';
import { TestResult } from '../types';

interface WeatherCalendarProps {
  tests: TestResult[];
  currentEnvironment: 'ci' | 'sit' | 'prod';
  onDayClick?: (tests: TestResult[]) => void;
  onViewTestDetails?: (test: TestResult) => void;
  onNewTest?: () => void;
  onRetryFailures?: () => void;
}

interface DayData {
  date: Date;
  tests: TestResult[];
  weather: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  successRate: number;
  totalTests: number;
}

export const WeatherPage: React.FC<WeatherCalendarProps> = ({ tests, currentEnvironment, onDayClick, onViewTestDetails, onNewTest, onRetryFailures }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<DayData[]>([]);

  useEffect(() => {
    generateCalendarData();
  }, [tests, currentDate, currentEnvironment]);

  const generateCalendarData = () => {
    // Filter tests by environment first
    const environmentTests = tests.filter(test => 
      test.environment?.toLowerCase() === currentEnvironment.toLowerCase()
    );
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get first day of week (0 = Sunday)
    const startDay = firstDay.getDay();
    
    const data: DayData[] = [];
    
    // Add empty days for previous month
    for (let i = 0; i < startDay; i++) {
      const date = new Date(year, month, -startDay + i + 1);
      data.push({
        date,
        tests: [],
        weather: 'sunny',
        successRate: 0,
        totalTests: 0
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayTests = environmentTests.filter(test => {
        const testDate = new Date(test.timestamp);
        return testDate.toDateString() === date.toDateString();
      });
      
      let successRate = 0;
      let totalIndividualTests = 0;
      
      if (dayTests.length > 0) {
        // Calculer le taux de réussite moyen de toutes les exécutions du jour
        let totalSuccessRate = 0;
        let validExecutions = 0;
        
        dayTests.forEach(test => {
          const successCount = test.successCount || 0;
          const failureCount = test.failureCount || 0;
          const totalTestsInExecution = successCount + failureCount;
          
          if (totalTestsInExecution > 0) {
            const executionSuccessRate = (successCount / totalTestsInExecution) * 100;
            totalSuccessRate += executionSuccessRate;
            validExecutions++;
          }
          
          totalIndividualTests += totalTestsInExecution;
        });
        
        successRate = validExecutions > 0 ? totalSuccessRate / validExecutions : 0;
      }
      
      let weather: DayData['weather'] = 'sunny';
      if (dayTests.length > 0) {
        if (successRate >= 90) weather = 'sunny';
        else if (successRate >= 70) weather = 'cloudy';
        else if (successRate >= 50) weather = 'rainy';
        else weather = 'stormy';
      }
      
      data.push({
        date,
        tests: dayTests,
        weather,
        successRate,
        totalTests: totalIndividualTests
      });
    }
    
    // Add remaining days to complete the grid
    const remainingDays = 42 - data.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      data.push({
        date,
        tests: [],
        weather: 'sunny',
        successRate: 0,
        totalTests: 0
      });
    }
    
    setCalendarData(data);
  };

  const getWeatherIcon = (weather: DayData['weather'], size = 'w-4 h-4') => {
    switch (weather) {
      case 'sunny':
        return <span className="text-lg">☀️</span>;
      case 'cloudy':
        return <span className="text-lg">☁️</span>;
      case 'rainy':
        return <span className="text-lg">🌧️</span>;
      case 'stormy':
        return <span className="text-lg">⛈️</span>;
    }
  };

  const getWeatherColor = (weather: DayData['weather']) => {
    switch (weather) {
      case 'sunny':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'cloudy':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      case 'rainy':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'stormy':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Calendrier météo des tests
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={onNewTest}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Nouveau test</span>
          </button>
          <button
            onClick={onRetryFailures}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Relancer les échecs</span>
          </button>
          <div className="border-l h-8 mx-2"></div>
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-medium text-gray-900 min-w-[140px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((dayData, index) => (
          <div
            key={index}
            className={`
              relative p-2 min-h-[80px] border rounded-md transition-all hover:shadow-sm cursor-pointer
              ${isCurrentMonth(dayData.date) ? 'bg-white' : 'bg-gray-50'}
              ${isToday(dayData.date) ? 'ring-2 ring-blue-500' : ''}
              ${dayData.tests.length > 0 ? getWeatherColor(dayData.weather) : 'border-gray-200'}
            `}
            onClick={() => dayData.tests.length > 0 && onDayClick?.(dayData.tests)}
          >
            {/* Date */}
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-medium ${
                isCurrentMonth(dayData.date) ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {dayData.date.getDate()}
              </span>
              {dayData.tests.length > 0 && (
                <div className="flex items-center space-x-1">
                  {getWeatherIcon(dayData.weather)}
                </div>
              )}
            </div>

            {/* Test info */}
            {dayData.tests.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium">
                  {dayData.tests.length} exécution{dayData.tests.length > 1 ? 's' : ''}
                </div>
                {dayData.totalTests > 0 && (
                  <div className="text-xs">
                    {Math.round(dayData.successRate)}% réussite
                  </div>
                )}
                <div className="text-xs opacity-75">
                  {dayData.totalTests} test{dayData.totalTests > 1 ? 's' : ''}
                </div>
                
                {/* Liste des tests pour chaque exécution */}
                <div className="space-y-1 mt-2">
                  {dayData.tests.slice(0, 5).map((test, testIndex) => (
                    <div
                      key={testIndex}
                      className="text-xs p-1 bg-white bg-opacity-20 rounded cursor-pointer hover:bg-opacity-30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewTestDetails?.(test);
                      }}
                    >
                      <div className="font-medium truncate" title={test.name}>
                        {test.name.length > 20 ? `${test.name.substring(0, 20)}...` : test.name}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-75">
                          {(test.successCount || 0) + (test.failureCount || 0)} tests
                        </span>
                        {/* Progress bar */}
                        {(() => {
                          const successCount = test.successCount || 0;
                          const failureCount = test.failureCount || 0;
                          const totalTests = successCount + failureCount;
                          const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;
                          
                          return totalTests > 0 ? (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  successRate >= 90 ? 'bg-green-500' : 
                                  successRate >= 70 ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`}
                                style={{ width: `${successRate}%` }}
                              ></div>
                            </div>
                          ) : null;
                        })()}
                        <span className="text-sm">
                          {(() => {
                            const successCount = test.successCount || 0;
                            const failureCount = test.failureCount || 0;
                            const totalTests = successCount + failureCount;
                            const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;

                            if (successRate >= 90) return '☀️';
                            if (successRate >= 70) return '☁️';
                            if (successRate >= 50) return '🌧️';
                            return '⛈️';
                          })()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                  {/* Indicateur s'il y a plus de 5 exécutions */}
                  {dayData.tests.length > 5 && (
                    <div className="text-xs text-gray-500 text-center py-1 italic">
                      +{dayData.tests.length - 5} autre{dayData.tests.length - 5 > 1 ? 's' : ''}
                    </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Légende météo</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">☀️</span>
            <span className="text-sm text-gray-600">Ensoleillé (≥90%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">☁️</span>
            <span className="text-sm text-gray-600">Nuageux (70-89%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🌧️</span>
            <span className="text-sm text-gray-600">Pluvieux (50-69%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">⛈️</span>
            <span className="text-sm text-gray-600">Orageux (&lt;50%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};