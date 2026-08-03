import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sun, Cloud, CloudRain, Wind } from 'lucide-react';
import { TestResult } from '../types';

interface WeatherCalendarProps {
  tests: TestResult[];
  onDayClick?: (tests: TestResult[]) => void;
  onViewTestDetails?: (test: TestResult) => void;
}

interface DayData {
  date: Date;
  tests: TestResult[];
  weather: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  successRate: number;
  totalTests: number;
}

export const WeatherCalendar: React.FC<WeatherCalendarProps> = ({ tests, onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<DayData[]>([]);

  useEffect(() => {
    generateCalendarData();
  }, [tests, currentDate]);

  const generateCalendarData = () => {
    const data: DayData[] = [];
    const today = new Date();

    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayTests = tests.filter(test => {
        const testDate = new Date(test.timestamp);
        return testDate.toDateString() === date.toDateString();
      });

      let successRate = 0;
      let totalIndividualTests = 0;

      if (dayTests.length > 0) {
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
        return 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-900';
      case 'cloudy':
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 text-yellow-900';
      case 'rainy':
        return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 text-orange-900';
      case 'stormy':
        return 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 text-red-900';
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
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 mb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📅</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Calendrier des tests - 7 derniers jours
            </h2>
            <p className="text-sm text-gray-600">
              Aperçu rapide de la qualité des tests sur la dernière semaine
            </p>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-3">
        {calendarData.map((dayData, index) => (
          <div
            key={index}
            className={`
              relative p-4 min-h-[120px] border-2 rounded-xl transition-all hover:shadow-lg cursor-pointer
              ${isToday(dayData.date) ? 'ring-4 ring-blue-500 border-blue-400' : ''}
              ${dayData.tests.length > 0 ? getWeatherColor(dayData.weather) : 'bg-gray-50 border-gray-200'}
            `}
            onClick={() => dayData.tests.length > 0 && onDayClick?.(dayData.tests)}
          >
            {/* Date */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-semibold uppercase opacity-75">
                  {dayData.date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold">
                  {dayData.date.getDate()}
                </div>
                <div className="text-xs font-medium opacity-75">
                  {dayData.date.toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
              </div>
              {dayData.tests.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-3xl">{getWeatherIcon(dayData.weather)}</span>
                </div>
              )}
            </div>

            {/* Test info */}
            {dayData.tests.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{dayData.tests.length} exec</span>
                  {dayData.totalTests > 0 && (
                    <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded-full">
                      {Math.round(dayData.successRate)}%
                    </span>
                  )}
                </div>
                <div className="text-xs font-medium opacity-90">
                  {dayData.totalTests} test{dayData.totalTests > 1 ? 's' : ''}
                </div>
              </div>
            ) : (
              <div className="text-center mt-4">
                <span className="text-gray-400 text-xs">Aucun test</span>
              </div>
            )}

            {/* Execution weather icons */}
            {dayData.tests.length > 0 && (
              <div className="absolute bottom-1 right-1 flex space-x-0.5">
                {dayData.tests.slice(0, 3).map((test, testIndex) => {
                  const successCount = test.successCount || 0;
                  const failureCount = test.failureCount || 0;
                  const totalTests = successCount + failureCount;
                  const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;

                  let weatherIcon = '☀️';
                  if (successRate >= 90) weatherIcon = '☀️';
                  else if (successRate >= 70) weatherIcon = '☁️';
                  else if (successRate >= 50) weatherIcon = '🌧️';
                  else weatherIcon = '⛈️';

                  return (
                    <span
                      key={testIndex}
                      className="text-xs"
                      title={test.name}
                    >
                      {weatherIcon}
                    </span>
                  );
                })}
                {dayData.tests.length > 3 && (
                  <span className="text-xs text-gray-400" title={`+${dayData.tests.length - 3} autres`}>+{dayData.tests.length - 3}</span>
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