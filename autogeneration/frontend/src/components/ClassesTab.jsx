// components/tabs/ClassesTab.jsx
import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaSchool, FaEdit, FaTrash, FaSync, FaGraduationCap, FaSave, FaTimes, FaUserEdit, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ОБЩИЙ ЛОГИН ДЛЯ ВСЕХ КЛАССОВ
const COMMON_LOGIN = 'soch20';

const ClassesTab = ({ classes = [], teachers = [], token, onDataChange }) => {
    const [newClass, setNewClass] = useState({ number: '', letter: '', shift: 1, teacherId: '', password: '' });
    const [editClassModalOpen, setEditClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [notification, setNotification] = useState('');
    const [teachersList, setTeachersList] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    // Загружаем учителей при монтировании и при изменении пропса teachers
    useEffect(() => {
        const loadTeachers = async () => {
            if (teachers && teachers.length > 0) {
                console.log('Учителя из пропсов:', teachers);
                setTeachersList(teachers);
                return;
            }
            
            if (!token) return;
            
            setLoadingTeachers(true);
            try {
                console.log('Загрузка учителей через API...');
                const response = await axios.get(`${API_URL}/superadmin/teachers`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Загружено учителей:', response.data?.length || 0);
                setTeachersList(response.data || []);
            } catch (err) {
                console.error('Error loading teachers:', err);
                setTeachersList([]);
            } finally {
                setLoadingTeachers(false);
            }
        };
        
        loadTeachers();
    }, [teachers, token]);

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const clearClassForm = () => setNewClass({ number: '', letter: '', shift: 1, teacherId: '', password: '' });

    const handleAddClass = async (e) => {
        e.preventDefault();
        
        console.log('=== НАЧАЛО ДОБАВЛЕНИЯ КЛАССА ===');
        console.log('newClass:', newClass);
        
        if (!newClass.number || !newClass.letter || !newClass.password) {
            console.log('Ошибка: не все поля заполнены');
            showNotification('Заполните номер, букву и пароль');
            return;
        }
        
        try {
            const classData = {
                number: parseInt(newClass.number),
                letter: newClass.letter.toUpperCase(),
                shift: parseInt(newClass.shift),
                teacherId: newClass.teacherId || null,
                login: COMMON_LOGIN,
                password: newClass.password
            };
            
            console.log('📤 Отправляем данные на сервер:', JSON.stringify(classData, null, 2));
            console.log('URL:', `${API_URL}/superadmin/classes`);
            console.log('Token:', token ? 'есть' : 'нет');
            
            const response = await axios.post(`${API_URL}/superadmin/classes`, classData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ Успешный ответ:', response.data);
            showNotification('Класс добавлен');
            clearClassForm();
            onDataChange();
            
        } catch (err) {
            console.error('❌ ОШИБКА ПРИ ДОБАВЛЕНИИ КЛАССА');
            console.error('Тип ошибки:', err.name);
            console.error('Сообщение:', err.message);
            console.error('Статус:', err.response?.status);
            console.error('Данные ответа сервера:', err.response?.data);
            console.error('Полный объект ошибки:', err);
            
            let errorMessage = 'Ошибка при добавлении класса';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            showNotification(`Ошибка: ${errorMessage}`);
        }
        
        console.log('=== КОНЕЦ ДОБАВЛЕНИЯ КЛАССА ===');
    };

    const handleUpdateClass = async (classData) => {
        try {
            const updateData = {
                shift: classData.shift,
                teacherId: classData.teacherId,
            };
            
            console.log('📤 Обновляем класс:', updateData);
            
            await axios.put(`${API_URL}/superadmin/classes/${classData.id}`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Класс обновлен');
            onDataChange();
            setEditClassModalOpen(false);
            setEditingClass(null);
        } catch (err) {
            console.error('Update class error:', err);
            console.error('Ответ сервера:', err.response?.data);
            showNotification(err.response?.data?.message || 'Ошибка обновления');
            throw err;
        }
    };

    const handleChangeShift = async (classId, currentShift) => {
        const newShift = currentShift === 1 ? 2 : 1;
        try {
            await axios.put(`${API_URL}/superadmin/classes/${classId}`, { shift: newShift }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Смена изменена');
            onDataChange();
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
            onDataChange();
        } catch (err) {
            console.error('Delete class error:', err);
            showNotification('Ошибка удаления');
        }
    };

    const stats = {
        shift1: Array.isArray(classes) ? classes.filter(c => c.shift === 1).length : 0,
        shift2: Array.isArray(classes) ? classes.filter(c => c.shift === 2).length : 0,
        classesWithoutTeacher: Array.isArray(classes) ? classes.filter(c => !c.teacher_name).length : 0
    };

    const EditClassModal = ({ isOpen, onClose, onSave, classData }) => {
        const [formData, setFormData] = useState({ shift: 1, teacherId: '' });
        const [saving, setSaving] = useState(false);
        const [localTeachers, setLocalTeachers] = useState([]);
        const [loadingLocalTeachers, setLoadingLocalTeachers] = useState(false);

        useEffect(() => {
            const fetchTeachers = async () => {
                if (!isOpen) return;
                
                if (teachersList.length > 0) {
                    setLocalTeachers(teachersList);
                    return;
                }
                
                if (!token) return;
                
                setLoadingLocalTeachers(true);
                try {
                    const response = await axios.get(`${API_URL}/superadmin/teachers`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setLocalTeachers(response.data || []);
                } catch (err) {
                    console.error('Error fetching teachers for modal:', err);
                    setLocalTeachers([]);
                } finally {
                    setLoadingLocalTeachers(false);
                }
            };
            
            fetchTeachers();
        }, [isOpen, token, teachersList]);

        useEffect(() => {
            if (classData && isOpen) {
                setFormData({ 
                    shift: classData.shift || 1, 
                    teacherId: classData.teacher_id || classData.teacherId || '' 
                });
            }
        }, [classData, isOpen]);

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (saving) return;
            setSaving(true);
            try {
                await onSave({ ...formData, id: classData?.id });
                onClose();
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="modal-overlay-fixed" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="modal-content-fixed" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                    <div className="modal-header-fixed">
                        <h3><FaUserEdit /> Редактировать класс {classData?.name}</h3>
                        <button className="modal-close-fixed" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body-fixed">
                            <div className="form-group">
                                <label>Смена</label>
                                <select value={formData.shift} onChange={e => setFormData({...formData, shift: parseInt(e.target.value)})} disabled={saving}>
                                    <option value="1">1 смена</option>
                                    <option value="2">2 смена</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Классный руководитель</label>
                                <select value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} disabled={saving}>
                                    <option value="">Не назначен</option>
                                    {localTeachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name || `${t.last_name} ${t.first_name}`}</option>
                                    ))}
                                </select>
                                {loadingLocalTeachers && <small style={{ color: '#94a3b8' }}>Загрузка учителей...</small>}
                                {!loadingLocalTeachers && localTeachers.length === 0 && (
                                    <small style={{ color: '#ef4444' }}>Нет доступных учителей</small>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer-fixed">
                            <button type="button" className="btn-cancel-modal" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                            <button type="submit" className="btn-save-modal" disabled={saving}><FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const classesArray = Array.isArray(classes) ? classes : [];

    if (loadingTeachers && teachersList.length === 0) {
        return (
            <div className="loading-container" style={{ padding: '2rem', textAlign: 'center' }}>
                <FaSpinner className="spinner" style={{ fontSize: '2rem', color: 'var(--primary)' }} />
                <p>Загрузка данных...</p>
            </div>
        );
    }

    return (
        <>
            {notification && <div className="notification">{notification}</div>}
            <div className="content-grid">
                <div className="form-container">
                    <h3 className="form-title"><FaUserPlus /> Новый класс</h3>
                    <form onSubmit={handleAddClass}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Номер *</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="11" 
                                    value={newClass.number} 
                                    onChange={e => setNewClass({...newClass, number: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Буква *</label>
                                <input 
                                    type="text" 
                                    maxLength="1" 
                                    value={newClass.letter} 
                                    onChange={e => setNewClass({...newClass, letter: e.target.value.toUpperCase()})} 
                                    required 
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Логин</label>
                                <input 
                                    type="text" 
                                    value={COMMON_LOGIN} 
                                    disabled 
                                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Пароль *</label>
                                <input 
                                    type="password" 
                                    value={newClass.password} 
                                    onChange={e => setNewClass({...newClass, password: e.target.value})} 
                                    required 
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Смена</label>
                                <select value={newClass.shift} onChange={e => setNewClass({...newClass, shift: parseInt(e.target.value)})}>
                                    <option value="1">1 смена</option>
                                    <option value="2">2 смена</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Руководитель</label>
                                <select value={newClass.teacherId} onChange={e => setNewClass({...newClass, teacherId: e.target.value})}>
                                    <option value="">Не назначен</option>
                                    {teachersList.map(t => (
                                        <option key={t.id} value={t.id}>{t.name || `${t.last_name} ${t.first_name}`}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="submit-button">Добавить класс</button>
                    </form>
                </div>
                <div className="table-container">
                    <h3 className="table-title"><FaSchool /> Список классов ({classesArray.length})</h3>
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
                                {classesArray.map(c => (
                                    <tr key={c.id}>
                                        <td><FaGraduationCap style={{ marginRight: '8px', color: 'var(--primary)' }} /> {c.name}</td>
                                        <td><span className={`shift-badge shift-${c.shift}`}>{c.shift} смена</span></td>
                                        <td>{c.teacher_name || 'Не назначен'}</td>
                                        <td className="action-cell">
                                            <button onClick={() => { setEditingClass(c); setEditClassModalOpen(true); }} className="action-button edit-button"><FaEdit /></button>
                                            <button onClick={() => handleChangeShift(c.id, c.shift)} className="action-button shift-button"><FaSync /></button>
                                            <button onClick={() => handleDeleteClass(c.id)} className="action-button delete-button" style={{ background: '#ef4444' }}><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))}
                                {classesArray.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="empty-row"><FaSchool /><p>Нет классов</p><button onClick={() => document.querySelector('.form-container input')?.focus()}>Добавить класс</button></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="shift-stats">
                        <div className="shift-stat"><div className="shift-stat-number shift-stat-1">{stats.shift1}</div><div>1 смена</div></div>
                        <div className="shift-stat"><div className="shift-stat-number shift-stat-2">{stats.shift2}</div><div>2 смена</div></div>
                    </div>
                    {stats.classesWithoutTeacher > 0 && (
                        <div className="warning-box">
                            <strong>Внимание!</strong> {stats.classesWithoutTeacher} класс(ов) без руководителя
                        </div>
                    )}
                </div>
            </div>
            <EditClassModal 
                isOpen={editClassModalOpen} 
                onClose={() => setEditClassModalOpen(false)} 
                onSave={handleUpdateClass} 
                classData={editingClass}
            />
        </>
    );
};

export default ClassesTab;