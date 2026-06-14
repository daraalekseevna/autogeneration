const EditLessonModal = ({ isOpen, onClose, onSave, lesson, subjects, teachers, rooms, classId, className }) => {
  const [formData, setFormData] = useState({ subject: '', teacher: '', room: '' });
  const [conflicts, setConflicts] = useState([]);
  const [checking, setChecking] = useState(false);
  
  // Состояния для приоритетных данных
  const [priorityTeachers, setPriorityTeachers] = useState([]);
  const [priorityRooms, setPriorityRooms] = useState([]);
  const [loadingPriority, setLoadingPriority] = useState(false);
  const [subjectTeachersMap, setSubjectTeachersMap] = useState({});
  const [subjectRoomsMap, setSubjectRoomsMap] = useState({});

  useEffect(() => {
    if (lesson && isOpen) {
      setFormData({
        subject: lesson.subject || '',
        teacher: lesson.teacher || '',
        room: lesson.room || ''
      });
      setConflicts([]);
      
      // Если есть предмет, загружаем приоритетных учителей и кабинеты
      if (lesson.subject) {
        loadPriorityTeachers(lesson.subject);
        loadPriorityRooms(lesson.subject);
      }
    }
  }, [lesson, isOpen]);

  // Загрузка приоритетных учителей для предмета
  const loadPriorityTeachers = async (subjectName) => {
    if (subjectTeachersMap[subjectName]) {
      setPriorityTeachers(subjectTeachersMap[subjectName]);
      return;
    }
    
    setLoadingPriority(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/schedule/priority-teachers/${encodeURIComponent(subjectName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const priorityList = response.data || [];
      setSubjectTeachersMap(prev => ({ ...prev, [subjectName]: priorityList }));
      setPriorityTeachers(priorityList);
    } catch (err) {
      console.error('Error loading priority teachers:', err);
      setPriorityTeachers([]);
    } finally {
      setLoadingPriority(false);
    }
  };

  // Загрузка приоритетных кабинетов для предмета и учителя
  const loadPriorityRooms = async (subjectName, teacherName = null) => {
    setLoadingPriority(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/schedule/priority-rooms/${encodeURIComponent(subjectName)}`;
      if (teacherName) {
        url += `?teacher=${encodeURIComponent(teacherName)}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const priorityList = response.data || [];
      setPriorityRooms(priorityList);
    } catch (err) {
      console.error('Error loading priority rooms:', err);
      setPriorityRooms([]);
    } finally {
      setLoadingPriority(false);
    }
  };

  // При изменении предмета
  const handleSubjectChange = async (subjectName) => {
    setFormData(prev => ({ ...prev, subject: subjectName, teacher: '', room: '' }));
    setPriorityRooms([]);
    
    if (subjectName) {
      await loadPriorityTeachers(subjectName);
    } else {
      setPriorityTeachers([]);
    }
  };

  // При изменении учителя
  const handleTeacherChange = async (teacherName) => {
    setFormData(prev => ({ ...prev, teacher: teacherName, room: '' }));
    
    if (formData.subject && teacherName) {
      await loadPriorityRooms(formData.subject, teacherName);
    }
  };

  // Фильтрация учителей: сначала приоритетные, потом остальные
  const getFilteredTeachers = () => {
    if (!formData.subject) return teachers;
    
    const priorityIds = priorityTeachers.map(t => t.id);
    const priorityList = teachers.filter(t => priorityIds.includes(t.id));
    const otherList = teachers.filter(t => !priorityIds.includes(t.id));
    
    return [...priorityList, ...otherList];
  };

  // Фильтрация кабинетов: сначала приоритетные, потом остальные
  const getFilteredRooms = () => {
    if (!formData.subject) return rooms;
    
    const priorityRoomNumbers = priorityRooms.map(r => r.number);
    const priorityList = rooms.filter(r => priorityRoomNumbers.includes(r.number));
    const otherList = rooms.filter(r => !priorityRoomNumbers.includes(r.number));
    
    return [...priorityList, ...otherList];
  };

  const checkConflicts = async () => {
    if (!formData.subject || !formData.teacher || !formData.room) return;
    
    setChecking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/schedule/check-conflicts`, {
        ...lesson,
        ...formData,
        classId,
        className
      }, { headers: { Authorization: `Bearer ${token}` } });
      setConflicts(response.data.conflicts || []);
    } catch (err) {
      console.error('Error checking conflicts:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (formData.subject && formData.teacher && formData.room) {
      const timeout = setTimeout(checkConflicts, 500);
      return () => clearTimeout(timeout);
    }
  }, [formData]);

  const handleSave = () => {
    if (!formData.subject || !formData.teacher || !formData.room) {
      alert('Заполните все поля');
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FaEdit /> {lesson ? 'Редактировать урок' : 'Добавить урок'}</h3>
          <button className="close-modal" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-content">
          {/* Информация о классе */}
          {className && (
            <div className="class-info-badge">
              <FaSchool /> Класс: {className}
            </div>
          )}

          <div className="form-group">
            <label><FaGraduationCap /> Предмет</label>
            <select 
              value={formData.subject} 
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              <option value="">Выберите предмет</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} {s.shortName && `(${s.shortName})`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label><FaChalkboardTeacher /> Учитель</label>
            <select 
              value={formData.teacher} 
              onChange={(e) => handleTeacherChange(e.target.value)}
              disabled={!formData.subject}
            >
              <option value="">{!formData.subject ? 'Сначала выберите предмет' : 'Выберите учителя'}</option>
              {getFilteredTeachers().map(t => {
                const isPriority = priorityTeachers.some(p => p.id === t.id);
                return (
                  <option key={t.id} value={t.name}>
                    {t.name} {isPriority && '⭐ (приоритет)'}
                  </option>
                );
              })}
            </select>
            {loadingPriority && <div className="loading-priority"><FaSpinner className="spinner" /> Загрузка приоритетных учителей...</div>}
            {formData.subject && priorityTeachers.length === 0 && !loadingPriority && (
              <div className="info-hint">ℹ️ Нет приоритетных учителей для этого предмета. Можно выбрать любого.</div>
            )}
          </div>

          <div className="form-group">
            <label><FaDoorOpen /> Кабинет</label>
            <select 
              value={formData.room} 
              onChange={(e) => setFormData({...formData, room: e.target.value})}
              disabled={!formData.subject || !formData.teacher}
            >
              <option value="">
                {!formData.subject ? 'Сначала выберите предмет' : 
                 !formData.teacher ? 'Сначала выберите учителя' : 
                 'Выберите кабинет'}
              </option>
              {getFilteredRooms().map(r => {
                const isPriority = priorityRooms.some(p => p.number === r.number);
                return (
                  <option key={r.id} value={r.number}>
                    Кабинет {r.number} {r.name && `(${r.name})`} {isPriority && '⭐ (рекомендуемый)'}
                  </option>
                );
              })}
            </select>
            {formData.subject && formData.teacher && priorityRooms.length === 0 && !loadingPriority && (
              <div className="info-hint">ℹ️ Нет приоритетных кабинетов. Можно выбрать любой.</div>
            )}
          </div>
          
          {conflicts.length > 0 && (
            <div className="conflicts-warning">
              <div className="conflicts-header"><FaExclamationTriangle /> Обнаружены конфликты:</div>
              <ul className="conflicts-list">
                {conflicts.map((c, i) => (
                  <li key={i} className={`conflict-${c.severity}`}>
                    {c.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {checking && <div className="conflicts-checking"><FaSpinner className="spinner" /> Проверка конфликтов...</div>}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleSave} disabled={checking || !formData.subject || !formData.teacher || !formData.room}>
            <FaSave /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};