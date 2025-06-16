import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DocumentUploader from '@/components/DocumentUploader';
import { Button } from '@/components/ui/button';
const Index = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const userId = searchParams.get('user_id') || undefined;

  // Убедимся, что страница полностью загружена перед отображением интерфейса
  useEffect(() => {
    setIsLoading(false);
  }, []);
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>;
  }

  // Если user_id не передан, отображаем сообщение с ссылкой на бота
  if (!userId) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-xl shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Антиплагиат</h1>
          <p className="text-lg text-gray-700 mb-8">Чтобы использовать сервис повышения оригинальности перейдите в Telegram бота, раздел Дополнительные функции</p>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg" asChild>
            <a href="https://t.me/gpt_answer_bot" target="_blank" rel="noopener noreferrer">
              Перейти в Telegram
            </a>
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Антиплагиат</h1>
          <p className="mt-2 text-gray-600">
            Загрузите оригинальные PDF и DOCX документы для проверки
          </p>
        </header>

        <DocumentUploader userId={userId} />
      </div>
    </div>;
};
export default Index;