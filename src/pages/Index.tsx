import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import FileUpload from '@/components/FileUpload';
import { cn } from '@/lib/utils';

const API_URL = 'https://antiplagiat.chatbotiq.ru';

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Новые состояния для отслеживания задач
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Получение user_id из URL при загрузке страницы
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('user_id');
    if (userIdParam) {
      setUserId(userIdParam);
    }
  }, []);

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
        
        const response = await fetch(statusUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'processing') {
            // Меняем сообщение динамически
            setJobStatus(processingMessages[counter % processingMessages.length]);
            counter++;
          } else if (data.status === 'completed') {
            setJobStatus('Обработка завершена');
            setDownloadUrl(data.download_url);
            toast.success('Обработка завершена! Файл готов к скачиванию.');
            clearInterval(intervalId);
          } else if (data.status === 'failed') {
            setJobStatus('Ошибка обработки');
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
            Загрузите файлы ниже
          </p>
        </div>

        {/* Если нет userId, показываем сообщение со ссылкой */}
        {!userId ? (
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
        ) : !jobId ? (
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
              {" "}
              <span className="text-gray-600 text-center">{jobStatus}</span>
            </p>
          </div>
        )}

        {/* Кнопка скачивания обработанного файла */}
        {downloadUrl && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                // Добавляем параметр user_id к URL скачивания, если он есть
                const downloadUrlWithUserId = userId 
                  ? `${API_URL}${downloadUrl}`
                  : `${API_URL}${downloadUrl}`;
                window.open(downloadUrlWithUserId, "_blank");
              }}
              className={cn(
                "px-8 py-3 rounded-lg",
                "bg-green-600 text-white",
                "transition-all duration-200",
                "hover:bg-green-500",
                "focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
              )}
            >
              Скачать файл
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
