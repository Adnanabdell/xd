import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { editImage } from '../services/aiService';
import { Wand2, Upload, Image as ImageIcon, Download, RefreshCw, AlertCircle } from 'lucide-react';

export const ImageEditor: React.FC = () => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      setMimeType(file.type);
      setGeneratedImage(null); // Reset previous result
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Extract pure base64 without data prefix for the API
      const base64Data = selectedImage.split(',')[1];
      const result = await editImage(base64Data, mimeType, prompt);
      
      if (result) {
        setGeneratedImage(result);
      } else {
        setError("Failed to generate image. Please try a different prompt.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while connecting to the AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <Wand2 size={32} className="text-yellow-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('aiEditorTitle')}</h1>
            <p className="text-indigo-100 mt-1">{t('aiEditorSubtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Upload size={18} className="mr-2 text-violet-600" /> {t('uploadImage')}
            </h3>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center text-gray-400">
                <ImageIcon size={48} className="mb-3 text-gray-300" />
                <p className="text-sm font-medium">{t('dragDrop')}</p>
                <p className="text-xs mt-1 text-gray-400">JPG, PNG, WEBP</p>
              </div>
            </div>
          </div>

          {/* Prompt Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Wand2 size={18} className="mr-2 text-violet-600" /> {t('promptLabel')}
            </h3>
            
            <textarea
              className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none transition-all"
              rows={4}
              placeholder={t('promptPlaceholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            ></textarea>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start">
                <AlertCircle size={16} className="mt-0.5 mr-2 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedImage || !prompt.trim() || loading}
              className="mt-4 w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <RefreshCw size={20} className="mr-2 animate-spin" /> {t('processing')}
                </>
              ) : (
                <>
                  <Wand2 size={20} className="mr-2" /> {t('generate')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-2 space-y-6">
           {/* Original Image Preview */}
           {selectedImage && (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-4 border-b border-gray-100 bg-gray-50 font-medium text-gray-600">
                 {t('original')}
               </div>
               <div className="p-4 flex justify-center bg-checkerboard">
                 <img 
                   src={selectedImage} 
                   alt="Original" 
                   className="max-h-96 rounded-lg object-contain shadow-sm"
                 />
               </div>
             </div>
           )}

           {/* Result Image Preview */}
           {generatedImage && (
             <div className="bg-white rounded-2xl shadow-md border border-violet-100 overflow-hidden ring-1 ring-violet-200">
               <div className="p-4 border-b border-violet-100 bg-violet-50 flex justify-between items-center">
                 <span className="font-bold text-violet-800">{t('result')}</span>
                 <a 
                   href={generatedImage} 
                   download="edited-image.png"
                   className="text-violet-600 hover:text-violet-800 flex items-center text-sm font-medium"
                 >
                   <Download size={16} className="mr-1" /> Download
                 </a>
               </div>
               <div className="p-4 flex justify-center bg-checkerboard">
                 <img 
                   src={generatedImage} 
                   alt="AI Result" 
                   className="max-h-[500px] rounded-lg object-contain shadow-lg"
                 />
               </div>
             </div>
           )}
           
           {!selectedImage && !generatedImage && (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <ImageIcon size={64} className="mb-4 text-gray-300" />
                <p className="text-lg">Upload an image to start editing</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
