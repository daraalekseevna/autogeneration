// modals/QuickFixModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaUserGraduate, FaDoorOpen, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QuickFixModal = ({ isOpen, onClose, conflict, onApplyFix, teachers, rooms }) => {
  const [selectedFix, setSelectedFix] = useState('');
  const [alternativeTeacher, setAlternativeTeacher] = useState('');
  const [alternativeRoom, setAlternativeRoom] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedFix('');
      setAlternativeTeacher('');
      setAlternativeRoom('');
    }
  }, [isOpen]);

  if (!isOpen || !conflict) return null;

  const getFixOptions = () => {
    switch (conflict.type) {
      case 'teacher':
        return [
          { value: 'swap_teacher_first', label: `Заменить учителя в ${conflict.details?.first?.className}`, icon: <FaUserGraduate /> },
          { value: 'swap_teacher_second', label: `Заменить учителя в ${conflict.details?.second?.className}`, icon: <FaUserGraduate /> }
        ];
      case 'room':
        return [
          { value: 'change_room_first', label: `Сменить кабинет в ${conflict.details?.first?.className}`, icon: <FaDoorOpen /> },
          { value: 'change_room_second', label: `Сменить кабинет в ${conflict.details?.second?.className}`, icon: <FaDoorOpen /> }
        ];
      default:
        return [];
    }
  };

  const handleApply = () => {
    if (!selectedFix) {
      alert('Выберите вариант исправления');
      return;
    }
    onApplyFix({
      type: selectedFix,
      conflict,
      alternativeTeacher,
      alternativeRoom
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal quick-fix-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FaCheckCircle /> Быстрое исправление конфликта</h3>
          <button className="close-modal" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-content">
          <div className="conflict-description">
            <div className="conflict-icon"><FaExclamationTriangle /></div>
            <div className="conflict-description-text">
              <div className="conflict-description-message">{conflict.message}</div>
              <div className="conflict-description-location">
                {conflict.details?.first && (
                  <span>{conflict.details.first.className}, {conflict.details.first.day}, {conflict.details.first.lessonNumber} урок</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Выберите способ исправления:</label>
            <div className="fix-options">
              {getFixOptions().map(option => (
                <label key={option.value} className="fix-option">
                  <input
                    type="radio"
                    name="fixType"
                    value={option.value}
                    checked={selectedFix === option.value}
                    onChange={(e) => setSelectedFix(e.target.value)}
                  />
                  {option.icon} {option.label}
                </label>
              ))}
            </div>
          </div>

          {(selectedFix === 'swap_teacher_first' || selectedFix === 'swap_teacher_second') && (
            <div className="form-group">
              <label><FaUserGraduate /> Выберите другого учителя:</label>
              <select value={alternativeTeacher} onChange={(e) => setAlternativeTeacher(e.target.value)}>
                <option value="">Выберите учителя</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.name} disabled={t.name === conflict.details?.first?.teacher}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(selectedFix === 'change_room_first' || selectedFix === 'change_room_second') && (
            <div className="form-group">
              <label><FaDoorOpen /> Выберите другой кабинет:</label>
              <select value={alternativeRoom} onChange={(e) => setAlternativeRoom(e.target.value)}>
                <option value="">Выберите кабинет</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.number} disabled={r.number === conflict.details?.first?.room}>
                    Кабинет {r.number} {r.name && `(${r.name})`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleApply}>
            <FaCheckCircle /> Применить исправление
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(QuickFixModal);