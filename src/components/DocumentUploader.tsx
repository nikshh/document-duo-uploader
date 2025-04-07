
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const API_URL = 'https://antiplagiat.chatbotiq.ru';

interface DocumentUploaderProps {
  userId?: string;
}

const DocumentUploader = ({ userId }: DocumentUploaderProps) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const processingMessages = [
    'Обрабатываем документы...',
    'Анализируем содержимое...',
    'Проверяем на плагиат...',
    'Генерируем отчет...',
    'Почти готово...',
  ];

  const handleUpload = async () => {
    if (!pdfFile || !docxFile) {
      toast.error('Пожалуйста, загрузите оба файла (PDF и DOCX)');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('docx', docxFile);
      
      // Добавляем user_id если он есть
      if (userId) {
        formData.append('user_id', userId);
      }

      // Создаем URL для загрузки
      const uploadUrl = `${API_URL}/upload`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      // Имитация загрузки, чтобы показать прогресс
      const simulateProgress = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(simulateProgress);
            return 90;
          }
          return newProgress;
        });
      }, 300);

      if (!response.ok) {
        throw new Error(`Ошибка при загрузке: ${response.status}`);
      }

      const data = await response.json();
      
      // Завершаем прогресс загрузки
      clearInterval(simulateProgress);
      setUploadProgress(100);
      
      if (data.job_id) {
        setJobId(data.job_id);
        setIsProcessing(true);
        setJobStatus('Начинаем обработку...');
        toast.success('Файлы успешно загружены! Начинаем обработку.');
        
        // Запускаем проверку статуса задачи
        startJobStatusCheck(data.job_id);
      } else {
        throw new Error('Не получен ID задачи от сервера');
      }
    } catch (error) {
      toast.error(`Ошибка при загрузке: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Функция для периодической проверки статуса задачи
  const startJobStatusCheck = (id: string) => {
    let counter = 0;
    
    const intervalId = setInterval(async () => {
      try {
        const statusUrl = userId 
          ? `${API_URL}/status/${id}?user_id=${userId}`
          : `${API_URL}/status/${id}`;
        
        console.log('Checking status at URL:', statusUrl);
        const response = await fetch(statusUrl);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Received status data:', data);
          
          if (data.status === 'processing') {
            // Меняем сообщение динамически
            setJobStatus(processingMessages[counter % processingMessages.length]);
            counter++;
          } else if (data.status === 'completed') {
            setJobStatus('Обработка завершена');
            console.log('Setting download URL to:', data.download_url);
            setDownloadUrl(data.download_url);
            toast.success('Обработка завершена! Файл готов к скачиванию.');
            clearInterval(intervalId);
          } else if (data.status === 'failed') {
            setJobStatus('Ошибка при обработке файлов');
            toast.error('Ошибка при обработке файлов');
            clearInterval(intervalId);
          }
        } else {
          console.error('Error response from status API:', response.status);
          toast.error('Не удалось получить статус задачи');
          clearInterval(intervalId);
        }
      } catch (error) {
        toast.error('Ошибка при проверке статуса задачи');
        clearInterval(intervalId);
      }
    }, 2000);
  };

  // Функция для скачивания файла
  const handleDownload = () => {
    if (!downloadUrl) return;
    
    const downloadUrlWithUserId = userId 
      ? `${API_URL}${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}user_id=${userId}`
      : `${API_URL}${downloadUrl}`;
    
    console.log('Opening download URL:', downloadUrlWithUserId);
    window.open(downloadUrlWithUserId, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PDF Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-medium mb-4 text-center">PDF Документ</h2>
          <FileUpload 
            acceptedFileType="pdf"
            onFileSelected={(file) => setPdfFile(file)} 
          />
        </div>
                
        {/* DOCX Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-medium mb-4 text-center">DOCX Документ</h2>
          <FileUpload 
            acceptedFileType="docx"
            onFileSelected={(file) => setDocxFile(file)} 
          />
        </div>
      </div>

      {/* Upload Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleUpload}
          disabled={isUploading || isProcessing || !pdfFile || !docxFile}
          className={cn(
            "px-8 py-3 rounded-lg",
            "transition-all duration-200",
            "w-full md:w-auto",
            (isUploading || isProcessing) ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-500"
          )}
          size="lg"
        >
          {isUploading ? 'Загрузка...' : isProcessing ? 'Обработка...' : 'Загрузить файлы'}
        </Button>
      </div>

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="mt-4">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-gray-500 text-center mt-1">{uploadProgress}%</p>
        </div>
      )}

      {/* Processing Status */}
      {jobStatus && (
        <div className="mt-4 text-center">
          <p>
            <span className="text-gray-600 text-center">{jobStatus}</span>
          </p>
        </div>
      )}

      {/* Download Button */}
      {downloadUrl && (
        <div className="mt-6 text-center">
          <Button
            onClick={handleDownload}
            variant="default"
            size="lg"
            className="bg-green-600 hover:bg-green-500"
          >
            <Download className="mr-2" />
            Скачать файл
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
