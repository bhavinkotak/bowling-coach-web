import { useState } from 'react';
import { Play, Download, Eye } from 'lucide-react';

interface VideoClip {
  url: string;
  thumbnail?: string;
  parameter: string;
  duration?: number;
}

interface VideoGalleryProps {
  clips: VideoClip[];
  onDownload?: (url: string, parameter: string) => void;
}

export default function VideoGallery({ clips, onDownload }: VideoGalleryProps) {
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);

  if (clips.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Eye size={48} className="mx-auto mb-4 opacity-50" />
        <p>No video clips available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {clips.map((clip, index) => (
          <div
            key={index}
            className="relative group cursor-pointer rounded-lg overflow-hidden bg-slate-700"
            onClick={() => setSelectedClip(clip)}
          >
            {clip.thumbnail ? (
              <img
                src={clip.thumbnail}
                alt={clip.parameter}
                className="w-full h-32 object-cover"
              />
            ) : (
              <div className="w-full h-32 bg-slate-600 flex items-center justify-center">
                <Play size={32} className="text-slate-400" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play size={40} className="text-white" />
            </div>
            
            <div className="p-2">
              <p className="text-sm font-medium text-white truncate">
                {clip.parameter}
              </p>
              {clip.duration && (
                <p className="text-xs text-slate-400">{clip.duration}s</p>
              )}
            </div>

            {onDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(clip.url, clip.parameter);
                }}
                className="absolute top-2 right-2 p-2 bg-slate-900/80 rounded-full hover:bg-slate-800 transition-colors"
              >
                <Download size={16} className="text-white" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedClip && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedClip(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-xl font-semibold text-white">
                  {selectedClip.parameter}
                </h3>
              </div>
              <video
                src={selectedClip.url}
                controls
                autoPlay
                className="w-full"
              />
              <div className="p-4 flex justify-between">
                <button
                  onClick={() => setSelectedClip(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                {onDownload && (
                  <button
                    onClick={() => onDownload(selectedClip.url, selectedClip.parameter)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
