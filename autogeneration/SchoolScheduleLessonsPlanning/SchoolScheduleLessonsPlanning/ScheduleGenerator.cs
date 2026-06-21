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
        [JsonPropertyName("max_consecutive_lessons")] public int? MaxConsecutiveLessons { get; set; }
        [JsonPropertyName("unavailable_days")] public List<string> UnavailableDays { get; set; } = new();
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

    public class SubjectDifficulty
    {
        [JsonPropertyName("grade")] public int Grade { get; set; }
        [JsonPropertyName("subject_id")] public int SubjectId { get; set; }
        [JsonPropertyName("difficulty_rank")] public int DifficultyRank { get; set; }
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
        private List<SubjectDifficulty> _subjectDifficulty = new();
        private ScheduleSettings _settings = new();
        
        // Кэши
        private Dictionary<int, Teacher> _teacherMap = new();
        private Dictionary<int, Room> _roomMap = new();
        private Dictionary<int, Lesson> _lessonMap = new();
        private Dictionary<int, List<Teacher>> _teachersByClass = new();
        private Dictionary<(int classId, int lessonId), List<Teacher>> _teacherCache = new();

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
                
                var options = new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                };
                
                var data = JsonSerializer.Deserialize<Dictionary<string, object>>(json, options);
                
                // ✅ ЗАГРУЗКА САНПИН (часы)
                if (data?.ContainsKey("subjectHours") == true)
                {
                    var tempOptions = new JsonSerializerOptions 
                    { 
                        PropertyNameCaseInsensitive = true,
                        NumberHandling = JsonNumberHandling.AllowReadingFromString
                    };
                    tempOptions.Converters.Add(new DoubleConverter());
                    
                    _subjectHours = JsonSerializer.Deserialize<List<SubjectHours>>(
                        data["subjectHours"].ToString()!, tempOptions) ?? new();
                }
                
                // ✅ ЗАГРУЗКА САНПИН (сложность)
                if (data?.ContainsKey("subjectDifficulty") == true)
                {
                    _subjectDifficulty = JsonSerializer.Deserialize<List<SubjectDifficulty>>(
                        data["subjectDifficulty"].ToString()!, options) ?? new();
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
                
                // Строим кэши
                _teacherMap = _teachers.ToDictionary(t => t.Id, t => t);
                _roomMap = _rooms.ToDictionary(r => r.Id, r => r.Number);
                _lessonMap = _lessons.ToDictionary(l => l.Id, l => l);
                
                // Группируем учителей по классам
                _teachersByClass = new Dictionary<int, List<Teacher>>();
                foreach (var cls in _classes)
                {
                    _teachersByClass[cls.Id] = _teachers
                        .Where(t => t.ClassIds != null && t.ClassIds.Contains(cls.Id))
                        .ToList();
                }
                
                _teacherCache.Clear();
                
                Console.WriteLine($"✅ Загружено: классы={_classes.Count}, учителя={_teachers.Count}, предметы={_lessons.Count}, часы={_subjectHours.Count}, сложность={_subjectDifficulty.Count}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Ошибка: {ex.Message}");
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
            
            // Группируем часы по классам
            var hoursByGrade = _subjectHours
                .GroupBy(h => h.Grade)
                .ToDictionary(g => g.Key, g => g.ToList());
            
            // ✅ Группируем сложность по классам и предметам
            var difficultyMap = _subjectDifficulty
                .GroupBy(d => new { d.Grade, d.SubjectId })
                .ToDictionary(g => g.Key, g => g.First());
            
            foreach (var cls in _classes.OrderBy(c => c.Number).ThenBy(c => c.Letter))
            {
                Console.WriteLine($"\n📚 Класс {cls.Name}");
                
                // ✅ Учителя для этого класса
                var classTeachers = _teachersByClass.GetValueOrDefault(cls.Id, new List<Teacher>());
                if (!classTeachers.Any())
                {
                    Console.WriteLine($"   ⚠️ Нет учителей для класса");
                    continue;
                }
                
                Console.WriteLine($"   👨‍🏫 {classTeachers.Count} учителей в классе");
                
                // ✅ Часы нагрузки для этого класса
                var classHours = hoursByGrade.GetValueOrDefault(cls.Number, new List<SubjectHours>());
                if (!classHours.Any())
                {
                    Console.WriteLine($"   ⚠️ Нет часов нагрузки");
                    continue;
                }
                
                int maxLessons = cls.MaxLessonsPerDay ?? (cls.Number == 1 ? 4 : (cls.Shift == 2 ? 5 : 6));
                
                var classSchedule = new Dictionary<string, List<Dictionary<string, object>>>();
                foreach (var day in workDays)
                    classSchedule[day] = new List<Dictionary<string, object>>();
                
                // ✅ Сортируем по нагрузке (сначала больше) и сложности
                var sortedHours = classHours
                    .OrderByDescending(h => h.HoursPerWeek)
                    .ThenByDescending(h => {
                        var key = new { Grade = cls.Number, SubjectId = h.SubjectId };
                        return difficultyMap.ContainsKey(key) ? difficultyMap[key].DifficultyRank : 0;
                    })
                    .ToList();
                
                foreach (var hour in sortedHours)
                {
                    var lesson = _lessonMap.GetValueOrDefault(hour.SubjectId);
                    if (lesson == null) continue;
                    
                    // ✅ Ищем учителей для этого предмета в этом классе
                    var cacheKey = (cls.Id, hour.SubjectId);
                    if (!_teacherCache.ContainsKey(cacheKey))
                    {
                        _teacherCache[cacheKey] = classTeachers
                            .Where(t => t.LessonIds != null && t.LessonIds.Contains(hour.SubjectId))
                            .ToList();
                    }
                    
                    var availableTeachers = _teacherCache[cacheKey];
                    if (!availableTeachers.Any())
                    {
                        Console.WriteLine($"   ⚠️ Нет учителей для {lesson.Name} в этом классе");
                        continue;
                    }
                    
                    int hoursNeeded = (int)Math.Ceiling(hour.HoursPerWeek);
                    int scheduled = 0;
                    int dayIndex = 0;
                    
                    while (scheduled < hoursNeeded && dayIndex < workDays.Count * 2)
                    {
                        var day = workDays[dayIndex % workDays.Count];
                        
                        if (classSchedule[day].Count >= maxLessons)
                        {
                            dayIndex++;
                            continue;
                        }
                        
                        // ✅ Выбираем учителя с учётом ограничений
                        var availableForDay = availableTeachers
                            .Where(t => t.UnavailableDays == null || !t.UnavailableDays.Contains(day))
                            .ToList();
                        
                        if (!availableForDay.Any())
                        {
                            availableForDay = availableTeachers;
                        }
                        
                        var teacher = availableForDay[_random.Next(availableForDay.Count)];
                        
                        // ✅ Проверяем ограничение по подряд идущим урокам
                        var dayLessons = classSchedule[day];
                        var consecutiveCount = 1;
                        if (dayLessons.Count > 0)
                        {
                            // Проверяем, сколько подряд уроков у этого учителя
                            var lastLessons = dayLessons
                                .TakeLast(Math.Min(5, dayLessons.Count))
                                .Where(l => l.ContainsKey("teacherId") && (int)l["teacherId"] == teacher.Id)
                                .Count();
                            consecutiveCount = lastLessons + 1;
                        }
                        
                        var maxConsecutive = teacher.MaxConsecutiveLessons ?? 5;
                        if (consecutiveCount > maxConsecutive)
                        {
                            dayIndex++;
                            continue;
                        }
                        
                        // ✅ Ищем кабинет
                        var room = "";
                        if (teacher.RoomIds != null && teacher.RoomIds.Any())
                        {
                            var roomId = teacher.RoomIds[_random.Next(teacher.RoomIds.Count)];
                            room = _roomMap.GetValueOrDefault(roomId, "");
                        }
                        
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
                        scheduled++;
                        totalLessons++;
                        dayIndex++;
                    }
                    
                    if (scheduled < hoursNeeded)
                    {
                        Console.WriteLine($"   ⚠️ {lesson.Name}: {scheduled}/{hoursNeeded}");
                    }
                }
                
                // Обновляем номера уроков
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
                Console.WriteLine($"   ✅ {classSchedule.Sum(d => d.Value.Count)} уроков");
            }
            
            result.Schedule = schedule;
            result.Success = totalLessons > 0;
            result.TotalLessons = totalLessons;
            result.ClassesProcessed = classesProcessed;
            
            if (!result.Success)
            {
                result.Error = "Не удалось создать ни одного урока. Проверьте данные.";
            }
            
            Console.WriteLine($"\n✅ Создано {totalLessons} уроков в {classesProcessed} классах");
            return result;
        }
    }
}