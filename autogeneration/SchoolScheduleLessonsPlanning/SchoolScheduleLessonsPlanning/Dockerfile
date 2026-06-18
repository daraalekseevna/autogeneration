# Этап 1: Сборка
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копируем .csproj и восстанавливаем зависимости
COPY *.csproj .
RUN dotnet restore

# Копируем весь код и собираем
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Этап 2: Запуск
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Порт для Render
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Название_вашего_проекта.dll"]