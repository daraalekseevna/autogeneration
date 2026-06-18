# Этап 1: Сборка
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копируем файл проекта и восстанавливаем зависимости
COPY SchoolScheduleLessonsPlanning.csproj .
RUN dotnet restore

# Копируем весь код и публикуем приложение
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Этап 2: Создание финального образа для запуска
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Копируем собранное приложение из первого этапа
COPY --from=build /app/publish .

# Устанавливаем порт для Render
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Устанавливаем точку входа для запуска вашего консольного приложения
ENTRYPOINT ["dotnet", "SchoolScheduleLessonsPlanning.dll"]