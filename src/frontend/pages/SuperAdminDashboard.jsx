// SuperAdminDashboard.jsx - с редактированием и привязкой учителей к классу
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaTrash, FaCheck, FaTimes, FaSun, FaMoon, FaUserPlus, FaChalkboardTeacher, FaSchool, FaUsers, FaSync, FaSearch, FaBook, FaChevronDown, FaChevronUp, FaEdit, FaUserCheck, FaUserSlash } from 'react-icons/fa';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/MainContent.css';
import '../styles/SuperAdmin.css';

const API_URL = 'http://localhost:5000/api';

// Компонент модального окна для выбора предметов
const SubjectSelectorModal = ({ isOpen, onClose, subjects, selectedIds, onSave, teacherName }) => {
  const [tempSelectedIds, setTempSelectedIds] = useState(selectedIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedIds);
      setSearchTerm('');
      setSelectAll(false);
    }
  }, [isOpen, selectedIds]);

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSubject = (subjectId) => {
    setTempSelectedIds(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setTempSelectedIds([]);
    } else {
      setTempSelectedIds(filteredSubjects.map(s => s.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSave = () => {
    onSave(tempSelectedIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="subject-modal-overlay" onClick={onClose}>
      <div className="subject-modal-content" onClick={e => e.stopPropagation()}>
        <div className="subject-modal-header">
          <h3><FaBook /> Выбор предметов для {teacherName}</h3>
          <button className="subject-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="subject-modal-search">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Поиск предметов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="subject-modal-select-all">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={selectAll && filteredSubjects.length > 0}
              onChange={handleSelectAll}
            />
            <span>Выбрать все ({filteredSubjects.length})</span>
          </label>
        </div>
        
        <div className="subject-modal-list">
          {filteredSubjects.length === 0 ? (
            <div className="subject-modal-empty">Предметы не найдены</div>
          ) : (
            filteredSubjects.map(subject => (
              <label key={subject.id} className="subject-modal-item">
                <input
                  type="checkbox"
                  checked={tempSelectedIds.includes(subject.id)}
                  onChange={() => toggleSubject(subject.id)}
                />
                <span className="subject-modal-item-name">{subject.name}</span>
              </label>
            ))
          )}
        </div>
        
        <div className="subject-modal-footer">
          <div className="subject-modal-selected-count">
            Выбрано: {tempSelectedIds.length}
          </div>
          <div className="subject-modal-actions">
            <button className="subject-modal-cancel" onClick={onClose}>
              Отмена
            </button>
            <button className="subject-modal-save" onClick={handleSave}>
              <FaCheck /> Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент модального окна для выбора учителя (классный руководитель)
const TeacherSelectorModal = ({ isOpen, onClose, teachers, selectedTeacherId, onSave, className }) => {
  const [tempTeacherId, setTempTeacherId] = useState(selectedTeacherId);

  useEffect(() => {
    if (isOpen) {
      setTempTeacherId(selectedTeacherId);
    }
  }, [isOpen, selectedTeacherId]);

  const handleSave = () => {
    onSave(tempTeacherId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="subject-modal-overlay" onClick={onClose}>
      <div className="subject-modal-content" onClick={e => e.stopPropagation()}>
        <div className="subject-modal-header">
          <h3><FaChalkboardTeacher /> Назначить классного руководителя для {className}</h3>
          <button className="subject-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="teacher-selector-list">
          <div className="teacher-selector-option">
            <label className="teacher-selector-item">
              <input
                type="radio"
                name="teacher"
                value=""
                checked={tempTeacherId === null || tempTeacherId === ''}
                onChange={() => setTempTeacherId(null)}
              />
              <span className="teacher-selector-name">Не назначен</span>
            </label>
          </div>
          {teachers.map(teacher => (
            <div key={teacher.id} className="teacher-selector-option">
              <label className="teacher-selector-item">
                <input
                  type="radio"
                  name="teacher"
                  value={teacher.id}
                  checked={tempTeacherId === teacher.id}
                  onChange={() => setTempTeacherId(teacher.id)}
                />
                <span className="teacher-selector-name">{teacher.name}</span>
              </label>
            </div>
          ))}
        </div>
        
        <div className="subject-modal-footer">
          <div className="subject-modal-actions">
            <button className="subject-modal-cancel" onClick={onClose}>
              Отмена
            </button>
            <button className="subject-modal-save" onClick={handleSave}>
              <FaCheck /> Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент модального окна для редактирования администратора
const AdminEditModal = ({ isOpen, onClose, admin, onSave }) => {
  const [formData, setFormData] = useState({ name: '', login: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (admin && isOpen) {
      setFormData({
        name: admin.name || '',
        login: admin.login || '',
        password: ''
      });
    }
  }, [admin, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (admin && admin.id) {
      setIsSubmitting(true);
      try {
        await onSave(admin.id, formData);
        onClose();
      } catch (error) {
        console.error('Save error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen || !admin || !admin.id) return null;

  return (
    <div className="subject-modal-overlay" onClick={onClose}>
      <div className="subject-modal-content" onClick={e => e.stopPropagation()}>
        <div className="subject-modal-header">
          <h3><FaEdit /> Редактировать администратора</h3>
          <button className="subject-modal-close" onClick={onClose} disabled={isSubmitting}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ФИО *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="form-input"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Логин *</label>
            <input
              type="text"
              value={formData.login}
              onChange={(e) => setFormData({...formData, login: e.target.value})}
              className="form-input"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Новый пароль (оставьте пустым, чтобы не менять)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="form-input"
              placeholder="Оставьте пустым"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="subject-modal-footer">
            <div className="subject-modal-actions">
              <button type="button" className="subject-modal-cancel" onClick={onClose} disabled={isSubmitting}>
                Отмена
              </button>
              <button type="submit" className="subject-modal-save" disabled={isSubmitting}>
                <FaCheck /> {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Компонент модального окна для редактирования учителя
const TeacherEditModal = ({ isOpen, onClose, teacher, onSave }) => {
  const [formData, setFormData] = useState({ lastName: '', firstName: '', middleName: '', login: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teacher && isOpen) {
      setFormData({
        lastName: teacher.last_name || teacher.lastName || '',
        firstName: teacher.first_name || teacher.firstName || '',
        middleName: teacher.middle_name || teacher.middleName || '',
        login: teacher.login || '',
        password: ''
      });
    }
  }, [teacher, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (teacher && teacher.id) {
      setIsSubmitting(true);
      try {
        await onSave(teacher.id, formData);
        onClose();
      } catch (error) {
        console.error('Save error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen || !teacher || !teacher.id) return null;

  return (
    <div className="subject-modal-overlay" onClick={onClose}>
      <div className="subject-modal-content" onClick={e => e.stopPropagation()}>
        <div className="subject-modal-header">
          <h3><FaEdit /> Редактировать учителя</h3>
          <button className="subject-modal-close" onClick={onClose} disabled={isSubmitting}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Фамилия *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="form-input"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label>Имя *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="form-input"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Отчество</label>
            <input
              type="text"
              value={formData.middleName}
              onChange={(e) => setFormData({...formData, middleName: e.target.value})}
              className="form-input"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Логин *</label>
            <input
              type="text"
              value={formData.login}
              onChange={(e) => setFormData({...formData, login: e.target.value})}
              className="form-input"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Новый пароль (оставьте пустым, чтобы не менять)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="form-input"
              placeholder="Оставьте пустым"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="subject-modal-footer">
            <div className="subject-modal-actions">
              <button type="button" className="subject-modal-cancel" onClick={onClose} disabled={isSubmitting}>
                Отмена
              </button>
              <button type="submit" className="subject-modal-save" disabled={isSubmitting}>
                <FaCheck /> {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  
  // Модальные окна
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [teacherSelectorOpen, setTeacherSelectorOpen] = useState(false);
  const [adminEditOpen, setAdminEditOpen] = useState(false);
  const [teacherEditOpen, setTeacherEditOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);
  const [tempSubjectIds, setTempSubjectIds] = useState([]);

  // Формы
  const [newAdmin, setNewAdmin] = useState({ login: '', password: '', name: '' });
  const [newTeacher, setNewTeacher] = useState({
    lastName: '', firstName: '', middleName: '',
    subjectIds: [],
    login: '', password: ''
  });
  const [newClass, setNewClass] = useState({
    number: '', letter: '', shift: 1, teacherId: '',
    login: '', password: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [adminsRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
        axios.get(`${API_URL}/superadmin/admins`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/superadmin/teachers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/superadmin/classes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/superadmin/subjects`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setAdmins(Array.isArray(adminsRes.data) ? adminsRes.data : []);
      setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
    } catch (err) {
      console.error('Load error:', err);
      showNotification('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  // ============= АДМИНИСТРАТОРЫ =============
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.login || !newAdmin.password || !newAdmin.name) {
      showNotification('Заполните все поля');
      return;
    }
    try {
      await axios.post(`${API_URL}/superadmin/admins`, newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Администратор добавлен');
      setNewAdmin({ login: '', password: '', name: '' });
      loadData();
    } catch (err) {
      console.error('Add admin error:', err);
      showNotification(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleEditAdmin = (admin) => {
    setCurrentAdmin(admin);
    setAdminEditOpen(true);
  };

  const handleSaveAdmin = async (id, data) => {
    try {
      await axios.put(`${API_URL}/superadmin/admins/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Администратор обновлён');
      loadData();
      setAdminEditOpen(false);
      setCurrentAdmin(null);
    } catch (err) {
      console.error('Edit admin error:', err);
      showNotification(err.response?.data?.message || 'Ошибка обновления');
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Удалить администратора?')) return;
    try {
      await axios.delete(`${API_URL}/superadmin/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Администратор удалён');
      loadData();
    } catch (err) {
      console.error('Delete admin error:', err);
      showNotification('Ошибка удаления');
    }
  };

  // ============= УЧИТЕЛЯ =============
  const openSubjectModal = (teacher = null) => {
    if (teacher) {
      setCurrentTeacher(teacher);
      setTempSubjectIds(teacher.subjectIds || []);
    } else {
      setCurrentTeacher(null);
      setTempSubjectIds(newTeacher.subjectIds);
    }
    setSubjectModalOpen(true);
  };

  const handleSaveSubjects = async (selectedIds) => {
    if (currentTeacher) {
      try {
        await axios.put(`${API_URL}/superadmin/teachers/${currentTeacher.id}`, {
          subjectIds: selectedIds
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Предметы обновлены');
        loadData();
      } catch (err) {
        console.error('Update subjects error:', err);
        showNotification('Ошибка обновления предметов');
      }
    } else {
      setNewTeacher(prev => ({ ...prev, subjectIds: selectedIds }));
    }
    setSubjectModalOpen(false);
  };

  const handleEditTeacher = (teacher) => {
    setCurrentTeacher(teacher);
    setTeacherEditOpen(true);
  };

  const handleSaveTeacher = async (id, data) => {
    try {
      const updateData = {
        lastName: data.lastName,
        firstName: data.firstName,
        middleName: data.middleName || '',
        login: data.login,
        password: data.password || ''
      };
      await axios.put(`${API_URL}/superadmin/teachers/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Учитель обновлён');
      loadData();
      setTeacherEditOpen(false);
      setCurrentTeacher(null);
    } catch (err) {
      console.error('Edit teacher error:', err);
      showNotification(err.response?.data?.message || 'Ошибка обновления');
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!newTeacher.lastName || !newTeacher.firstName || !newTeacher.login || !newTeacher.password) {
      showNotification('Заполните фамилию, имя, логин и пароль');
      return;
    }
    try {
      await axios.post(`${API_URL}/superadmin/teachers`, newTeacher, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Учитель добавлен');
      setNewTeacher({ lastName: '', firstName: '', middleName: '', subjectIds: [], login: '', password: '' });
      loadData();
    } catch (err) {
      console.error('Add teacher error:', err);
      showNotification(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Удалить учителя?')) return;
    try {
      await axios.delete(`${API_URL}/superadmin/teachers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Учитель удалён');
      loadData();
    } catch (err) {
      console.error('Delete teacher error:', err);
      showNotification('Ошибка удаления');
    }
  };

  // ============= КЛАССЫ =============
  const openTeacherSelector = (classItem) => {
    setCurrentClass(classItem);
    setTeacherSelectorOpen(true);
  };

  const handleAssignTeacher = async (teacherId) => {
    if (!currentClass) return;
    
    try {
      await axios.put(`${API_URL}/superadmin/classes/${currentClass.id}`, { 
        teacherId: teacherId 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification(teacherId ? 'Классный руководитель назначен' : 'Классный руководитель отвязан');
      loadData();
      setTeacherSelectorOpen(false);
      setCurrentClass(null);
    } catch (err) {
      console.error('Assign teacher error:', err);
      showNotification('Ошибка');
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass.number || !newClass.letter || !newClass.login || !newClass.password) {
      showNotification('Заполните номер, букву, логин и пароль');
      return;
    }
    try {
      await axios.post(`${API_URL}/superadmin/classes`, newClass, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Класс добавлен');
      setNewClass({ number: '', letter: '', shift: 1, teacherId: '', login: '', password: '' });
      loadData();
    } catch (err) {
      console.error('Add class error:', err);
      showNotification(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleChangeShift = async (classId, currentShift) => {
    const newShift = currentShift === 1 ? 2 : 1;
    try {
      await axios.put(`${API_URL}/superadmin/classes/${classId}`, { shift: newShift }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Смена изменена');
      loadData();
    } catch (err) {
      console.error('Change shift error:', err);
      showNotification('Ошибка');
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Удалить класс?')) return;
    try {
      await axios.delete(`${API_URL}/superadmin/classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Класс удалён');
      loadData();
    } catch (err) {
      console.error('Delete class error:', err);
      showNotification('Ошибка удаления');
    }
  };

  const stats = useMemo(() => ({
    admins: admins.length,
    teachers: teachers.length,
    classes: classes.length,
    classesWithoutTeacher: classes.filter(c => !c.teacher_name).length,
    shift1: classes.filter(c => c.shift === 1).length,
    shift2: classes.filter(c => c.shift === 2).length
  }), [admins, teachers, classes]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Загрузка...</p>
    </div>
  );

  return (
    <div className={`main-content-page ${isDarkTheme ? 'dark-theme' : ''}`}>
      <div className="animated-bg">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="glass-circle"></div>
        ))}
      </div>
      
      <Header />
      
      <div className="theme-toggle-superadmin">
        <button className="theme-btn-superadmin" onClick={toggleTheme}>
          {isDarkTheme ? <FaSun /> : <FaMoon />}
          <span>{isDarkTheme ? 'Светлая тема' : 'Темная тема'}</span>
        </button>
      </div>

      <main className="superadmin-container">
        {notification && <div className="notification">{notification}</div>}

        <div className="superadmin-header">
          <h1 className="superadmin-title">Панель управления</h1>
          <p className="superadmin-subtitle">Управление администраторами, учителями и классами</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-number">{stats.admins}</div><div className="stat-label">Администраторов</div></div>
          <div className="stat-card"><div className="stat-number">{stats.teachers}</div><div className="stat-label">Учителей</div></div>
          <div className="stat-card"><div className="stat-number">{stats.classes}</div><div className="stat-label">Классов</div></div>
        </div>

        <div className="tabs-container">
          <button onClick={() => setActiveTab('admins')} className={`tab-button ${activeTab === 'admins' ? 'active' : ''}`}>
            <FaUsers /> Администраторы
          </button>
          <button onClick={() => setActiveTab('teachers')} className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`}>
            <FaChalkboardTeacher /> Учителя
          </button>
          <button onClick={() => setActiveTab('classes')} className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}>
            <FaSchool /> Классы
          </button>
        </div>

        {/* ============= АДМИНИСТРАТОРЫ ============= */}
        {activeTab === 'admins' && (
          <div className="content-grid">
            <div className="form-container">
              <h3 className="form-title"><FaUserPlus /> Новый администратор</h3>
              <form onSubmit={handleAddAdmin}>
                <div className="form-group">
                  <label className="form-label">Логин *</label>
                  <input type="text" value={newAdmin.login} onChange={(e) => setNewAdmin({...newAdmin, login: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Пароль *</label>
                  <input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">ФИО *</label>
                  <input type="text" value={newAdmin.name} onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})} className="form-input" />
                </div>
                <button type="submit" className="submit-button">Добавить администратора</button>
              </form>
            </div>
            <div className="table-container">
              <h3 className="table-title">Список администраторов ({admins.length})</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Логин</th>
                      <th>ФИО</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(a => (
                      <tr key={a.id}>
                        <td>{a.login}</td>
                        <td>{a.name}</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => handleEditAdmin(a)} className="action-button edit-button">
                              <FaEdit /> <span>Редактировать</span>
                            </button>
                            <button onClick={() => handleDeleteAdmin(a.id)} className="action-button delete-button">
                              <FaTrash /> <span>Удалить</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============= УЧИТЕЛЯ ============= */}
        {activeTab === 'teachers' && (
          <div className="content-grid">
            <div className="form-container">
              <h3 className="form-title"><FaUserPlus /> Новый учитель</h3>
              <form onSubmit={handleAddTeacher}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Фамилия *</label>
                    <input type="text" value={newTeacher.lastName} onChange={e => setNewTeacher({...newTeacher, lastName: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Имя *</label>
                    <input type="text" value={newTeacher.firstName} onChange={e => setNewTeacher({...newTeacher, firstName: e.target.value})} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Отчество</label>
                  <input type="text" value={newTeacher.middleName} onChange={e => setNewTeacher({...newTeacher, middleName: e.target.value})} className="form-input" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Логин *</label>
                    <input type="text" value={newTeacher.login} onChange={e => setNewTeacher({...newTeacher, login: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Пароль *</label>
                    <input type="password" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} className="form-input" />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Предметы</label>
                  <div 
                    className="subject-selector-button"
                    onClick={() => openSubjectModal(null)}
                  >
                    <div className="subject-selector-content">
                      <FaBook className="subject-selector-icon" />
                      <span className="subject-selector-text">
                        {newTeacher.subjectIds.length === 0 
                          ? 'Выберите предметы...' 
                          : `Выбрано предметов: ${newTeacher.subjectIds.length}`}
                      </span>
                    </div>
                    <FaChevronDown className="subject-selector-arrow" />
                  </div>
                  
                  {newTeacher.subjectIds.length > 0 && (
                    <div className="subject-preview">
                      {newTeacher.subjectIds.map(id => {
                        const subject = subjects.find(s => s.id === id);
                        return subject ? (
                          <span key={id} className="subject-preview-tag">
                            {subject.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                
                <button type="submit" className="submit-button">Добавить учителя</button>
              </form>
            </div>
            
            <div className="table-container">
              <h3 className="table-title">Список учителей ({teachers.length})</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ФИО</th>
                      <th>Предметы</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 500 }}>{t.name}</td>
                        <td>
                          <div className="subjects-tags">
                            {t.subjects && t.subjects.length > 0 ? (
                              t.subjects.map(s => (
                                <span key={s.id} className="subject-tag">
                                  {s.name}
                                </span>
                              ))
                            ) : (
                              <span className="no-subjects">Нет предметов</span>
                            )}
                            <button 
                              className="edit-subjects-btn"
                              onClick={() => openSubjectModal(t)}
                              title="Редактировать предметы"
                            >
                              <FaEdit /> Предметы
                            </button>
                          </div>
                        </td>
                        <table>
                          <div className="action-buttons">
                            <button onClick={() => handleEditTeacher(t)} className="action-button edit-button">
                              <FaEdit /> <span>Редактировать</span>
                            </button>
                            <button onClick={() => handleDeleteTeacher(t.id)} className="action-button delete-button">
                              <FaTrash /> <span>Удалить</span>
                            </button>
                          </div>
                        </table>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============= КЛАССЫ ============= */}
        {activeTab === 'classes' && (
          <div className="content-grid">
            <div className="form-container">
              <h3 className="form-title"><FaUserPlus /> Новый класс</h3>
              <form onSubmit={handleAddClass}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Номер *</label>
                    <input type="number" min="1" max="11" value={newClass.number} onChange={e => setNewClass({...newClass, number: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Буква *</label>
                    <input type="text" maxLength="1" value={newClass.letter} onChange={e => setNewClass({...newClass, letter: e.target.value.toUpperCase()})} className="form-input" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Логин *</label>
                    <input type="text" value={newClass.login} onChange={e => setNewClass({...newClass, login: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Пароль *</label>
                    <input type="password" value={newClass.password} onChange={e => setNewClass({...newClass, password: e.target.value})} className="form-input" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Смена</label>
                    <select value={newClass.shift} onChange={e => setNewClass({...newClass, shift: parseInt(e.target.value)})} className="form-select">
                      <option value="1">1 смена</option>
                      <option value="2">2 смена</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Классный руководитель</label>
                    <select value={newClass.teacherId} onChange={e => setNewClass({...newClass, teacherId: e.target.value})} className="form-select">
                      <option value="">Не назначен</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="submit-button">Добавить класс</button>
              </form>
            </div>
            <div className="table-container">
              <h3 className="table-title">Список классов ({classes.length})</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Класс</th>
                      <th>Смена</th>
                      <th>Руководитель</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>
                          <div className="shift-control">
                            <span className={`shift-badge shift-${c.shift}`}>{c.shift} смена</span>
                            <button onClick={() => handleChangeShift(c.id, c.shift)} className="action-button shift-button">
                              <FaSync /> Сменить
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="teacher-control">
                            <span>{c.teacher_name || 'Не назначен'}</span>
                            <button 
                              onClick={() => openTeacherSelector(c)} 
                              className="action-button assign-button"
                              title={c.teacher_name ? 'Сменить классного руководителя' : 'Назначить классного руководителя'}
                            >
                              <FaUserCheck /> {c.teacher_name ? 'Сменить' : 'Назначить'}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => handleDeleteClass(c.id)} className="action-button delete-button">
                              <FaTrash /> <span>Удалить</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="shift-stats">
                <div className="shift-stat">
                  <div className="shift-stat-number shift-stat-1">{stats.shift1}</div>
                  <div>Классов в 1 смену</div>
                </div>
                <div className="shift-stat">
                  <div className="shift-stat-number shift-stat-2">{stats.shift2}</div>
                  <div>Классов во 2 смену</div>
                </div>
              </div>
              {stats.classesWithoutTeacher > 0 && (
                <div className="warning-box">
                  <strong>Внимание!</strong> {stats.classesWithoutTeacher} класс(ов) без классного руководителя
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Модальные окна */}
      <SubjectSelectorModal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        subjects={subjects}
        selectedIds={tempSubjectIds}
        onSave={handleSaveSubjects}
        teacherName={currentTeacher?.name || 'нового учителя'}
      />
      
      <TeacherSelectorModal
        isOpen={teacherSelectorOpen}
        onClose={() => setTeacherSelectorOpen(false)}
        teachers={teachers}
        selectedTeacherId={currentClass?.teacher_id || null}
        onSave={handleAssignTeacher}
        className={currentClass?.name || ''}
      />
      
      <AdminEditModal
        isOpen={adminEditOpen}
        onClose={() => setAdminEditOpen(false)}
        admin={currentAdmin}
        onSave={handleSaveAdmin}
      />
      
      <TeacherEditModal
        isOpen={teacherEditOpen}
        onClose={() => setTeacherEditOpen(false)}
        teacher={currentTeacher}
        onSave={handleSaveTeacher}
      />
      
      <Footer />
    </div>
  );
};

export default SuperAdminDashboard;