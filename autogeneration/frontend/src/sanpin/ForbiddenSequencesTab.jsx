// frontend/src/components/sanpin/ForbiddenSequencesTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBan, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import '../styles/SanPinTab.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SEQUENCE_TYPES = {
    'consecutive_same_type': {
        label: 'Не более X предметов одного типа подряд',
        description: 'Запрещает ставить подряд больше N предметов одного типа (гуманитарные, точные, нейтральные)',
        param1_label: 'Тип предмета',
        param1_options: [
            { value: 'exact', label: 'Точные науки (математика, физика, химия, информатика)' },
            { value: 'humanities', label: 'Гуманитарные науки (русский язык, литература, история, обществознание, английский)' },
            { value: 'neutral', label: 'Нейтральные (физкультура, ИЗО, музыка, труд, ОБЖ)' }
        ],
        param2_label: 'Максимум подряд (уроков)'
    },
    'three_high_difficulty': {
        label: 'Три сложных предмета подряд',
        description: 'Запрещает ставить 3 предмета с высоким рангом сложности подряд',
        param1_label: 'Порог сложности (ранг от 1 до 13)',
        param1_options: null,
        param2_label: 'Количество подряд (обычно 3)'
    },
    'max_consecutive': {
        label: 'Максимум уроков подряд',
        description: 'Ограничивает общее количество уроков подряд в расписании (перемена не считается)',
        param1_label: null,
        param1_options: null,
        param2_label: 'Максимум уроков подряд'
    }
};

const SEVERITY = {
    'error': { label: '❌ Ошибка (нельзя сгенерировать)', color: '#dc2626', bg: '#fee2e2' },
    'warning': { label: '⚠️ Предупреждение (можно, но нежелательно)', color: '#f59e0b', bg: '#fef3c7' }
};

