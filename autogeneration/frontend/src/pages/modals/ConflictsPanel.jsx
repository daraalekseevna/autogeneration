// modals/ConflictsPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaExclamationTriangle, FaUserGraduate, FaDoorOpen, 
  FaInfoCircle, FaChevronDown, FaChevronUp, FaTimes, 
  FaCheckCircle, FaEye 
} from 'react-icons/fa';

const ConflictsPanel = ({ conflicts, onFixConflict, onNavigateToLesson, isEditMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedConflicts, setExpandedConflicts] = useState({});
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  const toggleExpand = (index) => {
    setExpandedConflicts(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getConflictIcon = (type) => {
    switch (type) {
      case 'teacher': return <FaUserGraduate />;
      case 'room': return <FaDoorOpen />;
      default: return <FaInfoCircle />;
    }
  };

  const getShortMessage = (conflict) => {
    if (conflict.type === 'teacher') {
      return `${conflict.details?.first?.className} / ${conflict.details?.second?.className}`;
    }
    return `${conflict.details?.first?.room} / ${conflict.details?.second?.room}`;
  };

  return (
    <div className="conflicts-float-panel" ref={panelRef}>
      <button 
        className={`conflicts-float-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaExclamationTriangle />
        <span className="conflicts-count">{conflicts.length}</span>
        {!isOpen && <span className="conflicts-label">Конфликты</span>}
        <FaChevronDown className={`float-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="conflicts-dropdown">
          <div className="conflicts-dropdown-header">
            <span><FaExclamationTriangle /> Конфликты ({conflicts.length})</span>
            <button onClick={() => setIsOpen(false)}><FaTimes /></button>
          </div>
          <div className="conflicts-dropdown-list">
            {conflicts.map((conflict, idx) => (
              <div key={conflict.id || idx} className="conflict-dropdown-item">
                <div className="conflict-dropdown-row">
                  <div className={`conflict-type-badge ${conflict.type}`}>
                    {getConflictIcon(conflict.type)} {conflict.type === 'teacher' ? 'Учитель' : 'Кабинет'}
                  </div>
                  <div className="conflict-dropdown-classes">
                    {getShortMessage(conflict)}
                  </div>
                  <div className="conflict-dropdown-actions">
                    {isEditMode && (
                      <button 
                        className="conflict-action-fix"
                        onClick={() => onFixConflict(conflict)}
                        title="Быстрое исправление"
                      >
                        <FaCheckCircle />
                      </button>
                    )}
                    <button 
                      className="conflict-action-goto"
                      onClick={() => {
                        onNavigateToLesson(conflict.details?.first);
                        setIsOpen(false);
                      }}
                      title="Перейти к уроку"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className="conflict-action-expand"
                      onClick={() => toggleExpand(idx)}
                      title="Подробнее"
                    >
                      {expandedConflicts[idx] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                </div>
                {expandedConflicts[idx] && (
                  <div className="conflict-dropdown-details">
                    <div className="conflict-detail-row">
                      <span className="conflict-detail-class">{conflict.details?.first?.className}</span>
                      <span>{conflict.details?.first?.day}, {conflict.details?.first?.lessonNumber} урок</span>
                      <span>{conflict.details?.first?.subject}</span>
                    </div>
                    <div className="conflict-detail-row">
                      <span className="conflict-detail-class">{conflict.details?.second?.className}</span>
                      <span>{conflict.details?.second?.day}, {conflict.details?.second?.lessonNumber} урок</span>
                      <span>{conflict.details?.second?.subject}</span>
                    </div>
                    {conflict.suggestion && (
                      <div className="conflict-suggestion">
                        💡 {conflict.suggestion}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ConflictsPanel);