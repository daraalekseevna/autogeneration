// Program.cs
// Полный однофайловый генератор расписания с выводом в 2 листа Excel (1-4 и 5-11).
// Требует ClosedXML (установите через NuGet).

using ClosedXML.Excel;
using SchoolScheduleLessonsPlanning;
using SchoolScheduler;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace SchoolScheduleGenerator
{
    // ===== ВСПОМОГАТЕЛЬНЫЙ КЛАСС ДЛЯ РАСШИРЕНИЙ =====
    public static class Extensions
    {
        public static bool CustomParseToBool(this string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return false;
            return value.Trim().Equals("да", StringComparison.OrdinalIgnoreCase) ||
                   value.Trim().Equals("true", StringComparison.OrdinalIgnoreCase) ||
                   value.Trim() == "1";
        }

        public static string GetCellValue(this IXLCell cell)
        {
            return cell?.GetString()?.Trim() ?? string.Empty;
        }
    }

    // ===== КЛАСС МОДЕЛИ =====
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

    // ===== ОСНОВНОЙ КЛАСС ПРОГРАММЫ =====
    class Program
    {
        private static Dictionary<string, string> _subjectsWithType = new Dictionary<string, string>();

        public static DataTable ReadExcelWithMergedCells(string filePath)
        {
            var dataTable = new DataTable();

            using (var workbook = new XLWorkbook(filePath))
            {
                var worksheet = workbook.Worksheet(1);
                var range = worksheet.RangeUsed();

                for (int col = 1; col <= range.ColumnCount(); col++)
                {
                    dataTable.Columns.Add($"Column_{col}");
                }

                for (int row = 1; row <= range.RowCount(); row++)
                {
                    var dataRow = dataTable.NewRow();
                    for (int col = 1; col <= range.ColumnCount(); col++)
                    {
                        var cell = worksheet.Cell(row, col);
                        dataRow[col - 1] = cell.GetCellValue();
                    }
                    dataTable.Rows.Add(dataRow);
                }
            }

            return dataTable;
        }

        // ========================= MAIN =========================
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

        // ========================= ЧТЕНИЕ ВХОДНЫХ ДАННЫХ =========================
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
                var fullTeacherName = teacherCell.GetCellValue();
                var teacher = new MyTeacher()
                {
                    Subjects = GetSubjects(ws, teacherCell, index),
                    FullName = fullTeacherName,
                    WorkInMainOffice = ws.Cell(index, 3).GetCellValue()?.Split(",").Select(x => x.ToLower().Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).ToList(),
                    Shifts = ws.Cell(index, 4).GetCellValue().Split(" ").Select(x => x.Trim()).Where(x => int.TryParse(x, out var _)).Select(x => int.Parse(x)).ToList(),
                    CanReuseOffice = ws.Cell(index, 5).GetCellValue().CustomParseToBool(),
                    IsOfficeOwner = ws.Cell(index, 6).GetCellValue().CustomParseToBool(),
                    OfficeNumbers = ws.Cell(index, 7).GetCellValue()?.Split(",").Select(x => x.ToLower().Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).ToList(),
                    AcademicDays = ws.Cell(index, 31).GetCellValue()?.Split(",").Select(x => x.ToLower().Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).ToHashSet(),
                    WorkloadInHoursByClass = GetWorkloadInHoursByClass(ws, teacherCell, index),
                };

                teachers.Add(teacher);
                index++;
            }

            var uniqueTeachers = teachers.DistinctBy(x => x.FullName).ToList();

            var parseRes = ParseSubjectsLevelRank(wb.Worksheet("ранг трудности"));
            var eqw = Parse2(wb.Worksheet("ранг трудности"));
            var difficultyByDay = GetDifficultyByDay();
            var difficultyByWeek = GetDifficultyByWeek();

            Dictionary<string, int> factWeghtsPerWeek = new Dictionary<string, int>();

            var allClasses = teachers
                .SelectMany(t => t.WorkloadInHoursByClass.Values.SelectMany(d => d.Keys))
                .Distinct()
                .OrderBy(c =>
                {
                    int n = int.Parse(new string(c.Where(char.IsDigit).ToArray()));
                    return n;
                })
                .ThenBy(c => c[c.Length - 1])
                .ToList();

            foreach (var classNumber in allClasses)
            {
                var s = 0;
                Dictionary<string, string> used = new();
                foreach (var uniqueTeacher in uniqueTeachers)
                {
                    foreach (var workloadInHoursByClassItem in uniqueTeacher.WorkloadInHoursByClass)
                    {
                        foreach (var qq in workloadInHoursByClassItem.Value)
                        {
                            if (qq.Key == classNumber)
                            {
                                if (used.TryAdd(workloadInHoursByClassItem.Key, classNumber))
                                {
                                    var resTemp = parseRes[int.Parse(new string(classNumber.Where(char.IsDigit).ToArray())).ToString()][workloadInHoursByClassItem.Key] * qq.Value;
                                    s += resTemp;
                                }
                            }
                        }
                    }
                }
                factWeghtsPerWeek.Add(classNumber, s);
            }

            var attemt = 1;
            var totalAttemts = 1000;
            Dictionary<string, Dictionary<string, List<(int lessonNumber, string subject, string teacher, string office)>>> res = null;
            while (attemt <= totalAttemts)
            {
                try
                {
                    res = new Scheduler(uniqueTeachers, eqw, parseRes, difficultyByDay, _subjectsWithType, difficultyByWeek).GenerateSchedule();
                    break;
                }
                catch (Exception ex)
                {
                    if (attemt == totalAttemts)
                    {
                        throw;
                    }
                    Console.WriteLine($"Не удалось сгенерировать расписание, попытка № {attemt}");
                    Console.WriteLine(ex.Message);
                    Task.Delay(1000).GetAwaiter().GetResult();
                    attemt++;
                }
            }
            Console.WriteLine($"Расписание успешно сгенерировано");
            Console.WriteLine($"Начало запсывания результатов в эксель");
            ExcelScheduleExporter.Export(res, parseRes, Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "расп.xlsx"));
            Console.WriteLine($"Результаты успешно записаны в эксель");

            return teachers;
        }

        private static List<string> GetSubjects(IXLWorksheet ws, IXLCell teacherCell, int defaultIndexator)
        {
            var range = teacherCell.MergedRange();
            HashSet<string> subjects = new();
            for (int j = range?.RangeAddress?.FirstAddress?.RowNumber ?? defaultIndexator; j <= (range?.RangeAddress?.LastAddress?.RowNumber ?? defaultIndexator); j++)
            {
                var subject = ws.Cell(j, 1).GetCellValue()?.ToLower();
                if (!string.IsNullOrWhiteSpace(subject))
                {
                    subjects.Add(subject.Trim());
                }
            }
            return subjects.ToList();
        }

        private static Dictionary<string, Dictionary<string, int>> GetWorkloadInHoursByClass(IXLWorksheet ws, IXLCell teacherCell, int defaultIndexator)
        {
            Dictionary<string, Dictionary<string, int>> result = new();
            var range = teacherCell.MergedRange();
            var i = 8;
            var attempts = 5;
            var multyLines = false;
            var gradeRowIndex = range?.RangeAddress?.FirstAddress?.RowNumber ?? defaultIndexator;
            while (true)
            {
                string grade = ws.Cell(gradeRowIndex, i).GetCellValue();
                if (string.IsNullOrWhiteSpace(grade) || int.TryParse(grade, out var gradeInteger))
                {
                    attempts--;
                    if (attempts > 0)
                    {
                        i++;
                        continue;
                    }

                    if (multyLines)
                    {
                        gradeRowIndex += 2;
                        multyLines = false;
                        continue;
                    }
                    break;
                }

                int j = (range?.RangeAddress?.FirstAddress?.RowNumber ?? defaultIndexator) + 1;
                while (j <= (range?.RangeAddress?.LastAddress?.RowNumber ?? defaultIndexator))
                {
                    var subjectCell = ws.Cell(j, 1);
                    var subjectCellRange = subjectCell.MergedRange();
                    var subject = ws.Cell(j, 1).GetCellValue()?.ToLower();

                    if (string.IsNullOrWhiteSpace(subject))
                    {
                        j++;
                        continue;
                    }

                    for (int z = subjectCellRange?.RangeAddress?.FirstAddress?.RowNumber ?? j; z <= (subjectCellRange?.RangeAddress?.LastAddress?.RowNumber ?? j); z++)
                    {
                        var loadInGours = ws.Cell(z, i).GetCellValue()?.Trim();
                        if (!int.TryParse(loadInGours, out var loadInGoursInteger))
                        {
                            if (!string.IsNullOrEmpty(loadInGours))
                            {
                                grade = loadInGours;
                            }
                            continue;
                        }

                        if (result.ContainsKey(subject))
                        {
                            if (!result[subject].ContainsKey(grade))
                            {
                                result[subject].Add(grade, int.Parse(loadInGours));
                            }
                        }
                        else
                        {
                            result.Add(subject, new Dictionary<string, int>() { [grade] = int.Parse(loadInGours.Trim()) });
                        }
                    }
                    j++;
                }
                i++;
            }

            return result;
        }

        private static Dictionary<string, Dictionary<string, int>> ParseSubjectsLevelRank(IXLWorksheet ws)
        {
            Dictionary<string, Dictionary<string, int>> result = new();

            for (int j = 2; j <= ws.ColumnCount(); j++)
            {
                var subject = ws.Cell(2, j).GetCellValue()?.ToLower();
                var subjectType = ws.Cell(3, j).GetCellValue()?.ToLower();
                if (!string.IsNullOrEmpty(subject))
                {
                    _subjectsWithType[subject] = subjectType;
                }
                if (!string.IsNullOrWhiteSpace(subject))
                {
                    for (int i = 4; i <= 14; i++)
                    {
                        var grade = ws.Cell(i, 1).GetCellValue();
                        var rank = ws.Cell(i, j).GetCellValue();
                        if (!string.IsNullOrEmpty(rank))
                        {
                            if (result.ContainsKey(grade))
                            {
                                if (!result[grade].ContainsKey(subject))
                                {
                                    result[grade].Add(subject, int.Parse(rank));
                                }
                            }
                            else
                            {
                                result.Add(grade, new Dictionary<string, int>() { [subject] = int.Parse(rank) });
                            }
                        }
                    }
                }
                else
                {
                    break;
                }
            }

            return result;
        }

        private static Dictionary<string, KeyValuePair<int, int>> Parse2(IXLWorksheet ws)
        {
            Dictionary<string, KeyValuePair<int, int>> result = new();

            for (int i = 17; i <= 27; i++)
            {
                var grade = ws.Cell(i, 1).GetCellValue();
                var weekRank = ws.Cell(i, 30).GetCellValue();
                var monthRank = ws.Cell(i, 31).GetCellValue();
                if (!string.IsNullOrEmpty(weekRank))
                {
                    if (!result.ContainsKey(grade))
                    {
                        result.Add(grade, new KeyValuePair<int, int>(int.Parse(weekRank), int.Parse(monthRank)));
                    }
                }
            }

            return result;
        }

        private static Dictionary<int, Dictionary<string, (int from, int to)>> GetDifficultyByDay()
        {
            return new Dictionary<int, Dictionary<string, (int from, int to)>>
            {
                [1] = Create((17,20), (21,24),(24,27), (21,24), (17, 20)),
                [2] = Create((21, 24), (23, 26), (27, 30), (23, 26), (21, 24)),
                [3] = Create((21, 24), (23, 26), (27, 30), (23, 26), (21, 24)),
                [4] = Create((21, 24), (23, 26), (27, 30), (23, 26), (21, 24)),
                [5] = Create((30, 35), (36, 41), (42, 47), (36, 41), (30, 35)),
                [6] = Create((44, 49), (49, 54), (55, 62), (49, 54), (44, 49)),
                [7] = Create((35, 43), (41, 48), (46, 58), (41, 48), (35, 43)),
                [8] = Create((35, 43), (41, 50), (49, 60), (41, 50), (35, 43)),
                [9] = Create((44, 49), (49, 54), (55, 62), (49, 54), (44, 49)),
                [10] = Create((44, 49), (49, 54), (55, 62), (49, 54), (44, 49)),
                [11] = Create((44, 49), (49, 54), (55, 62), (49, 54), (44, 49)),
            };
        }

        private static Dictionary<int, int> GetDifficultyByWeek()
        {
            return new Dictionary<int, int>
            {
                [1] = 110,
                [2] = 124,
                [3] = 124,
                [4] = 124,
                [5] = 185,
                [6] = 252,
                [7] = 228,
                [8] = 233,
                [9] = 261,
                [10] = 257,
                [11] = 267
            };
        }

        private static Dictionary<string, (int from, int to)> Create(params (int from, int to)[] args)
        {
            return new Dictionary<string, (int from, int to)>()
            {
                ["Понедельник"] = args[0],
                ["Вторник"] = args[1],
                ["Среда"] = args[2],
                ["Четверг"] = args[3],
                ["Пятница"] = args[4],
            };
        }
    }

    // ===== ЭКСПОРТЕР В EXCEL =====
    public static class ExcelScheduleExporter
    {
        public static void Export(
            Dictionary<string, Dictionary<string, List<(int lessonNumber, string subject, string teacher, string office)>>> schedule,
            Dictionary<string, Dictionary<string, int>> parseRes,
            string filePath)
        {
            if (schedule == null)
            {
                Console.WriteLine("Расписание пустое, нечего экспортировать");
                return;
            }

            using var workbook = new XLWorkbook();
            
            // Создаем два листа
            var ws1 = workbook.Worksheets.Add("1-4 классы");
            var ws2 = workbook.Worksheets.Add("5-11 классы");

            int row = 1;
            foreach (var classSchedule in schedule)
            {
                var className = classSchedule.Key;
                var days = classSchedule.Value;

                // Определяем лист по номеру класса
                var classNum = int.Parse(new string(className.Where(char.IsDigit).ToArray()));
                var ws = classNum <= 4 ? ws1 : ws2;

                int currentRow = ws.LastRowUsed()?.RowNumber() + 2 ?? 1;
                ws.Cell(currentRow, 1).Value = $"Расписание для {className} класса";
                currentRow += 2;

                // Заголовки
                string[] headers = { "Время", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница" };
                for (int i = 0; i < headers.Length; i++)
                {
                    ws.Cell(currentRow, i + 1).Value = headers[i];
                }
                currentRow++;

                // Заполняем данные
                for (int lesson = 1; lesson <= 8; lesson++)
                {
                    ws.Cell(currentRow, 1).Value = $"{lesson} урок";
                    
                    for (int dayIdx = 0; dayIdx < 5; dayIdx++)
                    {
                        string dayName = dayIdx switch
                        {
                            0 => "Понедельник",
                            1 => "Вторник",
                            2 => "Среда",
                            3 => "Четверг",
                            4 => "Пятница",
                            _ => ""
                        };

                        if (days.ContainsKey(dayName))
                        {
                            var lessonInfo = days[dayName].FirstOrDefault(x => x.lessonNumber == lesson);
                            if (lessonInfo != default)
                            {
                                ws.Cell(currentRow, dayIdx + 2).Value = $"{lessonInfo.subject} ({lessonInfo.teacher})";
                            }
                        }
                    }
                    currentRow++;
                }
            }

            workbook.SaveAs(filePath);
            Console.WriteLine($"Excel файл сохранен: {filePath}");
        }
    }
}