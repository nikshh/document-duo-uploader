import { useState } from 'react';
import { toast } from 'sonner';
import FileUpload from '@/components/FileUpload';
import { cn } from '@/lib/utils';

// Определяем API URL из переменных окружения (NEXT_PUBLIC_API_URL)
// NEXT_PUBLIC_API_URL можно задать в файле .env.production или аналогичном
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [docxFile, setDocxFile] = useState<File | null>(null);

  // Новые состояния для отслеживания задач
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleUpload = async () => {
    if (!pdfFile || !docxFile) {
      toast.error('Пожалуйста, загрузите оба файла: PDF и DOCX');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);
    formData.append('docx_file', docxFile);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newJobId = data.job_id;
        setJobId(newJobId);
        setJobStatus('processing');
        toast.success('Файлы успешно загружены. Обработка в процессе.');
        // Начинаем опрос статуса задачи
        pollJobStatus(newJobId);
      } else {
        throw new Error('Ошибка загрузки');
      }
    } catch (error) {
      toast.error('Не удалось загрузить файлы');
      console.error('Ошибка загрузки:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Функция для опроса статуса задачи
  const pollJobStatus = (jobId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/status/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setJobStatus(data.status);
          if (data.status === 'completed') {
            setDownloadUrl(data.download_url);
            toast.success('Обработка завершена! Файл готов к скачиванию.');
            clearInterval(intervalId);
          } else if (data.status === 'failed') {
            toast.error(`Обработка завершилась с ошибкой: ${data.error}`);
            clearInterval(intervalId);
          }
        } else {
          toast.error('Не удалось получить статус задачи');
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Ошибка при опросе статуса задачи:', error);
        clearInterval(intervalId);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Загрузка документов
          </h1>
          <p className="text-gray-600">
            Загрузите ваши PDF и DOCX файлы ниже
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">PDF документ</h2>
            <FileUpload
              acceptedFileType="pdf"
              onFileSelected={(file) => setPdfFile(file)}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">DOCX документ</h2>
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
            disabled={!pdfFile || !docxFile || isUploading}
          >
            {isUploading ? 'Загрузка...' : 'Загрузить файлы'}
          </button>
        </div>

        {/* Отображение статуса задачи */}
        {jobStatus && (
          <div className="mt-4 text-center">
            <p>
              Статус задачи:{" "}
              <span className="font-semibold">{jobStatus}</span>
            </p>
          </div>
        )}

        {/* Кнопка скачивания обработанного файла */}
        {downloadUrl && (
          <div className="mt-6 text-center">
            <a
              href={`${API_URL}${downloadUrl}`}
              download
              className={cn(
                "px-8 py-3 rounded-lg",
                "bg-green-600 text-white",
                "transition-all duration-200",
                "hover:bg-green-500",
                "focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
              )}
            >
              Скачать обработанный файл
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
