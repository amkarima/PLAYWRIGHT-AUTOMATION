import React from 'react';

interface DocumentationPageProps {
  isDarkMode?: boolean;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ isDarkMode = true }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <iframe
          src="/documentation.html"
          title="Documentation technique"
          className="w-full bg-white rounded-xl shadow-lg border border-gray-200"
          style={{ height: 'calc(100vh - 140px)', minHeight: '600px' }}
          loading="lazy"
        />
      </div>
    </div>
  );
};
