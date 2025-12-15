// ScheduleViewer.jsx
import React, { useState } from 'react';
import { 
  FaCalendar, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaPrint, 
  FaDownload,
  FaFilter,
  FaSearch,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaDoorOpen,
  FaBell,
  FaExclamationTriangle,
  FaCheckCircle,
  FaGripVertical,
  FaArrowLeft
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ScheduleViewer.css';

const ScheduleViewer = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('5А');
  const [week, setWeek] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [showConflicts, setShowConflicts] = useState(true);
  const [filters, setFilters] = useState({
    showTeachers: true,
    showRooms: true,
    showSubjects: true,
    highlightConflicts: true
  });

  // Моковые данные расписания
  const [schedule, setSchedule] = useState({
    '5А': {
      1: { // Понедельник
        1: { subject: 'Математика', teacher: 'Иванова А.П.', room: '302', color: '#4CAF50' },
        2: { subject: 'Русский язык', teacher: 'Петрова И.С.', room: '215', color: '#2196F3' },
        3: { subject: 'История', teacher: 'Сидоров В.Г.', room: '104', color: '#FF9800' },
        4: { subject: 'Физкультура', teacher: 'Козлов С.Д.', room: 'спортзал', color: '#9C27B0' },
        5: { subject: 'Английский язык', teacher: 'Смирнова О.Л.', room: '308', color: '#3F51B5' }
      },
      2: { // Вторник
        1: { subject: 'Биология', teacher: 'Федорова Е.В.', room: '203', color: '#00BCD4' },
        2: { subject: 'География', teacher: 'Николаев П.К.', room: '105', color: '#8BC34A' },
        3: { subject: 'Математика', teacher: 'Иванова А.П.', room: '302', color: '#4CAF50' },
        4: { subject: 'Литература', teacher: 'Петрова И.С.', room: '215', color: '#E91E63' }
      },
      3: { // Среда
        1: { subject: 'Физика', teacher: 'Семенов И.В.', room: '205', color: '#FF5722' },
        2: { subject: 'Химия', teacher: 'Кузнецова М.П.', room: '108', color: '#009688' },
        3: { subject: 'Английский язык', teacher: 'Смирнова О.Л.', room: '308', color: '#3F51B5' }
      },
      4: { // Четверг
        1: { subject: 'Литература', teacher: 'Петрова И.С.', room: '215', color: '#E91E63' },
        2: { subject: 'История', teacher: 'Сидоров В.Г.', room: '104', color: '#FF9800' },
        3: { subject: 'Физкультура', teacher: 'Козлов С.Д.', room: 'спортзал', color: '#9C27B0' }
      },
      5: { // Пятница
        1: { subject: 'Информатика', teacher: 'Васильев А.С.', room: '301', color: '#795548' },
        2: { subject: 'Музыка', teacher: 'Новикова Л.М.', room: '206', color: '#607D8B' },
        3: { subject: 'ИЗО', teacher: 'Попова О.В.', room: '207', color: '#FFC107' }
      }
    }
  });

  const [conflicts, setConflicts] = useState([
    { type: 'teacher', day: 1, lesson: 3, teacher: 'Сидоров В.Г.', conflict: 'Учитель должен быть в 8А классе' },
    { type: 'room', day: 2, lesson: 2, room: '105', conflict: 'Кабинет занят 10Б классом' }
  ]);

  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const lessons = [1, 2, 3, 4, 5, 6, 7];
  const allClasses = ['5А', '5Б', '6А', '6Б', '7А', '7Б', '8А', '8Б', '9А', '9Б', '10А', '10Б', '11А', '11Б'];

  const [draggedLesson, setDraggedLesson] = useState(null);

  const handleDragStart = (day, lessonNum) => {
    if (!editMode) return;
    const lesson = schedule[selectedClass]?.[day]?.[lessonNum];
    if (lesson) {
      setDraggedLesson({ day, lessonNum, lesson });
    }
  };

  const handleDragOver = (e, targetDay, targetLesson) => {
    e.preventDefault();
    if (!editMode || !draggedLesson) return;
  };

  const handleDrop = (targetDay, targetLesson) => {
    if (!editMode || !draggedLesson) return;
    
    const { day: sourceDay, lessonNum: sourceLesson, lesson } = draggedLesson;
    
    if (sourceDay === targetDay && sourceLesson === targetLesson) {
      setDraggedLesson(null);
      return;
    }

    const newSchedule = { ...schedule };
    
    // Удаляем урок из исходного места
    delete newSchedule[selectedClass][sourceDay][sourceLesson];
    
    // Добавляем урок в новое место
    if (!newSchedule[selectedClass][targetDay]) {
      newSchedule[selectedClass][targetDay] = {};
    }
    newSchedule[selectedClass][targetDay][targetLesson] = lesson;
    
    setSchedule(newSchedule);
    setDraggedLesson(null);
    
    // Проверяем конфликты после перемещения
    checkConflicts();
  };

  const checkConflicts = async () => {
    // Здесь будет API вызов для проверки конфликтов
    console.log('Checking conflicts...');
    // Моковая проверка
    const newConflicts = [];
    
    // Проверка занятости кабинетов
    const roomUsage = {};
    for (const [day, dayLessons] of Object.entries(schedule[selectedClass])) {
      for (const [lessonNum, lesson] of Object.entries(dayLessons)) {
        const key = `${day}-${lesson.room}`;
        if (roomUsage[key]) {
          newConflicts.push({
            type: 'room',
            day: parseInt(day),
            lesson: parseInt(lessonNum),
            room: lesson.room,
            conflict: `Кабинет занят другим уроком`
          });
        } else {
          roomUsage[key] = true;
        }
      }
    }
    
    setConflicts(newConflicts);
  };

  const saveChanges = async () => {
    try {
      // API вызов для сохранения изменений
      const response = await fetch('/api/schedule/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class: selectedClass,
          schedule: schedule[selectedClass],
          week
        })
      });
      
      if (response.ok) {
        alert('Изменения сохранены успешно!');
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Изменения сохранены! (мок)');
      setEditMode(false);
    }
  };

  const exportSchedule = (format) => {
    // Экспорт в Excel/PDF
    alert(`Экспорт в ${format.toUpperCase()} выполнен! (мок)`);
  };

  const printSchedule = () => {
    window.print();
  };

  const getLessonForCell = (dayIndex, lessonNum) => {
    const dayData = schedule[selectedClass]?.[dayIndex];
    return dayData?.[lessonNum] || null;
  };

  const hasConflict = (dayIndex, lessonNum) => {
    return conflicts.some(c => c.day === dayIndex && c.lesson === lessonNum);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="schedule-viewer-page">
      <div className="schedule-bg">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="schedule-glass-circle"></div>
        ))}
      </div>
      
      {/* Кнопка возврата */}
      <button 
        className="schedule-back-btn"
        onClick={handleBack}
        title="Вернуться назад"
      >
        <FaArrowLeft className="schedule-back-icon" />
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
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                {allClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            
            <div className="week-selector">
              <label>Неделя:</label>
              <div className="week-buttons">
                {[1, 2].map(w => (
                  <button
                    key={w}
                    className={week === w ? 'active' : ''}
                    onClick={() => setWeek(w)}
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
                }
              }}
            >
              {editMode ? <FaTimes /> : <FaEdit />}
              {editMode ? 'Отменить редактирование' : 'Редактировать'}
            </button>
            
            {editMode && (
              <button className="schedule-btn schedule-btn-success" onClick={saveChanges}>
                <FaSave />
                Сохранить изменения
              </button>
            )}
            
            <button className="schedule-btn schedule-btn-secondary" onClick={printSchedule}>
              <FaPrint />
              Печать
            </button>
            
            <div className="dropdown">
              <button className="schedule-btn schedule-btn-secondary dropdown-toggle">
                <FaDownload />
                Экспорт
              </button>
              <div className="dropdown-menu">
                <button onClick={() => exportSchedule('excel')}>Excel</button>
                <button onClick={() => exportSchedule('pdf')}>PDF</button>
                <button onClick={() => exportSchedule('image')}>Изображение</button>
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
        
        {/* Панель фильтров */}
        <div className="filter-panel">
          <h3><FaFilter /> Фильтры</h3>
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
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Основная таблица расписания */}
        <div className="schedule-table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="time-header">Урок / День</th>
                {days.map((day, index) => (
                  <th key={index} className="day-header">
                    <div>{day}</div>
                    <div className="day-date">{(index + 1)}.10.2023</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lessons.map(lessonNum => (
                <tr key={lessonNum}>
                  <td className="lesson-number">
                    <div className="lesson-time">
                      <div className="lesson-num">{lessonNum}</div>
                      <div className="time-range">
                        {8 + Math.floor((lessonNum - 1) * 1.5)}:00 - 
                        {8 + Math.floor((lessonNum - 1) * 1.5) + 1}:45
                      </div>
                    </div>
                  </td>
                  
                  {days.map((_, dayIndex) => {
                    const lessonData = getLessonForCell(dayIndex + 1, lessonNum);
                    const conflict = hasConflict(dayIndex + 1, lessonNum);
                    
                    return (
                      <td
                        key={`${dayIndex}-${lessonNum}`}
                        className={`schedule-cell ${conflict && showConflicts ? 'has-conflict' : ''} ${editMode ? 'editable' : ''}`}
                        onDragOver={(e) => handleDragOver(e, dayIndex + 1, lessonNum)}
                        onDrop={() => handleDrop(dayIndex + 1, lessonNum)}
                      >
                        {lessonData ? (
                          <div 
                            className={`lesson-card ${editMode ? 'draggable' : ''}`}
                            draggable={editMode}
                            onDragStart={() => handleDragStart(dayIndex + 1, lessonNum)}
                            style={{
                              backgroundColor: lessonData.color + '20',
                              borderLeft: `4px solid ${lessonData.color}`,
                              cursor: editMode ? 'move' : 'default'
                            }}
                          >
                            {conflict && showConflicts && (
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
                              
                              {filters.showTeachers && (
                                <div className="lesson-teacher">
                                  <FaUser /> {lessonData.teacher}
                                </div>
                              )}
                              
                              {filters.showRooms && (
                                <div className="lesson-room">
                                  <FaDoorOpen /> {lessonData.room}
                                </div>
                              )}
                            </div>
                            
                            {editMode && (
                              <div className="lesson-actions">
                                <button 
                                  className="btn-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Логика редактирования урока
                                    alert(`Редактирование урока: ${lessonData.subject}`);
                                  }}
                                >
                                  <FaEdit />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : editMode ? (
                          <div 
                            className="empty-slot"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(dayIndex + 1, lessonNum)}
                          >
                            Перетащите урок сюда
                          </div>
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
            <h3><FaExclamationTriangle /> Обнаруженные конфликты</h3>
            <div className="conflicts-list">
              {conflicts.map((conflict, index) => (
                <div key={index} className={`conflict-item ${conflict.type}`}>
                  <div className="conflict-header">
                    <FaBell />
                    <span className="conflict-type">
                      {conflict.type === 'teacher' ? 'Конфликт учителя' : 'Конфликт кабинета'}
                    </span>
                    <span className="conflict-location">
                      {days[conflict.day - 1]}, {conflict.lesson} урок
                    </span>
                  </div>
                  <div className="conflict-details">
                    {conflict.type === 'teacher' 
                      ? `Учитель ${conflict.teacher} должен быть в другом классе`
                      : `Кабинет ${conflict.room} занят другим классом`
                    }
                  </div>
                  <div className="conflict-actions">
                    <button className="schedule-btn schedule-btn-sm schedule-btn-outline">
                      Показать альтернативы
                    </button>
                    <button className="schedule-btn schedule-btn-sm schedule-btn-danger">
                      Игнорировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Панель альтернативных вариантов (при редактировании) */}
        {editMode && (
          <div className="alternatives-panel">
            <h3><FaSearch /> Доступные альтернативы</h3>
            <div className="alternatives-grid">
              <div className="alternative-item">
                <div className="alternative-subject">Математика</div>
                <div className="alternative-teacher">Иванова А.П.</div>
                <div className="alternative-room">Каб. 302</div>
                <div className="alternative-time">Понедельник, 3 урок</div>
                <button className="schedule-btn schedule-btn-sm schedule-btn-success">Применить</button>
              </div>
              <div className="alternative-item">
                <div className="alternative-subject">История</div>
                <div className="alternative-teacher">Сидоров В.Г.</div>
                <div className="alternative-room">Каб. 105</div>
                <div className="alternative-time">Вторник, 1 урок</div>
                <button className="schedule-btn schedule-btn-sm schedule-btn-success">Применить</button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default ScheduleViewer;