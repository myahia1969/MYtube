import React, { useState } from 'react';
import { X, Upload, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Video } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newVideo: Video) => void;
}

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Coding');
  const [customDuration, setCustomDuration] = useState('4:15');
  const [durationError, setDurationError] = useState('');

  const validateDuration = (val: string): boolean => {
    const trimmed = val.trim();
    const regex = /^\d+:[0-5]\d$/;
    if (!trimmed) {
      setDurationError('Duration is required.');
      return false;
    }
    if (!regex.test(trimmed)) {
      setDurationError('Must be in mm:ss format (e.g., 04:15 or 12:30).');
      return false;
    }
    setDurationError('');
    return true;
  };

  // Upload progress states
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [stepMessage, setStepMessage] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFileSelected(droppedFile);
      if (!title) {
        // Auto-fill title with filename (without ext)
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFileSelected(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const startUploadSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileSelected) return;

    if (!validateDuration(customDuration)) return;

    setUploadStatus('uploading');
    setProgress(0);

    const steps = [
      { prg: 15, msg: 'Initializing secure tunnel connection...' },
      { prg: 35, msg: 'Chunking raw video file streams...' },
      { prg: 55, msg: 'Uploading raw video chunk bytes to Supabase Storage Bucket...' },
      { prg: 75, msg: 'Pushing database row metadata record to PostgreSQL...' },
      { prg: 90, msg: 'Executing MUX stream transcoding pipelines...' },
      { prg: 100, msg: 'Transcoding complete! Streaming index live.' }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        const currentStep = steps[stepIndex];
        setProgress(currentStep.prg);
        setStepMessage(currentStep.msg);
        stepIndex++;
      } else {
        clearInterval(interval);
        setUploadStatus('completed');

        // Create random beautiful Unsplash cover for the video
        const categoryMap: { [key: string]: string } = {
          Tech: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=640&q=80',
          Design: 'https://images.unsplash.com/photo-1502462041144-01e91583e762?auto=format&fit=crop&w=640&q=80',
          Nature: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=640&q=80',
          Music: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=640&q=80',
          Coding: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=640&q=80',
          Gaming: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=640&q=80',
        };

        const finalThumb = categoryMap[category] || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=640&q=80';

        // Choose a beautiful stock video loop
        const sampleVideos = [
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
        ];
        const randomVideoUrl = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];

        const newVideo: Video = {
          id: `vid-upload-${Date.now()}`,
          title,
          description: description || 'No description provided.',
          videoUrl: randomVideoUrl,
          thumbnailUrl: finalThumb,
          duration: customDuration || '2:30',
          views: 0,
          uploadedAt: 'Just now',
          category,
          channelId: 'chan-current-mock',
          channelName: 'Lead System Architect',
          channelAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
          likes: 0,
          dislikes: 0,
          likeStatus: 'none',
        };

        // Delay closing modal slightly so they see the completed status
        setTimeout(() => {
          onUploadSuccess(newVideo);
          onClose();
        }, 1500);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0f0f]/40 backdrop-blur-sm transition-all">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-gray-900 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-150">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-red-600 animate-bounce" />
            <span className="font-sans font-bold text-lg text-gray-900">Upload New Video</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-[#0f0f0f] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {uploadStatus === 'idle' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Drag & Drop Frame */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all h-full min-h-[250px] cursor-pointer ${
                  dragActive 
                    ? 'border-red-600 bg-red-50/50 scale-95' 
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }`}
              >
                <input
                  type="file"
                  id="file-upload-input"
                  accept="video/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
                
                <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="p-4 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-[#0f0f0f] transition-colors shadow-sm">
                    <Upload className="w-8 h-8 text-red-600" />
                  </div>
                  
                  {fileSelected ? (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-emerald-600">File Selected Successfully!</p>
                      <p className="text-xs text-gray-600 font-mono max-w-[200px] truncate">{fileSelected.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{(fileSelected.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-800">Drag and drop video files to upload</p>
                      <p className="text-xs text-gray-500">Your videos will be private until you publish them.</p>
                      <span className="inline-block mt-3 bg-white border border-gray-200 px-4 py-2 rounded-full text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-50 transition-all shadow-sm">
                        Select File
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Video Metadata Form */}
              <form onSubmit={startUploadSimulation} className="space-y-4">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 font-mono">Video Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter an catchy title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white border border-gray-200 focus:border-red-600 text-sm text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 font-mono">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Tell viewers about your video..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white border border-gray-200 focus:border-red-600 text-sm text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-colors resize-none"
                  />
                </div>

                {/* Category & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 font-mono">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="bg-white border border-gray-200 focus:border-red-600 text-sm text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-colors cursor-pointer"
                    >
                      {['Coding', 'Tech', 'Design', 'Nature', 'Music', 'Gaming'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 font-mono flex justify-between items-center">
                      <span>Duration (mm:ss) *</span>
                      {durationError && (
                        <span className="text-[10px] text-red-500 font-sans normal-case animate-pulse font-medium">
                          Invalid Format
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 04:15"
                      value={customDuration}
                      onChange={(e) => {
                        setCustomDuration(e.target.value);
                        if (durationError) {
                          const regex = /^\d+:[0-5]\d$/;
                          if (regex.test(e.target.value.trim())) {
                            setDurationError('');
                          }
                        }
                      }}
                      className={`bg-white border text-sm text-gray-900 rounded-xl px-3.5 py-2 outline-none transition-all font-mono ${
                        durationError 
                          ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500' 
                          : 'border-gray-200 focus:border-red-600'
                      }`}
                    />
                    {durationError && (
                      <p className="text-[10px] text-red-500 font-sans font-medium mt-0.5">
                        {durationError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit trigger */}
                <button
                  type="submit"
                  disabled={!fileSelected || !title}
                  className={`w-full py-2.5 rounded-xl font-sans font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                    fileSelected && title
                      ? 'bg-red-600 hover:bg-red-750 text-white shadow-sm cursor-pointer active:scale-[0.98]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Publish & Stream Video
                </button>
              </form>

            </div>
          ) : (
            /* Uploading simulation container */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              {uploadStatus === 'uploading' ? (
                <>
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing ring */}
                    <div className="absolute w-24 h-24 bg-red-50 border border-red-200 rounded-full animate-ping"></div>
                    <div className="bg-white border border-gray-200 p-6 rounded-full shadow-lg relative z-10 text-red-600">
                      <Loader2 className="w-10 h-10 animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-md">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-500 mb-1">
                      <span>Uploading Database Payload</span>
                      <span className="text-red-600">{progress}%</span>
                    </div>
                    {/* Linear Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs font-mono text-gray-400 animate-pulse mt-2">{stepMessage}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-full shadow-lg text-emerald-600 animate-bounce">
                    <Check className="w-12 h-12" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-lg text-gray-900">Video Published Successfully!</h3>
                    <p className="text-sm text-gray-500">Your video is transcoded, secured, and live on the Metatube Home Feed.</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer info warning */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
          <span>This client-side simulation pushes metadata instantly to active state memory, persisting in localStorage. Video file is not fully uploaded to real servers in this demo, saving bandwidth.</span>
        </div>

      </div>
    </div>
  );
}
