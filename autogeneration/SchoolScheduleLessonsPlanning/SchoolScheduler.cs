using ClosedXML.Excel;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace SchoolScheduler
{
    public class Subject
    {
        public string Name { get; set; } = string.Empty;
    }

    public class Teacher
    {
        public string FullName { get; set; } = string.Empty;
        public List<SubjectAssignment> Assignments { get; set; } = new();
        public List<DayOfWeek> MethodicalDays { get; set; } = new();
    }

    public class Classroom
    {
        public int Number { get; set; }
    }

    public class SchoolClass
    {
        public string Name { get; set; } = string.Empty; // "5А"
    }

    public class SubjectAssignment
    {
        public Subject Subject { get; set; } = new();
        public Teacher Teacher { get; set; } = new();
        public SchoolClass SchoolClass { get; set; } = new();
        public Classroom Classroom { get; set; } = new();
        public int HoursPerWeek { get; set; }
    }

    public class ExcelParser
    {
        public List<Teacher> LoadFromExcel(string filePath)
        {
            var teachers = new List<Teacher>();
            var schoolClasses = new Dictionary<string, SchoolClass>();

            using var workbook = new XLWorkbook(filePath);
            var ws = workbook.Worksheet(1);

            // Читаем заголовки
            var headers = ws.Row(1).Cells().Select(c => c.GetString().Trim()).ToList();

            int subjectCol = headers.IndexOf("Предмет") + 1;
            int teacherCol = headers.IndexOf("ФИО учителя") + 1;
            int classroomCol = headers.IndexOf("Номер кабинета") + 1;

            // Классы = всё после "Номер кабинета"
            var classHeaders = headers.Skip(classroomCol).ToList();

            // Читаем строки
            foreach (var row in ws.RowsUsed().Skip(1))
            {
                var subjectName = row.Cell(subjectCol).GetString().Trim();
                var teacherName = row.Cell(teacherCol).GetString().Trim();
                var classroomNumber = row.Cell(classroomCol).GetString().Trim();

                if (string.IsNullOrWhiteSpace(teacherName) || string.IsNullOrWhiteSpace(subjectName))
                    continue;

                var subject = new Subject { Name = subjectName };
                var teacher = teachers.FirstOrDefault(t => t.FullName == teacherName);
                if (teacher == null)
                {
                    teacher = new Teacher { FullName = teacherName };
                    teachers.Add(teacher);
                }

                var classroom = int.TryParse(classroomNumber, out int num)
                    ? new Classroom { Number = num }
                    : new Classroom { Number = -1 };

                // По каждому классу
                for (int i = 0; i < classHeaders.Count; i++)
                {
                    var className = classHeaders[i];
                    if (!schoolClasses.ContainsKey(className))
                        schoolClasses[className] = new SchoolClass { Name = className };

                    var cell = row.Cell(classroomCol + i + 1);
                    var value = cell.GetString().Trim();

                    if (string.IsNullOrEmpty(value)) continue;

                    // Если "X" или "-": методический день
                    if (value.Equals("X", StringComparison.OrdinalIgnoreCase) ||
                        value.Equals("-", StringComparison.OrdinalIgnoreCase))
                    {
                        // тут можно маппить на конкретный день недели, если в таблице есть дата
                        continue;
                    }

                    if (int.TryParse(value, out int hours) && hours > 0)
                    {
                        teacher.Assignments.Add(new SubjectAssignment
                        {
                            Subject = subject,
                            Teacher = teacher,
                            SchoolClass = schoolClasses[className],
                            Classroom = classroom,
                            HoursPerWeek = hours
                        });
                    }
                }
            }

            return teachers;
        }
    }
}