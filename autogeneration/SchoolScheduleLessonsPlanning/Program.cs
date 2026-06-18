using ClosedXML.Excel;
using SchoolScheduler;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace SchoolScheduleGenerator
{
    public class MyTeacher
    {
        public string FullName { get; set; } = string.Empty;
        public List<string> Subjects { get; set; } = new();
        public List<string> WorkInMainOffice { get; set; } = new();
        public List<int> Shifts { get; set; } = new();
        public bool CanReuseOffice { get; set; }
        public bool IsOfficeOwner { get; set; }
        public List<string> OfficeNumbers { get; set; } = new();
        public HashSet<string> AcademicDays { get; set; } = new();
        public Dictionary<string, Dictionary<string, int>> WorkloadInHoursByClass { get; set; } = new();
    }

    class Program
    {
        private static Dictionary<string, string> _subjectsWithType = new Dictionary<string, string>();

        static void Main(string[] args)
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;

            string inputPath = args.Length > 0 ? args[0] : Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "нагрузка.xlsx");
            if (!File.Exists(inputPath))
            {
                Console.WriteLine($"Не найден входной файл: {inputPath}");
                return;
            }

            Console.WriteLine("Читаю входной Excel...");
            ReadInput(inputPath);
        }

        static List<MyTeacher> ReadInput(string path)
        {
            List<MyTeacher> teachers = new();

            using var wb = new XLWorkbook(path);

            if (!wb.Worksheets.Contains("нагрузка"))
            {
                Console.WriteLine("[ERROR] Нет листа 'нагрузка' в файле.");
                return teachers;
            }

            var ws = wb.Worksheet("нагрузка");

            int lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
            int index = 3;
            while (index <= lastRow)
            {
                var teacherCell = ws.Cell(index, 2);
                var teacher = new MyTeacher()
                {
                    FullName = teacherCell.GetString().Trim(),
                    Subjects = GetSubjects(ws, teacherCell, index),
                    WorkInMainOffice = ws.Cell(index, 3).GetString()?.Split(",").Select(x => x.ToLower().Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).ToList() ?? new List<string>(),
                    Shifts = ws.Cell(index, 4).GetString().Split(" ").Select(x => x.Trim()).Where(x => int.TryParse(x, out var _)).Select(x => int.Parse(x)).ToList(),
                    CanReuseOffice = ws.Cell(index, 5).GetString().Trim().Equals("да", StringComparison.OrdinalIgnoreCase),
                    IsOfficeOwner = ws.Cell(index, 6).GetString().Trim().Equals("да", StringComparison.OrdinalIgnoreCase),
                    OfficeNumbers = ws.Cell(index, 7).GetString()?.Split(",").Select(x => x.ToLower().Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).ToList() ?? new List<string>(),
                    AcademicDays = ws.Cell(index, 31).GetString()?.Split(",").Select(x => x.ToLower().Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).ToHashSet() ?? new HashSet<string>(),
                };
                teachers.Add(teacher);
                index++;
            }

            Console.WriteLine($"Найдено {teachers.Count} учителей");
            return teachers;
        }

        private static List<string> GetSubjects(IXLWorksheet ws, IXLCell teacherCell, int defaultIndexator)
        {
            var range = teacherCell.MergedRange();
            HashSet<string> subjects = new();
            int startRow = range?.RangeAddress?.FirstAddress?.RowNumber ?? defaultIndexator;
            int endRow = range?.RangeAddress?.LastAddress?.RowNumber ?? defaultIndexator;
            
            for (int j = startRow; j <= endRow; j++)
            {
                var subject = ws.Cell(j, 1).GetString()?.ToLower().Trim();
                if (!string.IsNullOrWhiteSpace(subject))
                {
                    subjects.Add(subject);
                }
            }
            return subjects.ToList();
        }
    }
}