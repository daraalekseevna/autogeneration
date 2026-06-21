// frontend/src/components/sanpin/PairingRulesTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaLink, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaChalkboardTeacher, FaInfoCircle } from 'react-icons/fa';
import '../styles/SuperAdmin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DAYS_RU = {
    'monday': 'Понедельник',
    'tuesday': 'Вторник',
    'wednesday': 'Среда',
    'thursday': 'Четверг',
    'friday': 'Пятница',
    'saturday': 'Суббота',
    'sunday': 'Воскресенье'
};

const DAYS_OPTIONS = [
    { value: '', label: 'Любой день' },
    { value: 'monday', label: 'Понедельник' },
    { value: 'tuesday', label: 'Вторник' },
    { value: 'wednesday', label: 'Среда' },
    { value: 'thursday', label: 'Четверг' },
    { value: 'friday', label: 'Пятница' }
];

const LESSON_SLOTS = [
    { value: '', label: 'Не важно' },
    { value: 1, label: '1 урок' },
    { value: 2, label: '2 урок' },
    { value: 3, label: '3 урок' },
    { value: 4, label: '4 урок' },
    { value: 5, label: '5 урок' },
    { value: 6, label: '6 урок' },
    { value: 7, label: '7 урок' },
    { value: 8, label: '8 урок' }
];

