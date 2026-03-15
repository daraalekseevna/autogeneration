import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaCalendar, FaEdit, FaSave, FaTimes, FaPrint, FaDownload,
  FaFilter, FaSearch, FaEye, FaEyeSlash, FaUser, FaDoorOpen,
  FaBell, FaExclamationTriangle, FaCheckCircle, FaGripVertical,
  FaArrowLeft, FaPlus, FaTrash, FaClock, FaSchool, FaSync,
  FaBook, FaCalendarAlt, FaUsers, FaUndo, FaRedo, FaEraser,
  FaGraduationCap, FaMapMarkerAlt, FaHourglassHalf
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  ClassRegistry, TeacherRegistry, RoomRegistry,
  WeekSchedule, TimeSchedule, initializeExtracurricularConfig 
} from '../config/extracurricular';
import '../styles/ScheduleViewer.css';

const ScheduleViewer = () => {
  const navigate = useNavigate();
  
  // Состояния
  const [selectedClass, setSelectedClass] = useState('5А');
  const [week, setWeek] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [showConflicts, setShowConflicts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [draggedLesson, setDraggedLesson] = useState(null);
  
  // Модальное окно редактирования
  const [editingLesson, setEditingLesson] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    subject: '',
    teacher: '',
    room: '',
    duration: 45,
    building: 'high',
    type: 'regular'
  });
  
  // Фильтры
  const [filters, setFilters] = useState({
    showTeachers: true,
    showRooms: true,
    showSubjects: true,
    highlightConflicts: true,
    showEmptySlots: true
  });
  
  // Поиск
  const [searchTerm, setSearchTerm] = useState('');
  
  // Расписание
  const [schedule, setSchedule] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  
  // Данные для селектов
  const subjects = TeacherRegistry.getAllSubjects();
  const teachers = TeacherRegistry.getTeacherOptions('high');
  const rooms = RoomRegistry.getRoomOptions('high');
  const durations = [30, 45, 60, 90, 120];
  const lessonTypes = [
    { value: 'regular', label: 'Обычный урок' },
    { value: 'lab', label: 'Лабораторная' },
    { value: 'test', label: 'Контрольная' },
    { value: 'extracurricular', label: 'Внеурочная' },
    { value: 'project', label: 'Проектная работа' }
  ];
  const buildings = [
    { value: 'high', label: 'Старшая школа' },
    { value: 'middle', label: 'Средняя школа' },
    { value: 'primary', label: 'Начальная школа' }
  ];
  
  // Данные из конфигурации
  const days = WeekSchedule.getDayOptions('high')
    .filter(day => !day.isWeekend)
    .map(day => ({ 
      id: day.value, 
      name: day.value, 
      shortName: WeekSchedule.getDayByShortName(day.label.split(' - ')[0])?.shortName 
    }));
  
  const lessons = TimeSchedule.getSlots('high').map((time, index) => ({
    id: index + 1,
    number: index + 1,
    startTime: time,
    endTime: TimeSchedule.getSlots('high')[index + 1] || 
      `${parseInt(time.split(':')[0]) + 1}:${time.split(':')[1]}`
  }));
  
  const allClasses = ClassRegistry.getClassOptions();

  // Инициализация
  useEffect(() => {
    initializeExtracurricularConfig();
    loadSchedule();
  }, [selectedClass, week]);

  // Загрузка расписания
  const loadSchedule = async () => {
    setLoading(true);
    try {
      const mockSchedule = generateMockSchedule();
      setSchedule(mockSchedule);
      checkConflicts(mockSchedule);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
    } finally {
      setLoading(false);
    }
  };

  // Генерация тестового расписания
  const generateMockSchedule = () => {
    const classData = ClassRegistry.getClassByName(selectedClass);
    if (!classData) return {};
    
    const mockData = {};
    
    const scheduleTemplate = {
      'Понедельник': { 
        1: { subject: 'Математика', teacher: 'Иванова А.П.', room: '201', duration: 45 },
        2: { subject: 'Русский язык', teacher: 'Петрова С.И.', room: '305', duration: 45 },
        3: { subject: 'Литература', teacher: 'Сидорова О.В.', room: '208', duration: 45 },
        4: { subject: 'Физическая культура', teacher: 'Козлов Д.С.', room: 'Спортзал', duration: 90 }
      },
      'Вторник': { 
        1: { subject: 'Английский язык', teacher: 'Смирнова Е.А.', room: '401', duration: 45 },
        2: { subject: 'История', teacher: 'Федоров П.К.', room: '312', duration: 45 },
        3: { subject: 'Биология', teacher: 'Николаева М.В.', room: 'Лаборатория', duration: 90 },
        4: { subject: 'Химия', teacher: 'Алексеев В.Г.', room: 'Лаборатория', duration: 90 }
      },
      'Среда': { 
        1: { subject: 'Физика', teacher: 'Григорьев А.С.', room: 'Физика', duration: 45 },
        2: { subject: 'География', teacher: 'Тихонова Л.М.', room: '307', duration: 45 },
        3: { subject: 'Информатика', teacher: 'Белов Д.А.', room: 'Компьютерный', duration: 90 },
        4: { subject: 'Обществознание', teacher: 'Морозова Т.П.', room: '210', duration: 45 }
      },
      'Четверг': { 
        1: { subject: 'Математика', teacher: 'Иванова А.П.', room: '201', duration: 45 },
        2: { subject: 'Русский язык', teacher: 'Петрова С.И.', room: '305', duration: 45 },
        3: { subject: 'Английский язык', teacher: 'Смирнова Е.А.', room: '401', duration: 45 },
        4: { subject: 'Физическая культура', teacher: 'Козлов Д.С.', room: 'Спортзал', duration: 90 }
      },
      'Пятница': { 
        1: { subject: 'Изобразительное искусство', teacher: 'Волкова Н.С.', room: 'ИЗО', duration: 45 },
        2: { subject: 'Музыка', teacher: 'Лебедева И.А.', room: 'Музыка', duration: 45 },
        3: { subject: 'Труд', teacher: 'Павлов С.В.', room: 'Мастерская', duration: 90 },
        4: { subject: 'Классный час', teacher: ClassRegistry.getClassTeacher(selectedClass), room: selectedClass, duration: 45 }
      }
    };
    
    days.forEach(day => {
      const daySchedule = scheduleTemplate[day.name];
      if (!daySchedule) return;
      
      mockData[day.id] = {};
      
      Object.entries(daySchedule).forEach(([lessonNum, data]) => {
        mockData[day.id][lessonNum] = {
          id: `${day.id}-${lessonNum}`,
          subject: data.subject,
          teacher: data.teacher,
          room: data.room,
          duration: data.duration,
          color: getSubjectColor(data.subject),
          building: 'high',
          type: lessonNum === '3' && day.name === 'Вторник' ? 'lab' : 
                lessonNum === '3' && day.name === 'Среда' ? 'lab' : 
                lessonNum === '4' && day.name === 'Понедельник' ? 'extracurricular' : 'regular',
          class: selectedClass
        };
      });
    });
    
    return mockData;
  };

  // Получение цвета для предмета
  const getSubjectColor = (subject) => {
    const colorMap = {
      'Математика': '#4CAF50',
      'Русский язык': '#2196F3',
      'Литература': '#9C27B0',
      'Английский язык': '#FF9800',
      'Физическая культура': '#F44336',
      'История': '#795548',
      'Обществознание': '#607D8B',
      'Биология': '#8BC34A',
      'Химия': '#009688',
      'Физика': '#FF5722',
      'География': '#3F51B5',
      'Информатика': '#E91E63',
      'Изобразительное искусство': '#FFC107',
      'Музыка': '#00BCD4',
      'Труд': '#FF9800',
      'Классный час': '#9E9E9E'
    };
    
    for (const [key, color] of Object.entries(colorMap)) {
      if (subject.includes(key)) {
        return color;
      }
    }
    
    return '#9E9E9E';
  };

  // Проверка конфликтов
  const checkConflicts = (currentSchedule) => {
    const newConflicts = [];
    const teacherUsage = {};
    const roomUsage = {};
    
    Object.entries(currentSchedule).forEach(([day, dayLessons]) => {
      Object.entries(dayLessons).forEach(([lessonNum, lesson]) => {
        const teacherKey = `${day}-${lesson.teacher}`;
        const roomKey = `${day}-${lesson.room}`;
        
        if (teacherUsage[teacherKey]) {
          newConflicts.push({
            id: `teacher-${day}-${lessonNum}`,
            type: 'teacher',
            day: day,
            lesson: parseInt(lessonNum),
            teacher: lesson.teacher,
            conflict: `Учитель ${lesson.teacher} ведет урок в другом классе в это же время`,
            severity: 'high'
          });
        } else {
          teacherUsage[teacherKey] = true;
        }
        
        if (roomUsage[roomKey]) {
          newConflicts.push({
            id: `room-${day}-${lessonNum}`,
            type: 'room',
            day: day,
            lesson: parseInt(lessonNum),
            room: lesson.room,
            conflict: `Кабинет ${lesson.room} занят другим классом`,
            severity: 'medium'
          });
        } else {
          roomUsage[roomKey] = true;
        }
      });
    });
    
    setConflicts(newConflicts);
  };

  // Drag and Drop
  const handleDragStart = (day, lessonNum) => {
    if (!editMode) return;
    const lesson = schedule[day]?.[lessonNum];
    if (lesson) {
      setDraggedLesson({ day, lessonNum, lesson });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetDay, targetLesson) => {
    if (!editMode || !draggedLesson) return;
    
    const { day: sourceDay, lessonNum: sourceLesson, lesson } = draggedLesson;
    
    if (sourceDay === targetDay && sourceLesson === targetLesson) {
      setDraggedLesson(null);
      return;
    }

    const newSchedule = { ...schedule };
    
    if (newSchedule[sourceDay]) {
      delete newSchedule[sourceDay][sourceLesson];
      
      if (Object.keys(newSchedule[sourceDay]).length === 0) {
        delete newSchedule[sourceDay];
      }
    }
    
    if (!newSchedule[targetDay]) {
      newSchedule[targetDay] = {};
    }
    
    const updatedLesson = {
      ...lesson,
      id: `${targetDay}-${targetLesson}`
    };
    
    newSchedule[targetDay][targetLesson] = updatedLesson;
    
    setSchedule(newSchedule);
    setDraggedLesson(null);
    checkConflicts(newSchedule);
  };

  // Открытие модального окна редактирования
  const openEditModal = (day, lessonNum, lesson) => {
    if (!editMode || !lesson) return;
    
    setEditingLesson({ day, lessonNum });
    setEditForm({
      subject: lesson.subject || '',
      teacher: lesson.teacher || '',
      room: lesson.room || '',
      duration: lesson.duration || 45,
      building: lesson.building || 'high',
      type: lesson.type || 'regular'
    });
    setShowEditModal(true);
  };

  // Сохранение изменений урока
  const saveLessonChanges = () => {
    if (!editingLesson) return;
    
    const { day, lessonNum } = editingLesson;
    const newSchedule = { ...schedule };
    
    newSchedule[day][lessonNum] = {
      ...newSchedule[day][lessonNum],
      ...editForm,
      color: getSubjectColor(editForm.subject),
      id: `${day}-${lessonNum}`
    };
    
    setSchedule(newSchedule);
    setShowEditModal(false);
    setEditingLesson(null);
    checkConflicts(newSchedule);
  };

  // Добавление урока
  const handleAddLesson = (day, lessonNum) => {
    if (!editMode) return;
    
    setEditingLesson({ day, lessonNum, isNew: true });
    setEditForm({
      subject: '',
      teacher: teachers[0]?.value || '',
      room: rooms[0]?.value || '',
      duration: 45,
      building: 'high',
      type: 'regular'
    });
    setShowEditModal(true);
  };

  // Сохранение нового урока
  const saveNewLesson = () => {
    if (!editingLesson || !editingLesson.isNew) return;
    
    const { day, lessonNum } = editingLesson;
    const newSchedule = { ...schedule };
    
    if (!newSchedule[day]) {
      newSchedule[day] = {};
    }
    
    newSchedule[day][lessonNum] = {
      id: `${day}-${lessonNum}`,
      subject: editForm.subject,
      teacher: editForm.teacher,
      room: editForm.room,
      duration: editForm.duration,
      color: getSubjectColor(editForm.subject),
      building: editForm.building,
      type: editForm.type,
      class: selectedClass
    };
    
    setSchedule(newSchedule);
    setShowEditModal(false);
    setEditingLesson(null);
    checkConflicts(newSchedule);
  };

  // Удаление урока
  const handleDeleteLesson = (day, lessonNum) => {
    if (!editMode) return;
    
    const lesson = schedule[day]?.[lessonNum];
    if (!lesson) return;
    
    if (!window.confirm(`Удалить урок "${lesson.subject}"?`)) return;
    
    const newSchedule = { ...schedule };
    if (newSchedule[day]) {
      delete newSchedule[day][lessonNum];
      
      if (Object.keys(newSchedule[day]).length === 0) {
        delete newSchedule[day];
      }
    }
    
    setSchedule(newSchedule);
    checkConflicts(newSchedule);
  };

  // Сохранение всех изменений расписания
  const saveChanges = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/schedule/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class: selectedClass,
          schedule: schedule,
          week,
          conflicts: conflicts.filter(c => c.severity === 'high')
        })
      });
      
      if (response.ok) {
        alert('Изменения расписания успешно сохранены!');
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Изменения сохранены локально!');
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  // Печать расписания
  const printSchedule = () => {
    const printContent = document.querySelector('.schedule-table-container').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Расписание ${selectedClass}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
            .lesson-card { margin: 2px; padding: 5px; border-left: 4px solid; }
          </style>
        </head>
        <body>
          <h2>Расписание ${selectedClass}, неделя ${week}</h2>
          ${printContent}
          <p>Сгенерировано: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Экспорт расписания
  const exportSchedule = (format) => {
    const exportData = {
      className: selectedClass,
      week,
      schedule,
      conflicts,
      generated: new Date().toISOString()
    };
    
    if (format === 'json') {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `расписание_${selectedClass}_неделя${week}.json`;
      downloadFile(dataUri, exportFileDefaultName);
    } else {
      alert(`Экспорт в ${format.toUpperCase()} будет реализован позже`);
    }
  };

  const downloadFile = (uri, name) => {
    const link = document.createElement("a");
    link.href = uri;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Поиск альтернатив
  const findAlternatives = (conflict) => {
    const alternativesList = [];
    
    if (conflict.type === 'teacher') {
      const subjectTeachers = teachers.filter(t => 
        t.label.toLowerCase().includes(schedule[conflict.day]?.[conflict.lesson]?.subject?.toLowerCase()?.split(' ')[0] || '')
      );
      
      subjectTeachers.forEach(teacher => {
        if (teacher.value !== conflict.teacher) {
          alternativesList.push({
            type: 'teacher',
            teacher: teacher.value,
            subject: schedule[conflict.day]?.[conflict.lesson]?.subject,
            day: conflict.day,
            lesson: conflict.lesson
          });
        }
      });
    } else if (conflict.type === 'room') {
      const takenRooms = new Set();
      
      Object.values(schedule).forEach(dayLessons => {
        Object.values(dayLessons).forEach(lesson => {
          takenRooms.add(lesson.room);
        });
      });
      
      rooms.forEach(room => {
        if (!takenRooms.has(room.value)) {
          alternativesList.push({
            type: 'room',
            room: room.value,
            day: conflict.day,
            lesson: conflict.lesson
          });
        }
      });
    }
    
    setAlternatives(alternativesList);
  };

  // Применение альтернативы
  const applyAlternative = (alternative) => {
    const newSchedule = { ...schedule };
    
    if (alternative.type === 'teacher' && newSchedule[alternative.day]?.[alternative.lesson]) {
      newSchedule[alternative.day][alternative.lesson].teacher = alternative.teacher;
    } else if (alternative.type === 'room' && newSchedule[alternative.day]?.[alternative.lesson]) {
      newSchedule[alternative.day][alternative.lesson].room = alternative.room;
    }
    
    setSchedule(newSchedule);
    setAlternatives([]);
    checkConflicts(newSchedule);
  };

  // Проверка конфликта для ячейки
  const hasConflict = (day, lessonNum) => {
    return conflicts.some(c => c.day === day && c.lesson === lessonNum);
  };

  // Фильтрация расписания
  const filteredSchedule = useCallback(() => {
    if (!searchTerm) return schedule;
    
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = {};
    
    Object.entries(schedule).forEach(([day, dayLessons]) => {
      const filteredLessons = {};
      
      Object.entries(dayLessons).forEach(([lessonNum, lesson]) => {
        const matches = 
          lesson.subject.toLowerCase().includes(lowerSearch) ||
          lesson.teacher.toLowerCase().includes(lowerSearch) ||
          lesson.room.toLowerCase().includes(lowerSearch);
        
        if (matches) {
          filteredLessons[lessonNum] = lesson;
        }
      });
      
      if (Object.keys(filteredLessons).length > 0) {
        filtered[day] = filteredLessons;
      }
    });
    
    return filtered;
  }, [schedule, searchTerm]);

  // Получение метки типа урока
  const getLessonTypeLabel = (type) => {
    return lessonTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="schedule-viewer-page">
      {/* Фон с кругами */}
      <div className="schedule-bg">
        <div className="schedule-glass-circle"></div>
        <div className="schedule-glass-circle"></div>
        <div className="schedule-glass-circle"></div>
        <div className="schedule-glass-circle"></div>
      </div>
      
      {/* Кнопка возврата */}
      <button 
        className="schedule-back-btn"
        onClick={() => navigate(-1)}
        title="Вернуться назад"
      >
        <FaArrowLeft />
      </button>
      
      <Header />
      
      <div className="schedule-viewer-container">
        {/* Панель управления */}
        <div className="schedule-control-panel">
          <div className="control-section">
            <h2>
              <FaCalendar />
              Расписание классов
            </h2>
            
            <div className="class-selector">
              <label>Класс:</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={editMode}
              >
                {allClasses.map(cls => (
                  <option key={cls.value} value={cls.value}>
                    {cls.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="week-selector">
              <label>Неделя:</label>
              <div className="week-buttons">
                {[1, 2].map(w => (
                  <button
                    key={w}
                    className={`week-btn ${week === w ? 'active' : ''}`}
                    onClick={() => setWeek(w)}
                    disabled={editMode}
                  >
                    {w} неделя
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className={`schedule-btn ${editMode ? 'schedule-btn-warning' : 'schedule-btn-primary'}`}
              onClick={() => {
                setEditMode(!editMode);
                if (editMode) {
                  setDraggedLesson(null);
                  setAlternatives([]);
                }
              }}
              disabled={loading}
            >
              {editMode ? <FaTimes /> : <FaEdit />}
              {editMode ? 'Отменить редактирование' : 'Редактировать расписание'}
            </button>
            
            {editMode && (
              <button 
                className="schedule-btn schedule-btn-success" 
                onClick={saveChanges}
                disabled={loading}
              >
                {loading ? <FaSync className="spin" /> : <FaSave />}
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            )}
            
            <button 
              className="schedule-btn schedule-btn-secondary" 
              onClick={printSchedule}
              disabled={loading}
            >
              <FaPrint />
              Печать
            </button>
            
            <div className="dropdown">
              <button 
                className="schedule-btn schedule-btn-secondary dropdown-toggle"
                disabled={loading}
              >
                <FaDownload />
                Экспорт
              </button>
              <div className="dropdown-menu">
                <button onClick={() => exportSchedule('json')}>JSON</button>
                <button onClick={() => exportSchedule('excel')}>Excel</button>
                <button onClick={() => exportSchedule('pdf')}>PDF</button>
              </div>
            </div>
            
            <button 
              className={`schedule-btn ${showConflicts ? 'schedule-btn-danger' : 'schedule-btn-secondary'}`}
              onClick={() => setShowConflicts(!showConflicts)}
            >
              {showConflicts ? <FaEyeSlash /> : <FaEye />}
              {showConflicts ? 'Скрыть конфликты' : 'Показать конфликты'}
            </button>
          </div>
        </div>
        
        {/* Панель поиска и фильтров */}
        <div className="filter-panel">
          <h3><FaFilter /> Поиск и фильтры</h3>
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Поиск по предмету, учителю или кабинету..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-options">
            {Object.entries(filters).map(([key, value]) => (
              <label key={key} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setFilters({...filters, [key]: e.target.checked})}
                />
                <span>
                  {key === 'showTeachers' && 'Показывать учителей'}
                  {key === 'showRooms' && 'Показывать кабинеты'}
                  {key === 'showSubjects' && 'Показывать предметы'}
                  {key === 'highlightConflicts' && 'Подсвечивать конфликты'}
                  {key === 'showEmptySlots' && 'Показывать пустые слоты'}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Информация о классе */}
        <div className="class-info-panel">
          <div className="class-info">
            <div className="class-name">
              <FaSchool /> Класс: <strong>{selectedClass}</strong>
            </div>
            <div className="class-teacher">
              <FaUser /> Классный руководитель: <strong>{ClassRegistry.getClassTeacher(selectedClass) || 'Не назначен'}</strong>
            </div>
            <div className="class-stats">
              <FaBook /> Уроков в неделю: <strong>{Object.values(schedule).reduce((sum, day) => sum + Object.keys(day).length, 0)}</strong>
              {conflicts.length > 0 && (
                <span className="conflict-count">
                  <FaExclamationTriangle /> Конфликтов: <strong>{conflicts.length}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Основная таблица расписания */}
        <div className="schedule-table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="time-header">Урок / День</th>
                {days.map((day) => (
                  <th key={day.id} className="day-header">
                    <div className="day-name">{day.shortName}</div>
                    <div className="full-day-name">{day.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td className="lesson-number">
                    <div className="lesson-time">
                      <div className="lesson-num">{lesson.number}</div>
                      <div className="time-range">
                        <FaClock /> {lesson.startTime} - {lesson.endTime}
                      </div>
                    </div>
                  </td>
                  
                  {days.map((day) => {
                    const lessonData = filteredSchedule()[day.id]?.[lesson.number];
                    const conflict = hasConflict(day.id, lesson.number);
                    
                    return (
                      <td
                        key={`${day.id}-${lesson.number}`}
                        className={`schedule-cell ${conflict && showConflicts && filters.highlightConflicts ? 'has-conflict' : ''} ${editMode ? 'editable' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(day.id, lesson.number)}
                      >
                        {lessonData ? (
                          <div 
                            className={`lesson-card ${editMode ? 'draggable' : ''}`}
                            draggable={editMode}
                            onDragStart={() => handleDragStart(day.id, lesson.number)}
                            style={{
                              backgroundColor: lessonData.color + '20',
                              borderLeft: `4px solid ${lessonData.color}`
                            }}
                          >
                            {conflict && showConflicts && filters.highlightConflicts && (
                              <div className="conflict-indicator">
                                <FaExclamationTriangle />
                              </div>
                            )}
                            
                            {editMode && (
                              <div className="drag-handle">
                                <FaGripVertical />
                              </div>
                            )}
                            
                            <div className="lesson-content">
                              {filters.showSubjects && (
                                <div className="lesson-subject">{lessonData.subject}</div>
                              )}
                              
                              <div className="lesson-details">
                                {filters.showTeachers && (
                                  <div className="lesson-teacher">
                                    <FaGraduationCap /> {lessonData.teacher}
                                  </div>
                                )}
                                
                                {filters.showRooms && (
                                  <div className="lesson-room">
                                    <FaMapMarkerAlt /> {lessonData.room}
                                  </div>
                                )}
                                
                                <div className="lesson-meta">
                                  <span className="lesson-duration">
                                    <FaHourglassHalf /> {lessonData.duration} мин
                                  </span>
                                  <span className="lesson-type">
                                    {getLessonTypeLabel(lessonData.type)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {editMode && (
                              <div className="lesson-actions">
                                <button 
                                  className="btn-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(day.id, lesson.number, lessonData);
                                  }}
                                  title="Редактировать урок"
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  className="btn-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(day.id, lesson.number);
                                  }}
                                  title="Удалить урок"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : editMode ? (
                          <div 
                            className="empty-slot"
                            onClick={() => handleAddLesson(day.id, lesson.number)}
                            title="Добавить урок"
                          >
                            <FaPlus /> Добавить урок
                          </div>
                        ) : filters.showEmptySlots ? (
                          <div className="empty-slot-view">—</div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Панель конфликтов */}
        {showConflicts && conflicts.length > 0 && (
          <div className="conflicts-panel">
            <h3><FaExclamationTriangle /> Обнаруженные конфликты ({conflicts.length})</h3>
            <div className="conflicts-list">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className={`conflict-item ${conflict.type}`}>
                  <div className="conflict-header">
                    <FaBell />
                    <span className="conflict-type">
                      {conflict.type === 'teacher' ? 'Конфликт учителя' : 'Конфликт кабинета'}
                    </span>
                    <span className="conflict-location">
                      {conflict.day}, {conflict.lesson} урок
                    </span>
                    <span className={`conflict-severity ${conflict.severity}`}>
                      {conflict.severity === 'high' ? 'Высокая' : 'Средняя'}
                    </span>
                  </div>
                  <div className="conflict-details">
                    {conflict.conflict}
                  </div>
                  <div className="conflict-actions">
                    <button 
                      className="schedule-btn schedule-btn-sm schedule-btn-outline"
                      onClick={() => findAlternatives(conflict)}
                    >
                      <FaSearch /> Найти альтернативы
                    </button>
                    <button 
                      className="schedule-btn schedule-btn-sm schedule-btn-danger"
                      onClick={() => {
                        setConflicts(prev => prev.filter(c => c.id !== conflict.id));
                      }}
                    >
                      Игнорировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Панель альтернативных вариантов */}
        {alternatives.length > 0 && (
          <div className="alternatives-panel">
            <h3><FaSearch /> Доступные альтернативы ({alternatives.length})</h3>
            <div className="alternatives-grid">
              {alternatives.map((alt, index) => (
                <div key={index} className="alternative-item">
                  {alt.type === 'teacher' && (
                    <>
                      <div className="alternative-subject">{alt.subject}</div>
                      <div className="alternative-teacher">
                        <FaUser /> {alt.teacher}
                      </div>
                      <div className="alternative-info">
                        Замена учителя
                      </div>
                    </>
                  )}
                  {alt.type === 'room' && (
                    <>
                      <div className="alternative-room">
                        <FaDoorOpen /> {alt.room}
                      </div>
                      <div className="alternative-info">
                        Свободный кабинет
                      </div>
                    </>
                  )}
                  <div className="alternative-location">
                    {alt.day}, {alt.lesson} урок
                  </div>
                  <button 
                    className="schedule-btn schedule-btn-sm schedule-btn-success"
                    onClick={() => applyAlternative(alt)}
                  >
                    <FaCheckCircle /> Применить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Модальное окно редактирования урока */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FaEdit />
                {editingLesson?.isNew ? 'Добавить новый урок' : 'Редактировать урок'}
              </h3>
              <button 
                className="close-modal"
                onClick={() => setShowEditModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="edit-form">
                <div className="form-group">
                  <label htmlFor="subject">
                    <FaBook /> Предмет
                  </label>
                  <select
                    id="subject"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Выберите предмет</option>
                    {subjects.map((subject, index) => (
                      <option key={index} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="teacher">
                    <FaGraduationCap /> Учитель
                  </label>
                  <select
                    id="teacher"
                    value={editForm.teacher}
                    onChange={(e) => setEditForm({...editForm, teacher: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Выберите учителя</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.value} value={teacher.value}>
                        {teacher.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="room">
                    <FaMapMarkerAlt /> Кабинет
                  </label>
                  <select
                    id="room"
                    value={editForm.room}
                    onChange={(e) => setEditForm({...editForm, room: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Выберите кабинет</option>
                    {rooms.map((room) => (
                      <option key={room.value} value={room.value}>
                        {room.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="duration">
                      <FaHourglassHalf /> Длительность
                    </label>
                    <select
                      id="duration"
                      value={editForm.duration}
                      onChange={(e) => setEditForm({...editForm, duration: parseInt(e.target.value)})}
                      className="form-select"
                    >
                      {durations.map((duration) => (
                        <option key={duration} value={duration}>
                          {duration} минут
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="type">
                      Тип урока
                    </label>
                    <select
                      id="type"
                      value={editForm.type}
                      onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                      className="form-select"
                    >
                      {lessonTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="building">
                    Корпус/Здание
                  </label>
                  <select
                    id="building"
                    value={editForm.building}
                    onChange={(e) => setEditForm({...editForm, building: e.target.value})}
                    className="form-select"
                  >
                    {buildings.map((building) => (
                      <option key={building.value} value={building.value}>
                        {building.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="schedule-btn schedule-btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Отмена
              </button>
              <button 
                className="schedule-btn schedule-btn-success"
                onClick={editingLesson?.isNew ? saveNewLesson : saveLessonChanges}
                disabled={!editForm.subject || !editForm.teacher || !editForm.room}
              >
                <FaSave /> {editingLesson?.isNew ? 'Добавить урок' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default ScheduleViewer;