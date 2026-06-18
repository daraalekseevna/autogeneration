// Program.cs
// Полный однофайловый генератор расписания с выводом в 2 листа Excel (1-4 и 5-11).
// Требует ClosedXML (установите через NuGet).

using ClosedXML.Excel;
using DocumentFormat.OpenXml.Bibliography;
using SchoolScheduleLessonsPlanning;
using SchoolScheduleLessonsPlanning.Extensions;
using SchoolScheduleLessonsPlanning.Models;
using SchoolScheduleLessonsPlanning.Services;
using SchoolScheduler;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace SchoolScheduleGenerator
{
    class Program
    {
        private static Dictionary<string, string> _subjectsWithType = new Dictionary<string, string>();
        public static DataTable ReadExcelWithMergedCells(string filePath)
        {
            var dataTable = new DataTable();

            using (var workbook = new XLWorkbook(filePath))
            {
                var worksheet = workbook.Worksheet(1);

                // Определяем диапазон данных
                var range = worksheet.RangeUsed();

                // Создаем колонки
                for (int col = 1; col <= range.ColumnCount(); col++)
                {
                    dataTable.Columns.Add($"Column_{col}");
                }

                // Заполняем данные
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

            var outputPath = Path.Combine(Path.GetDirectoryName(inputPath) ?? ".", "расписание_сгенерировано.xlsx");

            Console.WriteLine("Читаю входной Excel...");
            ReadInput(inputPath);
        }

        // ========================= ЧТЕНИЕ ВХОДНЫХ ДАННЫХ =========================
        static List<MyTeacher> ReadInput(string path)
        {
            List<MyTeacher> teachers = [];

            using var wb = new XLWorkbook(path);

            // ---------- Лист "нагрузка" ----------
            if (!wb.Worksheets.Contains("нагрузка"))
            {
                Console.WriteLine("[ERROR] Нет листа 'нагрузка' в файле.");
                return teachers;
            }

            var ws = wb.Worksheet("нагрузка");

            // Определим колонки: по формату вашего файла:
            // 1: Предмет
            // 2: ФИО учителя (в нашем раннем варианте это 2, но в предыдущих скриптах использовалось 1/2 — уточним)
            // В ваших старых примерах предмет был в колонке 1, ФИО в 2 — будем читать так:
            int lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
            int lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 0;
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
            var qq23 = 12;

            var parseRes = ParseSubjectsLevelRank(wb.Worksheet("ранг трудности"));

            var eqw = Parse2(wb.Worksheet("ранг трудности"));
            var difficultyByDay = GetDifficultyByDay();
            var difficultyByWeek = GetDifficultyByWeek();
            //CheckDifficultyVsSubjects(difficultyByDay, parseRes);

            //
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
                Dictionary<string, string> used = [];
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
            Console.Write($"Ожидаемый недельный вес берется из таблицы 'Примерное распределение' -> поля 'главное чтобы сумма была такой:'");
            foreach (var item in factWeghtsPerWeek) //factWeghtsPerWeek //difficultyByWeek
            {
                var expectedValue = difficultyByWeek[int.Parse(new string(item.Key.Where(char.IsDigit).ToArray()))];
                if (item.Value != expectedValue)
                {
                    var t = 3 * 7 + 2 * 4 + 6 * 10 + 1 * 10 + 3 * 8 + 3 * 2 + 2 * 6 + 2 * 7 + 2 * 10 + 3 * 8 + 2 * 9 + 2 * 7 + 1 * 1 + 1 * 3 + 1 * 1;
                    Console.Write($"Ожидаемый недельный вес в {item.Key} классе = {expectedValue}, фактический = {item.Value}, ");
                    if (item.Key == "7Б")
                    {
                        Console.Write("Вычислено в ручную по экселю = 228");
                    }
                    else if (item.Key == "8А")
                    {
                        Console.Write("Вычислено в ручную по экселю = 236");
                    } else if(item.Key == "9А")
                    {
                        var t1 = 3 * 6 + 3 * 7 + 6 * 8 + 3 * 9 + 2 * 2 + 2 * 5 + 2 * 7 + 2 * 12 + 1 * 5 + 3 * 10 + 3 * 13 + 2 * 7 + 1 * 4 + 1 * 3;
                        Console.Write($"Вычислено в ручную по экселю = {t1}");
                    } else if(item.Key == "10А")
                    {
                        var t2 = 2 * 9 + 1 * 8 + 3 * 8 + 8 * 11 + 3 * 8 + 3 * 1 + 1 * 3 + 1 * 7 + 11 + 2 * 5 + 4 * 5 + 1 * 3 + 2 * 12 + 2 * 6 + 2 * 1;
                        Console.Write($"Вычислено в ручную по экселю = {t2}");
                    }else if(item.Key == "11А")
                    {
                        var t3 = 3 * 8 + 2 * 9 + 1 * 9 + 8 * 11 + 3 * 8 + 2 * 1 + 1 * 3 + 1 * 7 + 1 * 7 + 1 * 11 + 2 * 5 + 4 * 5 + 2 * 12 + 2 * 6 + 1 * 6 + 1 * 2;
                        Console.Write($"Вычислено в ручную по экселю = {t3}");
                    }

                    Console.WriteLine();
                }
            }

            //
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
                    //Console.WriteLine(ex.Message);
                    Task.Delay(1000).GetAwaiter().GetResult();
                    attemt++;
                }
            }
            Console.WriteLine($"Расписание успешно сгенерировано");
            Console.WriteLine($"Начало запсывания результатов в эксель");
            ExcelScheduleExporter.Export(res, parseRes, Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "расп.xlsx"));
            Console.WriteLine($"Результаты успешно записаны в эксель");
            //for (int i = 3; i <= lastRow; i++)
            //{
            //    for (int c = 1; c <= 2; c++)
            //    {
            //        var cell = ws.Cell(i, c);
            //        var t = GetCellValue(cell);
            //        var qq1 = cell.MergedRange();
            //        var text = cell.GetString().Trim();
            //        if (!string.IsNullOrWhiteSpace(text))
            //        {
            //            var qq = 1;
            //        }
            //    }
            //}

            if (lastRow == 0 || lastCol == 0)
            {
                Console.WriteLine("[ERROR] Лист 'нагрузка' пустой.");
                return teachers;
            }

            //DataTable table = ReadExcelWithMergedCells(path);
            //foreach (DataRow row in table.Rows)
            //{
            //    for (int i = 0; i < table.Columns.Count; i++)
            //    {
            //        Console.Write($"{row[i]}\t");
            //    }
            //    Console.WriteLine();
            //}

            return teachers;
        }

        private static List<string> GetSubjects(IXLWorksheet ws, IXLCell teacherCell, int defaultIndexator)
        {
            var range = teacherCell.MergedRange();
            HashSet<string> subjects = [];
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
            Dictionary<string, Dictionary<string, int>> result = [];
            var range = teacherCell.MergedRange();
            var i = 8;
            var attempts = 5;
            var multyLines = false;
            var gradeRowIndex = range?.RangeAddress?.FirstAddress?.RowNumber ?? defaultIndexator;
            while (true)
            {
                var tempResult = new Dictionary<string, List<int>>();
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

                var needBreak = false;
                int j = (range?.RangeAddress?.FirstAddress?.RowNumber ?? defaultIndexator) + 1;
                while (j <= (range?.RangeAddress?.LastAddress?.RowNumber ?? defaultIndexator))
                {
                    var subjectCell = ws.Cell(j, 1);
                    var subjectCellRange = subjectCell.MergedRange();
                    var subject = ws.Cell(j, 1).GetCellValue()?.ToLower();

                    if (string.IsNullOrWhiteSpace(subject))
                    {
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
            Dictionary<string, Dictionary<string, int>> result = [];

            for (int j = 2; j <= ws.ColumnCount(); j++)
            {
                var subject = ws.Cell(2, j).GetCellValue()?.ToLower();
                var subjectType = ws.Cell(3, j).GetCellValue()?.ToLower();
                _subjectsWithType.Add(subject, subjectType);
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
            Dictionary<string, KeyValuePair<int, int>> result = [];

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
            //_days = { "Понедельник", "Вторник", "Среда", "Четверг", "Пятница" };
            Dictionary<int, Dictionary<string, (int from, int to)>> result = new Dictionary<int, Dictionary<string, (int from, int to)>>
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

            return result;
        }

        private static Dictionary<int, int> GetDifficultyByWeek()
        {
            //_days = { "Понедельник", "Вторник", "Среда", "Четверг", "Пятница" };
            Dictionary<int, int> result = new Dictionary<int, int>
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

            return result;
        }

        private static void CheckDifficultyVsSubjects(
    Dictionary<int, Dictionary<string, int>> difficultyByDay,
    Dictionary<string, Dictionary<string, int>> parseRes)
        {
            foreach (var classEntry in parseRes)
            {
                string classNumberStr = classEntry.Key; // "10", "11" и т.д.
                int classNum = int.Parse(classNumberStr);

                int totalSubjectWeight = classEntry.Value.Values.Sum();
                int totalDifficultyLimit = 0;

                if (difficultyByDay.TryGetValue(classNum, out var dayLimits))
                {
                    totalDifficultyLimit = dayLimits.Values.Sum();
                }
                else
                {
                    Console.WriteLine($"Для класса {classNumberStr} нет данных по лимитам веса.");
                    continue;
                }

                if (totalSubjectWeight > totalDifficultyLimit)
                {
                    Console.WriteLine($"⚠ Класс {classNumberStr}: суммарный вес уроков = {totalSubjectWeight}, " +
                                      $"сумма лимитов по дням = {totalDifficultyLimit} → НЕДОСТАТОЧНО лимитов!");
                }
                else
                {
                    Console.WriteLine($"Класс {classNumberStr}: суммарный вес уроков = {totalSubjectWeight}, " +
                                      $"сумма лимитов по дням = {totalDifficultyLimit} → лимитов хватает.");
                }
            }
        }

        private static Dictionary<string, (int from, int to)> Create(params (int from,int to)[] args)
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
}