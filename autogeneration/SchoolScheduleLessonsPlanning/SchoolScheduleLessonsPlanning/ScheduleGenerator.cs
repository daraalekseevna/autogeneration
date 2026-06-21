using System.Text.Json;
using System.Text.Json.Serialization;

namespace SchoolScheduleLessonsPlanning
{
    public class DoubleConverter : JsonConverter<double>
    {
        public override double Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Number)
                return reader.GetDouble();
            if (reader.TokenType == JsonTokenType.String)
            {
                var str = reader.GetString();
                if (double.TryParse(str, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var val))
                    return val;
            }
            return 0;
        }

        public override void Write(Utf8JsonWriter writer, double value, JsonSerializerOptions options)
        {
            writer.WriteNumberValue(value);
        }
    }

    public class SchoolClass
    {
        [JsonPropertyName("id")] public int Id { get; set; }
        [JsonPropertyName("name")] public string Name { get; set; } = "";
        [JsonPropertyName("number")] public int Number { get; set; }
        [JsonPropertyName("letter")] public string Letter { get; set; } = "";
        [JsonPropertyName("shift")] public int Shift { get; set; }
        [JsonPropertyName("max_lessons_per_day")] public int? MaxLessonsPerDay { get; set; }
    }

    public class Teacher
    {
        [JsonPropertyName("id")] public int Id { get; set; }
        [JsonPropertyName("last_name")] public string LastName { get; set; } = "";
        [JsonPropertyName("first_name")] public string FirstName { get; set; } = "";
        [JsonPropertyName("color")] public string Color { get; set; } = "#3b82f6";
        [JsonPropertyName("lesson_ids")] public List<int> LessonIds { get; set; } = new();
        [JsonPropertyName("class_ids")] public List<int> ClassIds { get; set; } = new();
        [JsonPropertyName("room_ids")] public List<int> RoomIds { get; set; } = new();
    }

    public class Room
    {
        [JsonPropertyName("id")] public int Id { get; set; }
        [JsonPropertyName("number")] public string Number { get; set; } = "";
    }

    public class Lesson
    {
        [JsonPropertyName("id")] public int Id { get; set; }
        [JsonPropertyName("name")] public string Name { get; set; } = "";
    }

    public class SubjectHours
    {
        [JsonPropertyName("grade")] public int Grade { get; set; }
        [JsonPropertyName("subject_id")] public int SubjectId { get; set; }
        [JsonConverter(typeof(DoubleConverter))]
        [JsonPropertyName("hours_per_week")] public double HoursPerWeek { get; set; }
    }

    public class ScheduleSettings
    {
        [JsonPropertyName("workDays")] public List<string> WorkDays { get; set; } = new();
        [JsonPropertyName("maxLessonsPerDay")] public int MaxLessonsPerDay { get; set; } = 7;
        [JsonPropertyName("secondShift")] public bool SecondShift { get; set; }
        [JsonPropertyName("secondShiftMaxLessonsPerDay")] public int SecondShiftMaxLessonsPerDay { get; set; } = 5;
        [JsonPropertyName("secondShiftStartLesson")] public int SecondShiftStartLesson { get; set; } = 5;
    }

    public class GenerationResult
    {
        public Dictionary<string, object> Schedule { get; set; } = new();
        public bool Success { get; set; }
        public string Error { get; set; } = "";
        public int TotalLessons { get; set; }
        public int ClassesProcessed { get; set; }
    }

    public class ScheduleGenerator
    {
        private readonly Random _random = new Random();
        
        private List<SchoolClass> _classes = new();
        private List<Teacher> _teachers = new();
        private List<Room> _rooms = new();
        private List<Lesson> _lessons = new();
        private List<SubjectHours> _subjectHours = new();
        private ScheduleSettings _settings = new();
        
        private Dictionary<int, List<int>> _teacherClasses = new();
        private Dictionary<int, List<int>> _teacherLessons = new();
        private Dictionary<int, List<int>> _teacherRooms = new();
        private Dictionary<int, string> _roomMap = new();

        public async Task<bool> LoadDataAsync(string rulesUrl, string token)
        {
            try
            {
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
                httpClient.Timeout = TimeSpan.FromSeconds(120);
                
                Console.WriteLine("=== ЗАГРУЗКА ПРАВИЛ ИЗ БД ===");
                var response = await httpClient.GetAsync(rulesUrl);
                if (!response.IsSuccessStatusCode) 
                {
                    Console.WriteLine($"❌ HTTP ошибка: {response.StatusCode}");
                    return false;
                }
                
                var json = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"📄 Получен JSON (первые 500 символов): {json.Substring(0, Math.Min(500, json.Length))}");
                
                var options = new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                };
                
                var data = JsonSerializer.Deserialize<Dictionary<string, object>>(json, options);
                
                if (data?.ContainsKey("subjectHours") == true)
                {
                    var subjectHoursJson = data["subjectHours"].ToString()!;
                    Console.WriteLine($"📊 subjectHours JSON: {subjectHoursJson.Substring(0, Math.Min(300, subjectHoursJson.Length))}");
                    
                    var tempOptions = new JsonSerializerOptions 
                    { 
                        PropertyNameCaseInsensitive = true,
                        NumberHandling = JsonNumberHandling.AllowReadingFromString
                    };
                    tempOptions.Converters.Add(new DoubleConverter());
                    
                    _subjectHours = JsonSerializer.Deserialize<List<SubjectHours>>(subjectHoursJson, tempOptions) ?? new();
                    Console.WriteLine($"✅ Загружено {_subjectHours.Count} записей часов");
                    
                    foreach (var sh in _subjectHours.Take(5))
                    {
                        Console.WriteLine($"   Grade={sh.Grade}, SubjectId={sh.SubjectId}, Hours={sh.HoursPerWeek}");
                    }
                }
                
                if (data?.ContainsKey("classes") == true)
                    _classes = JsonSerializer.Deserialize<List<SchoolClass>>(data["classes"].ToString()!, options) ?? new();
                if (data?.ContainsKey("teachers") == true)
                    _teachers = JsonSerializer.Deserialize<List<Teacher>>(data["teachers"].ToString()!, options) ?? new();
                if (data?.ContainsKey("rooms") == true)
                    _rooms = JsonSerializer.Deserialize<List<Room>>(data["rooms"].ToString()!, options) ?? new();
                if (data?.ContainsKey("lessons") == true)
                    _lessons = JsonSerializer.Deserialize<List<Lesson>>(data["lessons"].ToString()!, options) ?? new();
                if (data?.ContainsKey("scheduleSettings") == true)
                    _settings = JsonSerializer.Deserialize<ScheduleSettings>(data["scheduleSettings"].ToString()!, options) ?? new();
                
                foreach (var t in _teachers)
                {
                    _teacherClasses[t.Id] = t.ClassIds ?? new List<int>();
                    _teacherLessons[t.Id] = t.LessonIds ?? new List<int>();
                    _teacherRooms[t.Id] = t.RoomIds ?? new List<int>();
                }
                foreach (var r in _rooms)
                    _roomMap[r.Id] = r.Number;
                
                Console.WriteLine($"✅ Загружено: классы={_classes.Count}, учителя={_teachers.Count}, предметы={_lessons.Count}, часы={_subjectHours.Count}");
                return true;
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"❌ JSON ошибка: {ex.Message}");
                Console.WriteLine($"Path: {ex.Path}");
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Ошибка: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }
        }

        public GenerationResult Generate()
        {
            var result = new GenerationResult();
            var schedule = new Dictionary<string, object>();
            
            var daysMap = new Dictionary<string, string>
            {
                { "Пн", "Понедельник" }, { "Вт", "Вторник" }, { "Ср", "Среда" },
                { "Чт", "Четверг" }, { "Пт", "Пятница" }
            };
            
            var workDays = (_settings.WorkDays?.Any() == true ? _settings.WorkDays : new List<string> { "Пн", "Вт", "Ср", "Чт", "Пт" })
                .Select(d => daysMap.ContainsKey(d) ? daysMap[d] : d).ToList();
            
            var roomNumbers = _rooms.Select(r => r.Number).ToList();
            if (!roomNumbers.Any()) roomNumbers.Add("101");
            
            int totalLessons = 0;
            int classesProcessed = 0;
            
            foreach (var cls in _classes.OrderBy(c => c.Number).ThenBy(c => c.Letter))
            {
                Console.WriteLine($"\n📚 Обработка класса {cls.Name}");
                
                // ✅ 1. Находим учителей, которые ведут в этом классе
                var classTeachers = _teachers
                    .Where(t => t.ClassIds != null && t.ClassIds.Contains(cls.Id))
                    .ToList();
                
                if (!classTeachers.Any())
                {
                    Console.WriteLine($"   ⚠️ Нет учителей для класса {cls.Name}");
                    continue;
                }
                
                Console.WriteLine($"   👨‍🏫 Найдено {classTeachers.Count} учителей для класса");
                
                // ✅ 2. Получаем часы нагрузки
                var classHours = _subjectHours.Where(h => h.Grade == cls.Number).ToList();
                if (!classHours.Any())
                {
                    Console.WriteLine($"   ⚠️ Нет часов нагрузки для {cls.Number} класса");
                    continue;
                }
                
                int maxLessons = cls.MaxLessonsPerDay ?? (cls.Number == 1 ? 4 : (cls.Shift == 2 ? 5 : 6));
                
                var classSchedule = new Dictionary<string, List<Dictionary<string, object>>>();
                foreach (var day in workDays)
                    classSchedule[day] = new List<Dictionary<string, object>>();
                
                var lessonsToSchedule = new List<(SubjectHours hour, int hoursNeeded)>();
                foreach (var hour in classHours)
                {
                    int hoursNeeded = (int)Math.Ceiling(hour.HoursPerWeek);
                    lessonsToSchedule.Add((hour, hoursNeeded));
                }
                
                foreach (var (hour, hoursNeeded) in lessonsToSchedule)
                {
                    var lesson = _lessons.FirstOrDefault(l => l.Id == hour.SubjectId);
                    if (lesson == null)
                    {
                        Console.WriteLine($"   ⚠️ Предмет id={hour.SubjectId} не найден");
                        continue;
                    }
                    
                    // ✅ 3. Ищем учителей, которые:
                    //    - ведут этот предмет (lesson_ids)
                    //    - ведут в этом классе (class_ids)
                    var availableTeachers = classTeachers
                        .Where(t => t.LessonIds != null && t.LessonIds.Contains(hour.SubjectId))
                        .Where(t => t.ClassIds != null && t.ClassIds.Contains(cls.Id))
                        .ToList();
                    
                    if (!availableTeachers.Any())
                    {
                        Console.WriteLine($"   ⚠️ Для предмета '{lesson.Name}' нет учителей, которые ведут его в этом классе");
                        continue;
                    }
                    
                    Console.WriteLine($"   📚 Предмет '{lesson.Name}': найдено {availableTeachers.Count} учителей");
                    
                    int scheduled = 0;
                    int dayIndex = 0;
                    var shuffledDays = workDays.OrderBy(x => _random.Next()).ToList();
                    
                    while (scheduled < hoursNeeded && dayIndex < shuffledDays.Count)
                    {
                        var day = shuffledDays[dayIndex];
                        
                        if (classSchedule[day].Count >= maxLessons)
                        {
                            dayIndex++;
                            continue;
                        }
                        
                        // ✅ 4. Выбираем учителя из доступных
                        var teacher = availableTeachers[_random.Next(availableTeachers.Count)];
                        
                        // ✅ 5. Ищем кабинет, привязанный к этому учителю
                        var roomIds = teacher.RoomIds ?? new List<int>();
                        var room = "";
                        if (roomIds.Any())
                        {
                            var roomId = roomIds[_random.Next(roomIds.Count)];
                            room = _roomMap.GetValueOrDefault(roomId, "");
                        }
                        
                        // Если у учителя нет кабинетов — берем любой
                        if (string.IsNullOrEmpty(room) && roomNumbers.Any())
                            room = roomNumbers[_random.Next(roomNumbers.Count)];
                        
                        var lessonDict = new Dictionary<string, object>
                        {
                            ["lessonNumber"] = classSchedule[day].Count + 1,
                            ["subject"] = lesson.Name,
                            ["teacher"] = $"{teacher.LastName} {teacher.FirstName}".Trim(),
                            ["office"] = room,
                            ["teacherColor"] = teacher.Color ?? "#3b82f6",
                            ["teacherId"] = teacher.Id,
                            ["lessonId"] = lesson.Id
                        };
                        
                        classSchedule[day].Add(lessonDict);
                        
                        Console.WriteLine($"      ✅ {day} {classSchedule[day].Count} урок: {lesson.Name} -> {teacher.LastName} (каб.{room})");
                        
                        scheduled++;
                        totalLessons++;
                        dayIndex++;
                    }
                    
                    if (scheduled < hoursNeeded)
                    {
                        Console.WriteLine($"   ⚠️ Не удалось распределить все часы для {lesson.Name}: {scheduled}/{hoursNeeded}");
                    }
                }
                
                // ✅ 6. Обновляем номера уроков
                foreach (var day in workDays)
                {
                    var lessons = classSchedule[day];
                    for (int i = 0; i < lessons.Count; i++)
                    {
                        lessons[i]["lessonNumber"] = i + 1;
                    }
                }
                
                schedule[cls.Name] = classSchedule;
                classesProcessed++;
                Console.WriteLine($"   ✅ {classSchedule.Sum(d => d.Value.Count)} уроков для класса {cls.Name}");
            }
            
            result.Schedule = schedule;
            result.Success = totalLessons > 0;
            result.TotalLessons = totalLessons;
            result.ClassesProcessed = classesProcessed;
            
            if (!result.Success)
            {
                result.Error = "Не удалось создать ни одного урока. Проверьте данные: классы, учителя, предметы, часы нагрузки.";
            }
            
            Console.WriteLine($"\n✅ Создано {totalLessons} уроков в {classesProcessed} классах");
            return result;
        }
    }
}