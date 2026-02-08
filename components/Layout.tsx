
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, onBack }) => {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <h1 className="text-3xl font-bold text-indigo-900">{title}</h1>
        </div>
        <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          Re-Assess
        </div>
      </header>
      <main className="w-full max-w-4xl flex-grow">
        {children}
      </main>
      <footer className="w-full max-w-4xl mt-12 pt-8 border-t border-gray-200 text-gray-500 text-sm flex flex-col items-center gap-2 pb-8">
        <div className="opacity-75">© {new Date().getFullYear()} Re-Assess - פדגוגיה חדשנית בעידן ה-AI</div>
        <div className="font-bold text-indigo-900 bg-indigo-50 px-4 py-1 rounded-full">פותח ע"י קרן טייטר מכון מופ"ת</div>
      </footer>
    </div>
  );
};

export default Layout;
