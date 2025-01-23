import {
  TrophyIcon,
  ChartBarIcon,
  BoltIcon
} from '@heroicons/react/24/solid';

export default function Home() {
  return (
    <div className="h-full">
      <div className="max-w-4xl">
        <div className="flex items-center mb-6">
          <TrophyIcon className="w-12 h-12 text-white mr-4" />
          <h1 className="text-4xl font-black text-white uppercase tracking-wider">
            Welcome to <span className="text-white">Spire</span>
          </h1>
        </div>
        
        <div className="bg-dark-50 rounded-2xl p-8 shadow-2xl border border-dark-100">
          <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide">
            Elite Performance Dashboard
          </h2>
          <p className="text-lg text-gray-300 mb-6">
            Transform your coaching practice with powerful tools and insights.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-dark-100 p-6 rounded-xl border border-dark-200">
              <ChartBarIcon className="w-10 h-10 text-white mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Performance Tracking</h3>
              <p className="text-gray-400">Monitor progress and achieve peak results</p>
            </div>
            
            <div className="bg-dark-100 p-6 rounded-xl border border-dark-200">
              <BoltIcon className="w-10 h-10 text-white mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Real-time Coaching</h3>
              <p className="text-gray-400">Connect and coach from anywhere</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