const ForbiddenSequencesTab = ({ token }) => {
    const [sequences, setSequences] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        sequence_type: 'consecutive_same_type',
        param1: '',
        param2: '',
        severity: 'error'
    });
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState('');

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/superadmin/forbidden-sequences`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSequences(res.data || []);
        } catch (err) { 
            console.error(err);
            showNotification('Ошибка загрузки правил');
        } finally { 
            setLoading(false); 
        }
    };

    const handleSave = async () => {
        if (!formData.sequence_type) {
            showNotification('Выберите тип правила');
            return;
        }
        
        if (formData.sequence_type === 'consecutive_same_type' && !formData.param1) {
            showNotification('Выберите тип предмета');
            return;
        }
        
        if (formData.sequence_type === 'three_high_difficulty' && !formData.param1) {
            showNotification('Укажите порог сложности');
            return;
        }
        
        if (!formData.param2 || formData.param2 < 1) {
            showNotification('Укажите количество уроков');
            return;
        }
        
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = { 
                ...formData,
                param2: parseInt(formData.param2)
            };
            if (payload.param1 === '') payload.param1 = null;
            
            if (editing) {
                await axios.put(`${API_URL}/superadmin/forbidden-sequences/${editing.id}`, payload, config);
                showNotification('Правило обновлено');
            } else {
                await axios.post(`${API_URL}/superadmin/forbidden-sequences`, payload, config);
                showNotification('Правило добавлено');
            }
            
            await loadData();
            setModalOpen(false);
            setEditing(null);
            setFormData({ sequence_type: 'consecutive_same_type', param1: '', param2: '', severity: 'error' });
        } catch (err) { 
            console.error(err);
            showNotification('Ошибка сохранения');
        } finally { 
            setLoading(false); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить правило? Это действие нельзя отменить.')) return;
        
        setLoading(true);
        try {
            await axios.delete(`${API_URL}/superadmin/forbidden-sequences/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Правило удалено');
            await loadData();
        } catch (err) { 
            console.error(err);
            showNotification('Ошибка удаления');
        } finally { 
            setLoading(false); 
        }
    };

    const getReadableRule = (seq) => {
        const type = SEQUENCE_TYPES[seq.sequence_type];
        if (!type) return seq.sequence_type;
        
        switch (seq.sequence_type) {
            case 'consecutive_same_type':
                const typeLabel = seq.param1 === 'exact' ? 'Точные науки' : 
                                 seq.param1 === 'humanities' ? 'Гуманитарные' : 'Нейтральные';
                return `${type.label.replace('X', seq.param2)} — ${typeLabel}`;
            case 'three_high_difficulty':
                return `${type.label} — предметы с рангом от ${seq.param1} и выше`;
            case 'max_consecutive':
                return `${type.label} — не более ${seq.param2} уроков`;
            default:
                return `${seq.sequence_type}: ${seq.param1 || '-'} / ${seq.param2}`;
        }
    };

    const openModal = (seq = null) => {
        if (seq) {
            setEditing(seq);
            setFormData({
                sequence_type: seq.sequence_type,
                param1: seq.param1 || '',
                param2: seq.param2 || '',
                severity: seq.severity || 'error'
            });
        } else {
            setEditing(null);
            setFormData({ sequence_type: 'consecutive_same_type', param1: '', param2: '', severity: 'error' });
        }
        setModalOpen(true);
    };

    const renderParamFields = () => {
        switch (formData.sequence_type) {
            case 'consecutive_same_type':
                return (
                    <>
                        <div className="form-group">
                            <label>{SEQUENCE_TYPES.consecutive_same_type.param1_label}</label>
                            <select value={formData.param1} onChange={e => setFormData({...formData, param1: e.target.value})}>
                                <option value="">Выберите тип</option>
                                {SEQUENCE_TYPES.consecutive_same_type.param1_options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{SEQUENCE_TYPES.consecutive_same_type.param2_label}</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={formData.param2} 
                                onChange={e => setFormData({...formData, param2: e.target.value})} 
                                placeholder="например: 2" 
                            />
                        </div>
                    </>
                );
            case 'three_high_difficulty':
                return (
                    <>
                        <div className="form-group">
                            <label>{SEQUENCE_TYPES.three_high_difficulty.param1_label}</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="13" 
                                value={formData.param1} 
                                onChange={e => setFormData({...formData, param1: e.target.value})} 
                                placeholder="например: 7" 
                            />
                        </div>
                        <div className="form-group">
                            <label>{SEQUENCE_TYPES.three_high_difficulty.param2_label}</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={formData.param2} 
                                onChange={e => setFormData({...formData, param2: e.target.value})} 
                                placeholder="например: 3" 
                            />
                        </div>
                    </>
                );
            case 'max_consecutive':
                return (
                    <div className="form-group">
                        <label>{SEQUENCE_TYPES.max_consecutive.param2_label}</label>
                        <input 
                            type="number" 
                            min="1" 
                            max="15" 
                            value={formData.param2} 
                            onChange={e => setFormData({...formData, param2: e.target.value})} 
                            placeholder="например: 7" 
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="forbidden-sequences-tab">
            {notification && <div className="notification notification-info">{notification}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaBan style={{ color: '#dc2626' }} /> Запрещённые последовательности
                        <span style={{ 
                            fontSize: '0.7rem', 
                            background: '#e2e8f0', 
                            color: '#475569', 
                            padding: '2px 10px', 
                            borderRadius: '20px'
                        }}>
                            {sequences.length}
                        </span>
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
                        Правила, которые нельзя нарушать при составлении расписания
                    </p>
                </div>
                <button className="add-room-btn" onClick={() => openModal()} disabled={loading}>
                    <FaPlus /> Добавить правило
                </button>
            </div>

            {loading && sequences.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <FaSpinner style={{ fontSize: '2rem', color: '#21435A', animation: 'spin 1s linear infinite' }} />
                    <p>Загрузка...</p>
                </div>
            )}

            {!loading && (
                <div className="table-container">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50%' }}>Правило</th>
                                    <th style={{ width: '25%' }}>Серьёзность</th>
                                    <th style={{ width: '25%' }}>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sequences.length === 0 ? (
                                    <tr className="empty-row">
                                        <td colSpan="3">
                                            <FaBan style={{ fontSize: '48px', opacity: 0.5 }} />
                                            <p>Нет правил. Нажмите "Добавить правило"</p>
                                            <button className="add-room-btn btn-small" onClick={() => openModal()}>
                                                <FaPlus /> Добавить правило
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    sequences.map(seq => {
                                        const severity = SEVERITY[seq.severity] || SEVERITY.error;
                                        return (
                                            <tr key={seq.id}>
                                                <td>
                                                    <strong>{getReadableRule(seq)}</strong>
                                                    {SEQUENCE_TYPES[seq.sequence_type]?.description && (
                                                        <div className="rule-description">
                                                            {SEQUENCE_TYPES[seq.sequence_type].description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`severity-badge-${seq.severity}`}>
                                                        {severity.label}
                                                    </span>
                                                </td>
                                                <td className="action-cell">
                                                    <button className="action-button edit-button" onClick={() => openModal(seq)}>
                                                        <FaEdit /> Изменить
                                                    </button>
                                                    <button className="action-button delete-button" onClick={() => handleDelete(seq.id)}>
                                                        <FaTrash /> Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Информационная карточка */}
            <div className="sanpin-info-card">
                <h4><FaInfoCircle /> Что означают правила?</h4>
                <ul>
                    <li><strong>Не более X предметов одного типа подряд</strong> — запрещает ставить, например, 3 точных науки (математика, физика, химия) подряд</li>
                    <li><strong>Три сложных предмета подряд</strong> — запрещает ставить 3 предмета с высоким рангом сложности подряд</li>
                    <li><strong>Максимум уроков подряд</strong> — ограничивает общее количество уроков без большой перемены</li>
                    <li><strong>Серьёзность "Ошибка"</strong> — расписание с таким нарушением НЕ БУДЕТ создано</li>
                    <li><strong>Серьёзность "Предупреждение"</strong> — расписание будет создано, но с пометкой</li>
                </ul>
            </div>

            {/* Модальное окно */}
            {modalOpen && (
                <div className="modal-overlay-fixed" onClick={() => !loading && setModalOpen(false)}>
                    <div className="modal-content-fixed" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-fixed">
                            <h3>{editing ? <FaEdit /> : <FaPlus />} {editing ? 'Редактировать правило' : 'Новое правило'}</h3>
                            <button className="modal-close-fixed" onClick={() => !loading && setModalOpen(false)} disabled={loading}>
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="modal-body-fixed">
                            <div className="form-group">
                                <label>Тип правила *</label>
                                <select 
                                    value={formData.sequence_type} 
                                    onChange={e => {
                                        setFormData({ 
                                            sequence_type: e.target.value, 
                                            param1: '', 
                                            param2: '', 
                                            severity: 'error' 
                                        });
                                    }}
                                    disabled={loading}
                                >
                                    <option value="consecutive_same_type">⚠️ Не более X предметов одного типа подряд</option>
                                    <option value="three_high_difficulty">🔴 Три сложных предмета подряд</option>
                                    <option value="max_consecutive">📚 Максимум уроков подряд</option>
                                </select>
                                {SEQUENCE_TYPES[formData.sequence_type]?.description && (
                                    <small style={{ color: '#64748b', display: 'block', marginTop: '5px' }}>
                                        {SEQUENCE_TYPES[formData.sequence_type].description}
                                    </small>
                                )}
                            </div>

                            {renderParamFields()}

                            <div className="form-group">
                                <label>Серьёзность нарушения</label>
                                <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} disabled={loading}>
                                    <option value="error">❌ Ошибка (нельзя сгенерировать)</option>
                                    <option value="warning">⚠️ Предупреждение (можно, но нежелательно)</option>
                                </select>
                                <small>
                                    {formData.severity === 'error' 
                                        ? 'Расписание НЕ БУДЕТ создано, если нарушает это правило'
                                        : 'Расписание БУДЕТ создано, но с предупреждением'}
                                </small>
                            </div>
                        </div>
                        
                        <div className="modal-footer-fixed">
                            <button className="btn-cancel" onClick={() => !loading && setModalOpen(false)} disabled={loading}>
                                Отмена
                            </button>
                            <button className="btn-save" onClick={handleSave} disabled={loading}>
                                <FaSave /> {loading ? 'Сохранение...' : (editing ? 'Сохранить' : 'Добавить')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ForbiddenSequencesTab;