
import { useState } from 'react';
import { toast } from 'sonner';
import FileUpload from '@/components/FileUpload';
import { cn } from '@/lib/utils';

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [docxFile, setDocxFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!pdfFile || !docxFile) {
      toast.error('Please upload both PDF and DOCX files');
      return;
    }

    const formData = new FormData();
    formData.append('pdf_file', pdfFile);
    formData.append('docx_file', docxFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Files uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Document Upload
          </h1>
          <p className="text-gray-600">
            Upload your PDF and DOCX files below
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">PDF Document</h2>
            <FileUpload
              acceptedFileType="pdf"
              onFileSelected={(file) => setPdfFile(file)}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">DOCX Document</h2>
            <FileUpload
              acceptedFileType="docx"
              onFileSelected={(file) => setDocxFile(file)}
            />
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handleUpload}
            className={cn(
              "px-8 py-3 rounded-lg",
              "bg-gray-900 text-white",
              "transition-all duration-200",
              "hover:bg-gray-800",
              "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={!pdfFile || !docxFile}
          >
            Upload Files
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
