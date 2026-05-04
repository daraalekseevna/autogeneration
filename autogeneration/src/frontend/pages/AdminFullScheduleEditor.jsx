import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaTimes, FaEdit, FaTrash, FaCopy, FaCalendarAlt,
  FaBuilding, FaChalkboardTeacher, FaBook, FaSun, FaMoon, FaGripVertical,
  FaPlus, FaDownload, FaUpload
} from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import { getAllClasses, getAllTeachers, getAllRooms, getAllSubjects, WeekDays, ScheduleTimes } from '../config/schoolData';
import styles from '../styles/AdminFullScheduleEditor.module.css';

const LessonEditModal = ({ isOpen, onClose, onSave, lessonData, subjects, teachers, rooms, durations, subgroupOptions }) => {
  const [form, setForm] = useState({
    subject: '',
    teacher: '',
    room: '',
    duration: 45,
    subgroup: null
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lessonData) {
      setForm({
        subject: lessonData.subject || '',
        teacher: lessonData.teacher || '',
        room: lessonData.room || '',
        duration: lessonData.duration || 45,
        subgroup: lessonData.subgroup || null
      });
    }
  }, [lessonData]);

  const validate = () => {
    const newErrors = {};
    if (!form.subject) newErrors.subject = 'Выберите предмет';
    if (!form.teacher) newErrors.teacher = 'Выберите учителя';
    if (!form.room) newErrors.room = 'Выберите кабинет';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(form);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3><FaEdit /> Редактировать урок</h3>
          <button className={styles.closeModal} onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label><FaBook /> Предмет</label>
            <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
              <option value="">Выберите предмет</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.subject && <span className={styles.error}>{errors.subject}</span>}
          </div>
          <div className={styles.formGroup}>
            <label><FaChalkboardTeacher /> Учитель</label>
            <select value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})}>
              <option value="">Выберите учителя</option>
              {teachers.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {errors.teacher && <span className={styles.error}>{errors.teacher}</span>}
          </div>
          <div className={styles.formGroup}>
            <label><FaBuilding /> Кабинет</label>
            <select value={form.room} onChange={e => setForm({...form, room: e.target.value})}>
              <option value="">Выберите кабинет</option>
              {rooms.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {errors.room && <span className={styles.error}>{errors.room}</span>}
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Длительность (мин)</label>
              <select value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})}>
                {durations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Подгруппа</label>
              <select value={form.subgroup === null ? 'null' : form.subgroup} onChange={e => setForm({...form, subgroup: e.target.value === 'null' ? null : parseInt(e.target.value)})}>
                {subgroupOptions.map(opt => <option key={opt.value === null ? 'null' : opt.value} value={opt.value === null ? 'null' : opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Отмена</button>
            <button type="submit" className={styles.btnPrimary}>Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminFullSchedule = () => {
  const navigate = useNavigate();
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({ isOpen: false, className: null, dayId: null, lessonNumber: null, lesson: null });
  const [dragMode, setDragMode] = useState(null);
  const [draggedData, setDraggedData] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  
  const allClasses = getAllClasses().map(c => c.name);
  const teachers = getAllTeachers().map(t => ({ value: t.name, label: `${t.name} (${t.subject})` }));
  const rooms = getAllRooms().map(r => ({ value: r.name, label: r.name }));
  const subjects = getAllSubjects().map(s => s.name);
  const durations = [30, 45, 60, 90, 120];
  const subgroupOptions = [
    { value: null, label: 'Весь класс' },
    { value: 1, label: '1 подгруппа' },
    { value: 2, label: '2 подгруппа' }
  ];
  
  const weekDays = WeekDays.filter(day => !day.isWeekend);
  const lessons = ScheduleTimes.firstShiftLessons;
  
  const rows = useMemo(() => {
    const result = [];
    weekDays.forEach(day => {
      lessons.forEach(lesson => {
        result.push({
          dayId: day.id,
          dayShort: day.shortName,
          dayName: day.name,
          lessonNumber: lesson.number,
          lessonTime: `${lesson.startTime}–${lesson.endTime}`
        });
      });
    });
    return result;
  }, [weekDays, lessons]);

  const loadAllSchedules = useCallback(() => {
    setLoading(true);
    try {
      const data = {};
      for (const className of allClasses) {
        const key = `schedule_${className}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          data[className] = JSON.parse(saved);
        } else {
          const empty = {};
          weekDays.forEach(day => { empty[day.id] = {}; });
          data[className] = empty;
        }
      }
      setScheduleData(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  }, [allClasses, weekDays]);

  useEffect(() => {
    loadAllSchedules();
  }, [loadAllSchedules]);

  const getLesson = (className, dayId, lessonNumber) => {
    return scheduleData[className]?.[dayId]?.[lessonNumber] || null;
  };

  const saveSchedule = (className, dayId, daySchedule) => {
    const key = `schedule_${className}`;
    const current = scheduleData[className] || {};
    const updated = { ...current, [dayId]: { ...current[dayId], ...daySchedule } };
    localStorage.setItem(key, JSON.stringify(updated));
    setScheduleData(prev => ({ ...prev, [className]: updated }));
  };

  const updateLesson = (className, dayId, lessonNumber, newLesson) => {
    const daySchedule = scheduleData[className]?.[dayId] || {};
    const updatedDay = { ...daySchedule, [lessonNumber]: newLesson };
    saveSchedule(className, dayId, updatedDay);
  };

  const handleEditLesson = (className, dayId, lessonNumber, lesson) => {
    setEditModal({ isOpen: true, className, dayId, lessonNumber, lesson });
  };

  const handleSaveLesson = (formData) => {
    const { className, dayId, lessonNumber, lesson } = editModal;
    const foundSubject = getAllSubjects().find(s => s.name === formData.subject);
    const newLesson = {
      ...lesson,
      ...formData,
      color: foundSubject?.color || '#9E9E9E'
    };
    updateLesson(className, dayId, lessonNumber, newLesson);
    setEditModal({ ...editModal, isOpen: false });
  };

  const handleClearLesson = (className, dayId, lessonNumber) => {
    if (window.confirm('Очистить урок?')) {
      updateLesson(className, dayId, lessonNumber, null);
    }
  };

  const handleDragStart = (e, type, className, dayId, lessonNumber, value) => {
    if (!dragMode || dragMode !== type) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, className, dayId, lessonNumber, value }));
    setDraggedData({ type, className, dayId, lessonNumber, value });
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDragEnter = (e, className, dayId, lessonNumber) => {
    e.preventDefault();
    setDragOverCell({ className, dayId, lessonNumber });
  };
  const handleDragLeave = () => setDragOverCell(null);

  const handleDrop = (e, targetClass, targetDayId, targetLessonNum) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!dragMode || !draggedData) return;

    const source = draggedData;
    const targetLesson = getLesson(targetClass, targetDayId, targetLessonNum);
    const sourceLesson = getLesson(source.className, source.dayId, source.lessonNumber);
    if (!sourceLesson) return;

    const newSource = { ...sourceLesson };
    const newTarget = targetLesson ? { ...targetLesson } : { subject: '', teacher: '', room: '', duration: 45, color: '#9E9E9E' };

    if (dragMode === 'rooms') {
      [newSource.room, newTarget.room] = [newTarget.room, newSource.room];
    } else if (dragMode === 'teachers') {
      [newSource.teacher, newTarget.teacher] = [newTarget.teacher, newSource.teacher];
    } else if (dragMode === 'subjects') {
      [newSource.subject, newTarget.subject] = [newTarget.subject, newSource.subject];
      [newSource.color, newTarget.color] = [newTarget.color, newSource.color];
    }

    updateLesson(source.className, source.dayId, source.lessonNumber, newSource);
    updateLesson(targetClass, targetDayId, targetLessonNum, newTarget);
    setDraggedData(null);
  };

  const copyDayToClass = (sourceClass, targetClass, dayId) => {
    const sourceDay = scheduleData[sourceClass]?.[dayId] || {};
    saveSchedule(targetClass, dayId, sourceDay);
  };

  const exportAllData = () => {
    const dataStr = JSON.stringify(scheduleData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full_schedule_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAllData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        for (const className of allClasses) {
          if (imported[className]) {
            for (const dayId of weekDays.map(d => d.id)) {
              if (imported[className][dayId]) {
                saveSchedule(className, dayId, imported[className][dayId]);
              }
            }
          }
        }
        alert('Расписание импортировано');
        loadAllSchedules();
      } catch (err) {
        alert('Ошибка при импорте');
      }
    };
    reader.readAsText(file);
  };

  const getSubjectColor = (subject) => {
    const found = getAllSubjects().find(s => s.name === subject);
    return found?.color || '#9E9E9E';
  };

  const renderCell = (className, row) => {
    const lesson = getLesson(className, row.dayId, row.lessonNumber);
    const isDragOver = dragOverCell?.className === className && dragOverCell?.dayId === row.dayId && dragOverCell?.lessonNumber === row.lessonNumber;
    
    return (
      <td
        key={`${className}-${row.dayId}-${row.lessonNumber}`}
        className={`${styles.cell} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, className, row.dayId, row.lessonNumber)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, className, row.dayId, row.lessonNumber)}
      >
        {lesson ? (
          <div className={styles.lessonCard} style={{ borderLeftColor: lesson.color || getSubjectColor(lesson.subject), backgroundColor: `${lesson.color || getSubjectColor(lesson.subject)}15` }}>
            <div className={styles.lessonActions}>
              <button onClick={() => handleEditLesson(className, row.dayId, row.lessonNumber, lesson)}><FaEdit /></button>
              <button onClick={() => handleClearLesson(className, row.dayId, row.lessonNumber)}><FaTrash /></button>
            </div>
            <div className={styles.lessonSubject}>
              {dragMode === 'subjects' && (
                <span draggable onDragStart={(e) => handleDragStart(e, 'subjects', className, row.dayId, row.lessonNumber, lesson.subject)} className={styles.dragHandle}>
                  <FaGripVertical />
                </span>
              )}
              <span>{lesson.subject}</span>
            </div>
            <div className={styles.lessonTeacher}>
              {dragMode === 'teachers' && (
                <span draggable onDragStart={(e) => handleDragStart(e, 'teachers', className, row.dayId, row.lessonNumber, lesson.teacher)} className={styles.dragHandle}>
                  <FaGripVertical />
                </span>
              )}
              <FaChalkboardTeacher /> {lesson.teacher}
            </div>
            <div className={styles.lessonRoom}>
              {dragMode === 'rooms' && (
                <span draggable onDragStart={(e) => handleDragStart(e, 'rooms', className, row.dayId, row.lessonNumber, lesson.room)} className={styles.dragHandle}>
                  <FaGripVertical />
                </span>
              )}
              <FaBuilding /> {lesson.room}
            </div>
            {lesson.subgroup && <div className={styles.subgroupBadge}>Подгр.{lesson.subgroup}</div>}
          </div>
        ) : (
          <div className={styles.emptyCell} onClick={() => handleEditLesson(className, row.dayId, row.lessonNumber, null)}>
            <FaPlus /> Добавить
          </div>
        )}
      </td>
    );
  };

  if (loading) return <div className={styles.loader}>Загрузка расписания...</div>;

  return (
    <div className={styles.page}>
      <ThemeToggle />
      <BackButton fallbackPath="/" />
      
      <div className={styles.animatedBg}>
        {[...Array(10)].map((_, i) => <div key={i} className={styles.glassCircle}></div>)}
      </div>
      
      <Header />
      
      <div className={styles.topBar}>
        <button className={styles.exportBtn} onClick={exportAllData}><FaDownload /> Экспорт</button>
        <label className={styles.importBtn}>
          <FaUpload /> Импорт
          <input type="file" accept=".json" onChange={importAllData} style={{ display: 'none' }} />
        </label>
      </div>
      
      <main className={styles.container}>
        <div className={styles.header}>
          <h1><FaCalendarAlt /> Полное расписание школы</h1>
          <div className={styles.dragModeSelector}>
            <span>Drag&Drop:</span>
            <button className={dragMode === 'rooms' ? styles.active : ''} onClick={() => setDragMode(dragMode === 'rooms' ? null : 'rooms')}>Кабинеты</button>
            <button className={dragMode === 'teachers' ? styles.active : ''} onClick={() => setDragMode(dragMode === 'teachers' ? null : 'teachers')}>Учителя</button>
            <button className={dragMode === 'subjects' ? styles.active : ''} onClick={() => setDragMode(dragMode === 'subjects' ? null : 'subjects')}>Предметы</button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.fullTable}>
            <thead>
              <tr>
                <th className={styles.rowHeader}>День / Урок</th>
                {allClasses.map(className => (
                  <th key={className} className={styles.classCol}>
                    {className}
                    <button
                      className={styles.copyDayBtn}
                      onClick={() => {
                        const source = prompt('Скопировать день из класса:', allClasses[0]);
                        if (source && source !== className) {
                          const dayId = prompt('День (monday, tuesday, wednesday, thursday, friday, saturday):', 'monday');
                          if (dayId && weekDays.some(d => d.id === dayId)) {
                            copyDayToClass(source, className, dayId);
                            loadAllSchedules();
                          }
                        }
                      }}
                      title="Копировать день"
                    >
                      <FaCopy />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={`${row.dayId}-${row.lessonNumber}`}>
                  <td className={styles.rowHeaderCell}>
                    <div className={styles.dayLessonInfo}>
                      <span className={styles.dayName}>{row.dayShort}</span>
                      <span className={styles.lessonNumber}>{row.lessonNumber}</span>
                      <span className={styles.lessonTime}>{row.lessonTime}</span>
                    </div>
                  </td>
                  {allClasses.map(className => renderCell(className, row))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <LessonEditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ ...editModal, isOpen: false })}
          onSave={handleSaveLesson}
          lessonData={editModal.lesson}
          subjects={subjects}
          teachers={teachers}
          rooms={rooms}
          durations={durations}
          subgroupOptions={subgroupOptions}
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminFullSchedule;