// Пример структуры расписания для одного класса (например, 5А)
// Хранится в localStorage под ключом `schedule_5А`
export const sampleClassSchedule = {
  monday: {
    1: { subject: "Математика", teacher: "Иванова Анна Петровна", room: "201", duration: 45, subgroup: null, color: "#2196F3" },
    2: { subject: "Русский язык", teacher: "Кузнецова Елена Михайловна", room: "305", duration: 45, subgroup: null, color: "#4CAF50" },
    3: { subject: "Литература", teacher: "Михайлова Светлана Викторовна", room: "306", duration: 45, subgroup: null, color: "#9C27B0" },
    4: { subject: "Физическая культура", teacher: "Козлов Дмитрий Сергеевич", room: "Спортзал", duration: 45, subgroup: null, color: "#FF9800" },
    5: { subject: "Английский язык", teacher: "Смирнова Елена Александровна", room: "401", duration: 45, subgroup: null, color: "#E91E63" },
    6: null, 7: null
  },
  tuesday: {
    1: { subject: "Английский язык", teacher: "Смирнова Елена Александровна", room: "401", duration: 45, subgroup: 1, color: "#E91E63" },
    2: { subject: "Английский язык", teacher: "Волкова Наталья Сергеевна", room: "402", duration: 45, subgroup: 2, color: "#E91E63" },
    3: { subject: "История", teacher: "Морозова Татьяна Петровна", room: "210", duration: 45, subgroup: null, color: "#795548" },
    4: { subject: "Информатика", teacher: "Белов Дмитрий Алексеевич", room: "Компьютерный", duration: 45, subgroup: 1, color: "#3F51B5" },
    5: { subject: "Информатика", teacher: "Новикова Елена Викторовна", room: "Компьютерный 2", duration: 45, subgroup: 2, color: "#3F51B5" },
    6: null, 7: null
  },
  wednesday: {
    1: { subject: "Физика", teacher: "Григорьев Александр Сергеевич", room: "Физика", duration: 45, subgroup: null, color: "#00BCD4" },
    2: { subject: "География", teacher: "Тихонова Людмила Михайловна", room: "307", duration: 45, subgroup: null, color: "#FFC107" },
    3: { subject: "Биология", teacher: "Николаева Мария Владимировна", room: "Лаборатория", duration: 45, subgroup: null, color: "#8BC34A" },
    4: { subject: "Химия", teacher: "Алексеев Владимир Геннадьевич", room: "Лаборатория", duration: 45, subgroup: null, color: "#FF5722" },
    5: { subject: "Математика", teacher: "Петров Сергей Иванович", room: "202", duration: 45, subgroup: null, color: "#2196F3" },
    6: null, 7: null
  },
  thursday: {
    1: { subject: "Математика", teacher: "Иванова Анна Петровна", room: "201", duration: 45, subgroup: null, color: "#2196F3" },
    2: { subject: "Русский язык", teacher: "Кузнецова Елена Михайловна", room: "305", duration: 45, subgroup: null, color: "#4CAF50" },
    3: { subject: "Обществознание", teacher: "Лебедева Ирина Анатольевна", room: "211", duration: 45, subgroup: null, color: "#607D8B" },
    4: { subject: "Физическая культура", teacher: "Козлов Дмитрий Сергеевич", room: "Спортзал", duration: 45, subgroup: null, color: "#FF9800" },
    5: { subject: "Литература", teacher: "Михайлова Светлана Викторовна", room: "306", duration: 45, subgroup: null, color: "#9C27B0" },
    6: null, 7: null
  },
  friday: {
    1: { subject: "Изобразительное искусство", teacher: "Волкова Наталья Сергеевна", room: "ИЗО", duration: 45, subgroup: null, color: "#E91E63" },
    2: { subject: "Музыка", teacher: "Соколова Елена Игоревна", room: "Музыка", duration: 45, subgroup: null, color: "#9C27B0" },
    3: { subject: "Труд (технология)", teacher: "Павлов Сергей Викторович", room: "Мастерская", duration: 45, subgroup: null, color: "#FF9800" },
    4: { subject: "Классный час", teacher: "Иванова Анна Петровна", room: "201", duration: 45, subgroup: null, color: "#4CAF50" },
    5: { subject: "Английский язык", teacher: "Андреева Екатерина Викторовна", room: "403", duration: 45, subgroup: null, color: "#E91E63" },
    6: null, 7: null
  },
  saturday: {
    1: { subject: "Математика", teacher: "Петров Сергей Иванович", room: "202", duration: 45, subgroup: null, color: "#2196F3" },
    2: { subject: "Английский язык", teacher: "Андреева Екатерина Викторовна", room: "403", duration: 45, subgroup: null, color: "#E91E63" },
    3: { subject: "Физическая культура", teacher: "Степанова Ольга Викторовна", room: "Спортзал 2", duration: 45, subgroup: null, color: "#FF9800" },
    4: { subject: "Информатика", teacher: "Новикова Елена Викторовна", room: "Компьютерный 2", duration: 45, subgroup: null, color: "#3F51B5" },
    5: null, 6: null, 7: null
  }
};