const PairingRulesTab = ({ token }) => {
    const [rules, setRules] = useState([]);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [formData, setFormData] = useState({ 
        class_id: '', teacher_id: '', subject_id_1: '', subject_id_2: '', 
        mandatory: false, day_of_week: '', lesson_slot1: '', lesson_slot2: '' 
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [rulesRes, classesRes, teachersRes, lessonsRes] = await Promise.all([
                axios.get(`${API_URL}/superadmin/lesson-pairing-rules`, config),
                axios.get(`${API_URL}/superadmin/classes`, config),
                axios.get(`${API_URL}/superadmin/teachers`, config),
                axios.get(`${API_URL}/superadmin/lessons`, config)
            ]);
            setRules(rulesRes.data);
            setClasses(classesRes.data);
            setTeachers(teachersRes.data);
            setLessons(lessonsRes.data);
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleSave = async () => {
        if (!formData.class_id || !formData.teacher_id || !formData.subject_id_1 || !formData.subject_id_2) {
            return;
        }
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = {
                ...formData,
                lesson_slot1: formData.lesson_slot1 || null,
                lesson_slot2: formData.lesson_slot2 || null,
                day_of_week: formData.day_of_week || null
            };
            if (editingRule) {
                await axios.put(`${API_URL}/superadmin/lesson-pairing-rules/${editingRule.id}`, payload, config);
            } else {
                await axios.post(`${API_URL}/superadmin/lesson-pairing-rules`, payload, config);
            }
            await loadData();
            setModalOpen(false);
            setEditingRule(null);
            setFormData({ 
                class_id: '', teacher_id: '', subject_id_1: '', subject_id_2: '', 
                mandatory: false, day_of_week: '', lesson_slot1: '', lesson_slot2: '' 
            });
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить правило? Это действие нельзя отменить.')) {
            setLoading(true);
            try {
                await axios.delete(`${API_URL}/superadmin/lesson-pairing-rules/${id}`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                });
                await loadData();
            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoading(false); 
            }
        }
    };

    const openModal = (rule = null) => {
        if (rule) {
            setEditingRule(rule);
            setFormData({
                class_id: rule.class_id,
                teacher_id: rule.teacher_id || '',
                subject_id_1: rule.subject_id_1,
                subject_id_2: rule.subject_id_2,
                mandatory: rule.mandatory,
                day_of_week: rule.day_of_week || '',
                lesson_slot1: rule.lesson_slot1 || '',
                lesson_slot2: rule.lesson_slot2 || ''
            });
        } else {
            setEditingRule(null);
            setFormData({ 
                class_id: '', teacher_id: '', subject_id_1: '', subject_id_2: '', 
                mandatory: false, day_of_week: '', lesson_slot1: '', lesson_slot2: '' 
            });
        }
        setModalOpen(true);
    };

    const formatSlots = (slot1, slot2) => {
        if (!slot1 || !slot2) return '—';
        return `${slot1}-${slot2}`;
    };

    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId);
        return teacher?.name || '—';
    };

    return (
        <div className="pairing-rules-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0 }}><FaLink style={{ marginRight: '8px' }} /> Правила спаривания уроков</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
                        Указывается, какие два урока должны стоять подряд (в один день)
                    </p>
                </div>
                <button className="add-room-btn" onClick={() => openModal()} disabled={loading}>
                    <FaPlus /> Добавить правило
                </button>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>}

            {!loading && (
                <div className="pairing-rules-table-container">
                    <table className="pairing-rules-table">
                        <thead>
                            <tr>
                                <th>Класс</th><th>Учитель</th><th>Предмет 1</th><th>Предмет 2</th>
                                <th>Обязательно</th><th>День</th><th>Слоты</th><th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.length === 0 ? (
                                <tr className="empty-row">
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                        Нет правил. Нажмите "Добавить правило"
                                    </td>
                                </tr>
                            ) : (
                                rules.map(rule => (
                                    <tr key={rule.id}>
                                        <td><strong>{rule.class_name}</strong></td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FaChalkboardTeacher style={{ color: '#21435A' }} />
                                                {rule.teacher_name || getTeacherName(rule.teacher_id)}
                                            </span>
                                        </td>
                                        <td>{rule.subject_name_1}</td>
                                        <td>{rule.subject_name_2}</td>
                                        <td>
                                            {rule.mandatory ? 
                                                <span className="pairing-mandatory-badge yes">✓ Да, обязательно</span> : 
                                                <span className="pairing-mandatory-badge no">Нет</span>
                                            }
                                        </td>
                                        <td>
                                            {rule.day_of_week ? 
                                                <span className="pairing-day-badge">{DAYS_RU[rule.day_of_week]}</span> : 
                                                'Любой'
                                            }
                                        </td>
                                        <td>
                                            <span className="pairing-slots">{formatSlots(rule.lesson_slot1, rule.lesson_slot2)}</span>
                                        </td>
                                        <td className="action-cell">
                                            <button className="action-button edit-button" onClick={() => openModal(rule)}><FaEdit /></button>
                                            <button className="action-button delete-button" onClick={() => handleDelete(rule.id)}><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FaInfoCircle style={{ color: '#0284c7' }} />
                    <strong style={{ color: '#0284c7' }}>Что означают слоты?</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.75rem', color: '#475569' }}>
                    <li><strong>«—»</strong> — уроки могут стоять на любых двух подряд позициях (например, 2 и 3, или 4 и 5)</li>
                    <li><strong>«1-2»</strong> — уроки должны стоять строго на 1 и 2 уроках</li>
                    <li><strong>«3-4»</strong> — уроки должны стоять строго на 3 и 4 уроках</li>
                    <li><strong>«5-6»</strong> — уроки должны стоять строго на 5 и 6 уроках</li>
                </ul>
            </div>

            {modalOpen && (
                <div className="modal-overlay-fixed" onClick={() => setModalOpen(false)}>
                    <div className="modal-content-fixed" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header-fixed" style={{ background: '#21435A' }}>
                            <h3 style={{ color: 'white' }}>{editingRule ? 'Редактировать правило' : 'Новое правило спаривания'}</h3>
                            <button className="modal-close-fixed" onClick={() => setModalOpen(false)} style={{ color: 'white' }}><FaTimes /></button>
                        </div>
                        <div className="modal-body-fixed">
                            <div className="form-group"><label>Класс *</label><select value={formData.class_id} onChange={e => setFormData({...formData, class_id: parseInt(e.target.value)})}><option value="">Выберите класс</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div className="form-group"><label>Учитель *</label><select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: parseInt(e.target.value)})}><option value="">Выберите учителя</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><small>Учитель, который ведёт оба предмета</small></div>
                            <div className="form-row"><div className="form-group"><label>Предмет 1 *</label><select value={formData.subject_id_1} onChange={e => setFormData({...formData, subject_id_1: parseInt(e.target.value)})}><option value="">Выберите предмет</option>{lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                            <div className="form-group"><label>Предмет 2 *</label><select value={formData.subject_id_2} onChange={e => setFormData({...formData, subject_id_2: parseInt(e.target.value)})}><option value="">Выберите предмет</option>{lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div></div>
                            <div className="form-group"><label><input type="checkbox" checked={formData.mandatory} onChange={e => setFormData({...formData, mandatory: e.target.checked})} /> Обязательное спаривание (всегда ставить вместе)</label></div>
                            <div className="form-group"><label>День недели (опционально)</label><select value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: e.target.value})}>{DAYS_OPTIONS.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}</select><small>Если выбран конкретный день, правило будет применяться только в этот день</small></div>
                            <div className="form-row"><div className="form-group"><label>Номер первого урока (слот 1)</label><select value={formData.lesson_slot1} onChange={e => setFormData({...formData, lesson_slot1: e.target.value ? parseInt(e.target.value) : ''})}>{LESSON_SLOTS.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)}</select></div>
                            <div className="form-group"><label>Номер второго урока (слот 2)</label><select value={formData.lesson_slot2} onChange={e => setFormData({...formData, lesson_slot2: e.target.value ? parseInt(e.target.value) : ''})}>{LESSON_SLOTS.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)}</select></div></div>
                            <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.7rem', color: '#475569', marginTop: '8px' }}>
                                <strong>📌 Пояснение:</strong>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                    <li>Если указать оба слота — уроки будут строго на этих позициях (например, 1 и 2)</li>
                                    <li>Если оставить пустыми — уроки могут быть на любых двух подряд позициях</li>
                                </ul>
                            </div>
                        </div>
                        <div className="modal-footer-fixed">
                            <button className="btn-cancel-modal" onClick={() => setModalOpen(false)}>Отмена</button>
                            <button className="btn-save-modal" onClick={handleSave} disabled={loading}><FaSave /> {loading ? 'Сохранение...' : 'Сохранить'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PairingRulesTab;