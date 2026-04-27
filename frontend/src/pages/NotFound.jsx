import { Link } from 'react-router-dom';
import { Home, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
          <FileQuestion size={40} className="text-gray-400" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Home size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
