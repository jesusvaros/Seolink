import Link from 'next/link';
import { PlayIcon } from '@heroicons/react/24/solid';

export default function TikTokProfile() {
  return (
    <div className="mb-12">
      <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 rounded-2xl p-8 border border-gray-200 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200 rounded-full opacity-20 -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200 rounded-full opacity-20 -ml-12 -mb-12"></div>
        
        <div className="relative">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Contenido principal */}
            <div className="flex-1 mb-6 md:mb-0 md:mr-8">
              <div className="flex items-center mb-4">
                <div className="bg-black rounded-xl p-3 mr-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.43z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Síguenos en TikTok
                  </h2>
                  <p className="text-gray-600">@comparaland</p>
                </div>
              </div>
              
              <p className="text-lg text-gray-700 mb-6">
                🎥 Descubre los mejores productos en videos cortos y entretenidos. 
                Reviews rápidas, comparativas visuales y tips de compra que te ayudarán a decidir mejor.
              </p>
            </div>
            
            {/* Mockup de videos */}
            <div className="flex-shrink-0">
              <div className="grid grid-cols-2 gap-3">
                {/* Video 1 */}
                <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl w-24 h-32 flex items-center justify-center relative overflow-hidden">
                  <PlayIcon className="h-8 w-8 text-white opacity-80" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black bg-opacity-50 rounded px-2 py-1">
                      <p className="text-white text-xs font-medium">Best Skincare</p>
                    </div>
                  </div>
                </div>
                
                {/* Video 2 */}
                <div className="bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl w-24 h-32 flex items-center justify-center relative overflow-hidden">
                  <PlayIcon className="h-8 w-8 text-white opacity-80" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black bg-opacity-50 rounded px-2 py-1">
                      <p className="text-white text-xs font-medium">Tech Review</p>
                    </div>
                  </div>
                </div>
                
                {/* Video 3 */}
                <div className="bg-gradient-to-br from-green-400 to-blue-400 rounded-xl w-24 h-32 flex items-center justify-center relative overflow-hidden">
                  <PlayIcon className="h-8 w-8 text-white opacity-80" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black bg-opacity-50 rounded px-2 py-1">
                      <p className="text-white text-xs font-medium">Kitchen Tips</p>
                    </div>
                  </div>
                </div>
                
                {/* Video 4 */}
                <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl w-24 h-32 flex items-center justify-center relative overflow-hidden">
                  <PlayIcon className="h-8 w-8 text-white opacity-80" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black bg-opacity-50 rounded px-2 py-1">
                      <p className="text-white text-xs font-medium">Fashion</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link
              href="https://www.tiktok.com/@comparaland"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors duration-200 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.43z"/>
              </svg>
              Seguir en TikTok
            </Link>
            
            <Link
              href="https://www.tiktok.com/@comparaland"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-800 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <PlayIcon className="h-5 w-5 mr-2 text-purple-600" />
              Ver Videos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
