using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using SchoolScheduleLessonsPlanning;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors();

var app = builder.Build();
app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

// Health check endpoint
app.MapGet("/health", () => Results.Json(new { status = "ok", timestamp = DateTime.Now }));

// Generate schedule endpoint
app.MapPost("/api/generate", async (HttpContext context) =>
{
    try
    {
        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();
        var request = JsonSerializer.Deserialize<Dictionary<string, string>>(body);
        var rulesUrl = request?["rulesUrl"] ?? "";
        var token = request?["token"] ?? "";

        Console.WriteLine("=== ЗАПУСК ГЕНЕРАТОРА ===");
        Console.WriteLine($"Rules URL: {rulesUrl}");
        Console.WriteLine($"Token: {(string.IsNullOrEmpty(token) ? "нет" : "есть")}");

        var generator = new ScheduleGenerator();
        var loaded = await generator.LoadDataAsync(rulesUrl, token);
        
        if (!loaded)
        {
            return Results.Json(new { success = false, error = "Ошибка загрузки данных из БД. Проверьте подключение и наличие данных." });
        }

        var result = generator.Generate();
        
        if (result.Success)
        {
            Console.WriteLine($"✅ Сгенерировано {result.TotalLessons} уроков в {result.ClassesProcessed} классах");
            return Results.Json(new { 
                success = true, 
                schedule = result.Schedule, 
                totalLessons = result.TotalLessons,
                classesProcessed = result.ClassesProcessed
            });
        }
        else
        {
            Console.WriteLine($"❌ Ошибка генерации: {result.Error}");
            return Results.Json(new { success = false, error = result.Error });
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Ошибка: {ex.Message}");
        Console.WriteLine(ex.StackTrace);
        return Results.Json(new { success = false, error = ex.Message, stack = ex.StackTrace });
    }
});

// Добавляем эндпоинт для проверки
app.MapGet("/", () => "Сервис генерации расписания работает! Используйте /health для проверки.");

// Используем порт из переменной окружения и слушаем на 0.0.0.0
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
Console.WriteLine($"Генератор расписания запущен на порту {port}");
Console.WriteLine("Ожидание запросов...");
app.Run($"http://0.0.0.0:{port}");