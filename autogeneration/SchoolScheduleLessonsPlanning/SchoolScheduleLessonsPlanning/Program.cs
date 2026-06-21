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
                _roomMap = _rooms.ToDictionary(r => r.Id, r => r);
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
                
                Console.WriteLine($"✅ Загружено: классы={_classes.Count}, учителя={_teachers.Count}, предметы={_lessons.Count}, часы={_subjectHours.Count}");
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
            
            int totalLessons = 0;
            int classesProcessed = 0;
            
            // Группируем часы по классам
            var hoursByGrade = _subjectHours
                .GroupBy(h => h.Grade)
                .ToDictionary(g => g.Key, g => g.ToList());
            
            foreach (var cls in _classes.OrderBy(c => c.Number).ThenBy(c => c.Letter))
            {
                Console.WriteLine($"\n📚 Класс {cls.Name}");
                
                // 1. Учителя для ЭТОГО класса (class_ids)
                var classTeachers = _teachersByClass.GetValueOrDefault(cls.Id, new List<Teacher>());
                if (!classTeachers.Any())
                {
                    Console.WriteLine($"   ⚠️ Нет учителей для класса");
                    continue;
                }
                
                Console.WriteLine($"   👨‍🏫 {classTeachers.Count} учителей в классе");
                
                // 2. Часы нагрузки для ЭТОГО класса
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
                
                // 3. Сортируем по нагрузке (сначала больше)
                var sortedHours = classHours.OrderByDescending(h => h.HoursPerWeek).ToList();
                
                foreach (var hour in sortedHours)
                {
                    var lesson = _lessonMap.GetValueOrDefault(hour.SubjectId);
                    if (lesson == null) continue;
                    
                    // 4. Ищем учителей, которые:
                    //    - ведут этот предмет (lesson_ids)
                    //    - ведут в этом классе (class_ids)
                    var cacheKey = (cls.Id, hour.SubjectId);
                    if (!_teacherCache.ContainsKey(cacheKey))
                    {
                        _teacherCache[cacheKey] = classTeachers
                            .Where(t => t.LessonIds != null && t.LessonIds.Contains(hour.SubjectId))
                            .ToList();
                        
                        Console.WriteLine($"   📚 {lesson.Name}: найдено {_teacherCache[cacheKey].Count} учителей");
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
                        
                        // 5. ВЫБИРАЕМ УЧИТЕЛЯ
                        var teacher = availableTeachers[_random.Next(availableTeachers.Count)];
                        
                        // 6. ИЩЕМ КАБИНЕТ (room_ids)
                        var room = "";
                        if (teacher.RoomIds != null && teacher.RoomIds.Any())
                        {
                            var roomId = teacher.RoomIds[_random.Next(teacher.RoomIds.Count)];
                            if (_roomMap.TryGetValue(roomId, out var roomData))
                                room = roomData.Number;
                        }
                        
                        if (string.IsNullOrEmpty(room))
                            room = "101";
                        
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
                        
                        Console.WriteLine($"      ✅ {day} {classSchedule[day].Count}: {lesson.Name} -> {teacher.LastName} (каб.{room})");
                        
                        scheduled++;
                        totalLessons++;
                        dayIndex++;
                    }
                    
                    if (scheduled < hoursNeeded)
                    {
                        Console.WriteLine($"   ⚠️ {lesson.Name}: {scheduled}/{hoursNeeded}");
                    }
                }
                
                // 7. Обновляем номера уроков
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