export default function Footer() {
  const dashboardVersion = import.meta.env.VITE_VERSION || 'unknown';

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            DALI IoT Dashboard
          </div>
          <div>
            Dashboard v{dashboardVersion}
          </div>
        </div>
      </div>
    </footer>
  );
}
