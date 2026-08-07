import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Invalid file format. Please upload a PDF (.pdf) or Word (.docx) document.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds maximum limit of 15MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleLoadSampleContract = () => {
    const sampleContent = `CONFIDENTIALITY AND SERVICES AGREEMENT

1. INDEMNIFICATION AND LIABILITY
Client agrees to fully indemnify, defend, and hold harmless Service Provider from and against any and all third-party claims, liabilities, costs, and losses without limitation or cap.

2. TERMINATION AND AUTO-RENEWAL
This Agreement shall automatically renew for successive 12-month terms unless Client provides written notice of non-renewal at least 90 days prior to expiration. Service Provider may terminate at any time without cause.

3. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by the laws of New York.`;

    const sampleFile = new File([sampleContent], 'Sample_NDA_Contract.pdf', { type: 'application/pdf' });
    validateAndSetFile(sampleFile);
  };

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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (selectedFile && !isLoading) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Sample Contract Quick Test Pill for Hackathon Judges */}
      <div className="flex items-center justify-between editorial-card p-3.5 px-5 rounded-2xl border border-[#0A192F]/15">
        <div className="flex items-center gap-2 text-xs font-mono text-[#C5A059] font-bold">
          <Sparkles size={14} className="text-[#C5A059] animate-pulse" />
          <span>Hackathon Demo Quick Test:</span>
        </div>
        <button
          type="button"
          onClick={handleLoadSampleContract}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#0A192F] hover:bg-[#112240] text-[#C5A059] border border-[#C5A059]/40 transition-all hover:scale-105"
        >
          Load Sample NDA Contract
        </button>
      </div>

      {/* Drag & Drop Box in Soft Ivory / White with Deep Navy Border */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer ${
          dragActive
            ? 'border-[#C5A059] bg-[#C5A059]/10 scale-[1.01]'
            : selectedFile
            ? 'border-[#0A192F] bg-white'
            : 'border-[#0A192F]/20 bg-white hover:border-[#C5A059] hover:bg-[#F4F5F7]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />

        {selectedFile ? (
          <div className="flex items-center justify-between bg-[#F8F9FA] p-4 rounded-2xl border border-[#0A192F]/15">
            <div className="flex items-center gap-3 text-left overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#0A192F] text-[#C5A059] flex items-center justify-center flex-shrink-0">
                <FileText size={24} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#0A192F] text-sm truncate">{selectedFile.name}</p>
                <p className="text-xs font-mono text-[#212529]/70">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.name.split('.').pop()?.toUpperCase()}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
              title="Remove file"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0A192F] border border-[#C5A059]/30 text-[#C5A059] mx-auto flex items-center justify-center shadow-lg">
              <Upload size={30} />
            </div>

            <div>
              <p className="text-xl font-serif text-[#0A192F]">
                Drag & Drop your contract here
              </p>
              <p className="text-sm text-[#212529] mt-1">
                or <span className="text-[#C5A059] font-bold underline">browse files</span> from your device
              </p>
            </div>

            <div className="inline-flex items-center gap-3 text-xs font-mono text-[#212529] bg-[#F4F5F7] px-4 py-2 rounded-full border border-[#0A192F]/10">
              <span>PDF (.pdf)</span>
              <span>•</span>
              <span>Word (.docx)</span>
              <span>•</span>
              <span>Max 15MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-500/10 p-4 rounded-2xl border border-red-500/30">
          <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Button */}
      {selectedFile && (
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-full btn-gold text-[#0A192F] font-bold text-base shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <ShieldCheck size={20} />
          <span>Analyze Contract for Risks</span>
          <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
};
