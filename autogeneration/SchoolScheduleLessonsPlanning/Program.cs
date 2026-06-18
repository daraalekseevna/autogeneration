using System;
using System.IO;
using ClosedXML.Excel;

namespace SchoolScheduleGenerator
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("✅ Микросервис запущен!");
            Console.WriteLine($"📁 Текущая директория: {AppDomain.CurrentDomain.BaseDirectory}");
            
            string inputPath = args.Length > 0 ? args[0] : Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "нагрузка.xlsx");
            
            if (!File.Exists(inputPath))
            {
                Console.WriteLine($"❌ Файл не найден: {inputPath}");
                Console.WriteLine("ℹ️ Ожидается файл нагрузка.xlsx в корневой папке");
                return;
            }

            Console.WriteLine("📖 Читаю файл...");
            try
            {
                using var wb = new XLWorkbook(inputPath);
                Console.WriteLine($"✅ Найдено листов: {wb.Worksheets.Count()}");
                Console.WriteLine("✅ Расписание успешно прочитано!");
                
                foreach (var sheet in wb.Worksheets)
                {
                    Console.WriteLine($"📄 Лист: {sheet.Name}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Ошибка: {ex.Message}");
            }
        }
    }
}