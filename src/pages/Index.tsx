
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import FileUpload from '@/components/FileUpload';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const API_URL = 'https://antiplagiat.chatbotiq.ru';

// Функция для получения userId из URL
const getUserIdFromUrl = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('user_id');
  }
  return null;
};

const Index = () => {
  // Инициализация userId сразу при создании компонента
  const [userId, setUserId] = useState<string | null>(getUserIdFromUrl());
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [docxFile, setDocxFile] = useState<File | null>(null);

  // Новые состояния для отслеживания задач
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Убедимся, что страница полностью загружена перед отображением интерфейса
  useEffect(() => {
    setIsLoading(false);
    // Отладка для проверки состояния downloadUrl
    console.log('Initial downloadUrl state:', downloadUrl);
  }, []);

  // Добавим эффект для отслеживания изменений в downloadUrl
  useEffect(() => {
    console.log('downloadUrl changed:', downloadUrl);
  }, [downloadUrl]);

  const handleUpload = async () => {
    if (!pdfFile || !docxFile) {
      toast.error('Пожалуйста, загрузите оба файла: PDF и DOCX');
      return;
    }

    if (!userId) {
      toast.error('Пожалуйста, перейдите в приложение: https://t.me/gpt_answer_bot');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);
    formData.append('docx_file', docxFile);
    formData.append('user_id', userId);

    try {
      const response = await fetch(`/upload`, {
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
        // Вместо статичного 'processing' устанавливаем динамическое сообщение
        setJobStatus('Начало обработки...');
        toast.success('Файлы успешно загружены. Обработка в процессе.');
        // Начинаем опрос статуса задачи с динамическими сообщениями
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

  // Функция для опроса статуса задачи с динамическими сообщениями во время обработки
  const pollJobStatus = (jobId: string) => {
    let counter = 0;
    const processingMessages = [
      "Обработка файлов...",
      "Подождите, файлы обрабатываются...",
      "Ещё немного...",
      "Процесс идёт..."
    ];

    const intervalId = setInterval(async () => {
      try {
        // Добавляем параметр user_id в запрос статуса
        const statusUrl = userId 
          ? `${API_URL}/status/${jobId}?user_id=${userId}`
          : `${API_URL}/status/${jobId}`;
        
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
            // Убедимся, что download_url приходит и правильно устанавливается
            console.log('Setting download URL to:', data.download_url);
            setDownloadUrl(data.download_url);
            toast.success('Обработка завершена! Файл готов к скачиванию.');
            clearInterval(intervalId);
          } else if (data.status === 'failed') {
            setJobStatus('Ошибка обработки');
            toast.error(`Обработка завершилась с ошибкой: ${data.error}`);
            clearInterval(intervalId);
          }
        } else {
          console.error('Error response from status API:', response.status);
          toast.error('Не удалось получить статус задачи');
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Ошибка при опросе статуса задачи:', error);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          // Пустой контейнер во время загрузки, чтобы избежать мигания
          <div></div>
        ) : !userId ? (
          // Если нет user_id, показываем только ссылку на телеграм бот
          <div className="text-center my-16">
            <div className="text-xl mb-6 text-gray-700">
              Для работы с сервисом необходимо перейти по ссылке:
            </div>
            <a 
              href="https://t.me/gpt_answer_bot" 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(
                "px-8 py-3 rounded-lg",
                "bg-blue-500 text-white",
                "transition-all duration-200",
                "hover:bg-blue-600",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              )}
            >
              Перейти в Telegram бот
            </a>
          </div>
        ) : (
          // Если user_id есть, показываем интерфейс загрузки файлов
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Загрузка документов
              </h1>
              <p className="text-gray-600">
                Загрузите файлы ниже
              </p>
            </div>

            {!jobId ? (
              <>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-700">PDF документ: Полный отчет Antiplagiat</h3>
                    <FileUpload
                      acceptedFileType="pdf"
                      onFileSelected={(file) => setPdfFile(file)}
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-700">DOCX документ: Ваша работа по которой получен отчет</h3>
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
              </>
            ) : (
              // Если файлы загружены, отображаем GIF-анимацию
              <div className="text-center my-8">
                {
                  !downloadUrl ? (
                    <img src="/gif1.gif" alt="Обработка файлов" className="mx-auto w-[30%]" />
                  ) : (
                    <img src="/gif2.gif" alt="Обработка завершена" className="mx-auto w-[30%]" />
                  )
                }
              </div>
            )}

            {/* Отображение статуса задачи */}
            {jobStatus && (
              <div className="mt-4 text-center">
                <p>
                  <span className="text-gray-600 text-center">{jobStatus}</span>
                </p>
                {/* Отладочная информация */}
                <p className="text-xs text-gray-400 mt-1">
                  downloadUrl: {downloadUrl ? 'имеется' : 'отсутствует'}
                </p>
              </div>
            )}

            {/* Кнопка скачивания обработанного файла - используем компонент Button из shadcn/ui */}
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
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
