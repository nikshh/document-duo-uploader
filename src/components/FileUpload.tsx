import React, { useState } from 'react';
import { Upload, File, CheckCircle2, XCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  acceptedFileType: 'pdf' | 'docx';
  onFileSelected: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ acceptedFileType, onFileSelected }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const acceptedTypes = {
    pdf: { 'application/pdf': ['.pdf'] },
    docx: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptedTypes[acceptedFileType],
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        onFileSelected(acceptedFiles[0]);
        setUploadStatus('success');
        toast.success(`${acceptedFileType.toUpperCase()} file selected successfully`);
      }
    },
    onDropRejected: () => {
      setUploadStatus('error');
      toast.error(`Please upload a valid ${acceptedFileType.toUpperCase()} file`);
    }
  });

  const getIcon = () => {
    if (uploadStatus === 'success') return <CheckCircle2 className="w-10 h-10 text-green-500" />;
    if (uploadStatus === 'error') return <XCircle className="w-10 h-10 text-red-500" />;
    return <Upload className="w-10 h-10 text-gray-400 group-hover:text-gray-600 transition-colors" />;
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer",
        "border-2 border-dashed rounded-xl py-4 px-8",
        "transition-all duration-300 ease-in-out",
        "hover:border-gray-400",
        isDragActive ? "border-gray-400 bg-gray-50" : "border-gray-200",
        "flex flex-col items-center justify-center gap-4",
        "min-h-[100px]"
      )}
    >
      <input {...getInputProps()} />
      {getIcon()}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 mb-1">
          Drop your {acceptedFileType.toUpperCase()} file here
        </p>
        <p className="text-xs text-gray-500">
          or click to browse
        </p>
      </div>
      {file && (
        <div className="mt-2 text-sm text-gray-600">
          <File className="inline-block w-4 h-4 mr-1" />
          {file.name}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
