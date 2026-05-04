// components/GenerationSettings.jsx
import React from 'react';
import { 
  FaClock, 
  FaCalendarAlt, 
  FaBell, 
  FaListAlt, 
  FaSchool,
  FaUsers,
  FaBalanceScale,
  FaExclamationTriangle,
  FaShieldAlt,
  FaMagic,
  FaRegCalendarCheck,
  FaBook,
  FaUserTie,
  FaChair,
  FaSyncAlt
} from 'react-icons/fa';

const GenerationSettings = ({ settings, onSettingChange }) => {
  const allClasses = ['1А', '1Б', '2А', '2Б', '3А', '3Б', '4А', '4Б', '5А', '5Б', 
                     '6А', '6Б', '7А', '7Б', '8А', '8Б', '9А', '9Б', '10А', '10Б', '11А', '11Б'];
  
  const allSubjects = ['Математика', 'Русский язык', 'Английский язык', 'Литература', 'История', 
                      'Биология', 'Химия', 'Физика', 'География', 'Физкультура', 'Информатика', 
                      'Музыка', 'ИЗО', 'Технология', 'ОБЖ', 'Обществознание', 'Астрономия'];
  
  const allTeachers = Array.from({length: 50}, (_, i) => `Учитель ${i + 1}`);
  const allClassrooms = Array.from({length: 40}, (_, i) => `Кабинет ${i + 1}`);

  const handleWorkDayToggle = (day) => {
    const newDays = settings.workDays.includes(day)
      ? settings.workDays.filter(d => d !== day)
      : [...settings.workDays, day];
    onSettingChange('workDays', newDays);
  };

  const handleClassToggle = (className) => {
    const newClasses = settings.secondShiftClasses.includes(className)
      ? settings.secondShiftClasses.filter(c => c !== className)
      : [...settings.secondShiftClasses, className];
    onSettingChange('secondShiftClasses', newClasses);
  };

  const handleTeacherToggle = (teacher) => {
    const newTeachers = settings.experiencedTeachers.includes(teacher)
      ? settings.experiencedTeachers.filter(t => t !== teacher)
      : [...settings.experiencedTeachers, teacher];
    onSettingChange('experiencedTeachers', newTeachers);
  };

  const handleSubjectToggle = (subject) => {
    const newSubjects = settings[subject.type].includes(subject.name)
      ? settings[subject.type].filter(s => s !== subject.name)
      : [...settings[subject.type], subject.name];
    onSettingChange(subject.type, newSubjects);
  };

  const handleInputChange = (key, value) => {
    onSettingChange(key, value);
  };

  const handleClassroomRestrictionToggle = (classroom, type) => {
    const key = type === 'specialized' ? 'specializedClassrooms' : 'restrictedClassrooms';
    const newClassrooms = settings[key].includes(classroom)
      ? settings[key].filter(c => c !== classroom)
      : [...settings[key], classroom];
    onSettingChange(key, newClassrooms);
  };

  return (
    <div className="excel-gen-settings-section">
      <h3 className="excel-gen-settings-title">
        <FaCog />
        Настройки генерации расписания
      </h3>
      
      <div className="excel-gen-settings-grid">
        {/* Основные временные настройки */}
        <div className="excel-gen-settings-group">
          <h4><FaClock /> Временные параметры</h4>
          
          <div className="excel-gen-inputs-row">
            <div className="excel-gen-input-group-vertical">
              <label>Начало 1 смены</label>
              <input 
                type="time" 
                value={settings.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
              />
            </div>
            <div className="excel-gen-input-group-vertical">
              <label>Длительность урока (мин)</label>
              <input 
                type="number" 
                min="30" max="90" step="5"
                value={settings.lessonDuration}
                onChange={(e) => handleInputChange('lessonDuration', parseInt(e.target.value))}
              />
            </div>
            <div className="excel-gen-input-group-vertical">
              <label>Обычная перемена (мин)</label>
              <input 
                type="number" 
                min="5" max="30" step="5"
                value={settings.breakDuration}
                onChange={(e) => handleInputChange('breakDuration', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="excel-gen-inputs-row">
            <div className="excel-gen-input-group-vertical">
              <label>Большая перемена (мин)</label>
              <input 
                type="number" 
                min="10" max="45" step="5"
                value={settings.longBreakDuration}
                onChange={(e) => handleInputChange('longBreakDuration', parseInt(e.target.value))}
              />
            </div>
            <div className="excel-gen-input-group-vertical">
              <label>Большая перемена после</label>
              <select 
                value={settings.longBreakAfter}
                onChange={(e) => handleInputChange('longBreakAfter', parseInt(e.target.value))}
              >
                {[2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num}-й урок</option>
                ))}
              </select>
            </div>
            <div className="excel-gen-input-group-vertical">
              <label>Макс уроков в день</label>
              <input 
                type="number" 
                min="1" max="10"
                value={settings.maxLessonsPerDay}
                onChange={(e) => handleInputChange('maxLessonsPerDay', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Рабочие дни */}
        <div className="excel-gen-settings-group">
          <h4><FaCalendarAlt /> Рабочие дни и недели</h4>
          
          <div className="excel-gen-tags-container">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
              <div 
                key={day}
                className={`excel-gen-tag ${settings.workDays.includes(day) ? 'active' : ''} ${day === 'Сб' && settings.saturdayLessons ? 'active' : ''}`}
                onClick={() => {
                  if (day === 'Сб') {
                    handleInputChange('saturdayLessons', !settings.saturdayLessons);
                  } else {
                    handleWorkDayToggle(day);
                  }
                }}
              >
                {day}
              </div>
            ))}
          </div>
          
          <div className="excel-gen-setting-checkbox">
            <input
              type="checkbox"
              id="alternating-weeks"
              checked={settings.alternatingWeeks}
              onChange={(e) => handleInputChange('alternatingWeeks', e.target.checked)}
            />
            <label htmlFor="alternating-weeks">Чередующиеся недели (для 2-х часовых предметов)</label>
          </div>
          
          <div className="excel-gen-setting-checkbox">
            <input
              type="checkbox"
              id="allow-empty"
              checked={settings.allowEmptyLessons}
              onChange={(e) => handleInputChange('allowEmptyLessons', e.target.checked)}
            />
            <label htmlFor="allow-empty">Разрешить "окна" в расписании учителей</label>
          </div>
        </div>

        {/* Вторая смена */}
        <div className="excel-gen-settings-group">
          <h4><FaBell /> Вторая смена</h4>
          
          <div className="excel-gen-setting-checkbox">
            <input
              type="checkbox"
              id="second-shift"
              checked={settings.secondShift}
              onChange={(e) => handleInputChange('secondShift', e.target.checked)}
            />
            <label htmlFor="second-shift">Включить вторую смену</label>
          </div>
          
          {settings.secondShift && (
            <>
              <div className="excel-gen-inputs-row">
                <div className="excel-gen-input-group-vertical">
                  <label>Начало 2 смены</label>
                  <input 
                    type="time" 
                    value={settings.secondShiftStart}
                    onChange={(e) => handleInputChange('secondShiftStart', e.target.value)}
                  />
                </div>
                <div className="excel-gen-input-group-vertical">
                  <label>Минимальный интервал между сменами (мин)</label>
                  <input 
                    type="number" 
                    min="30" max="180" step="10"
                    value={settings.shiftInterval}
                    onChange={(e) => handleInputChange('shiftInterval', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <p className="excel-gen-setting-description">Выберите классы для второй смены:</p>
              <div className="excel-gen-tags-container">
                {allClasses.map(className => (
                  <div 
                    key={className}
                    className={`excel-gen-tag ${settings.secondShiftClasses.includes(className) ? 'active' : ''}`}
                    onClick={() => handleClassToggle(className)}
                  >
                    {className}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Приоритетные предметы */}
        <div className="excel-gen-settings-group">
          <h4><FaListAlt /> Приоритет предметов</h4>
          <p className="excel-gen-setting-description">
            Приоритетные предметы ставятся на первые уроки, сложные - на средние
          </p>
          
          <div className="excel-gen-inputs-row">
            <div className="excel-gen-input-group-vertical">
              <label>Приоритетные (первые уроки)</label>
              <div className="excel-gen-tags-container">
                {allSubjects.slice(0, 8).map(subject => (
                  <div 
                    key={subject}
                    className={`excel-gen-tag ${settings.prioritySubjects.includes(subject) ? 'active' : ''}`}
                    onClick={() => handleSubjectToggle({ name: subject, type: 'prioritySubjects' })}
                  >
                    {subject}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="excel-gen-input-group-vertical">
              <label>Сложные (средние уроки)</label>
              <div className="excel-gen-tags-container">
                {allSubjects.slice(8).map(subject => (
                  <div 
                    key={subject}
                    className={`excel-gen-tag ${settings.difficultSubjects.includes(subject) ? 'active' : ''}`}
                    onClick={() => handleSubjectToggle({ name: subject, type: 'difficultSubjects' })}
                  >
                    {subject}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Учителя */}
        <div className="excel-gen-settings-group">
          <h4><FaUserTie /> Настройки учителей</h4>
          
          <div className="excel-gen-setting-checkbox">
            <input
              type="checkbox"
              id="respect-teacher-load"
              checked={settings.respectTeacherLoad}
              onChange={(e) => handleInputChange('respectTeacherLoad', e.target.checked)}
            />
            <label htmlFor="respect-teacher-load">Учитывать максимальную нагрузку учителей</label>
          </div>
          
          <div className="excel-gen-setting-checkbox">
            <input
              type="checkbox"
              id="prevent-teacher-gaps"
              checked={settings.preventTeacherGaps}
              onChange={(e) => handleInputChange('preventTeacherGaps', e.target.checked)}
            />
            <label htmlFor="prevent-teacher-gaps">Минимизировать окна у учителей</label>
          </div>
          
          <div className="excel-gen-input-group-vertical">
            <label>Опытные учителя (получают старшие классы)</label>
            <div className="excel-gen-tags-container">
              {allTeachers.slice(0, 10).map(teacher => (
                <div 
                  key={teacher}
                  className={`excel-gen-tag ${settings.experiencedTeachers.includes(teacher) ? 'active' : ''}`}
                  onClick={() => handleTeacherToggle(teacher)}
                >
                  {teacher}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Кабинеты */}
        <div className="excel-gen-settings-group">
          <h4><FaChair /> Настройки кабинетов</h4>
          
          <div className="excel-gen-inputs-row">
            <div className="excel-gen-input-group-vertical">
              <label>Специализированные кабинеты</label>
              <div className="excel-gen-tags-container">
                {allClassrooms.slice(0, 8).map(classroom => (
                  <div 
                    key={classroom}
                    className={`excel-gen-tag ${settings.specializedClassrooms.includes(classroom) ? 'active' : ''}`}
                    onClick={() => handleClassroomRestrictionToggle(classroom, 'specialized')}
                  >
                    {classroom}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="excel-gen-input-group-vertical">
              <label>Ограниченные кабинеты</label>
              <div className="excel-gen-tags-container">
                {allClassrooms.slice(8, 16).map(classroom => (
                  <div 
                    key={classroom}
                    className={`excel-gen-tag ${settings.restrictedClassrooms.includes(classroom) ? 'active' : ''}`}
                    onClick={() => handleClassroomRestrictionToggle(classroom, 'restricted')}
                  >
                    {classroom}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="excel-gen-setting-checkbox">
            <input
              type="checkbox"
              id="optimize-classroom-usage"
              checked={settings.optimizeClassroomUsage}
              onChange={(e) => handleInputChange('optimizeClassroomUsage', e.target.checked)}
            />
            <label htmlFor="optimize-classroom-usage">Оптимизировать использование кабинетов</label>
          </div>
        </div>

        {/* Дополнительные настройки */}
        <div className="excel-gen-settings-group">
          <h4><FaMagic /> Дополнительные настройки</h4>
          
          <div className="excel-gen-setting-checkbox">
            <input
              type="checkbox"
              id="enforce-sanpin"
              checked={settings.enforceSanpin}
              onChange={(e) => handleInputChange('enforceSanpin', e.target.checked)}
            />
            <label htmlFor="enforce-sanpin">
              <FaShieldAlt /> Соблюдать нормы СанПиН
            </label>
          </div>
          
          {settings.enforceSanpin && (
            <div className="excel-gen-inputs-row">
              <div className="excel-gen-input-group-vertical">
                <label>Макс нагрузка в неделю (1-4 класс)</label>
                <input 
                  type="number" 
                  min="20" max="30"
                  value={settings.sanpinMaxLoad14}
                  onChange={(e) => handleInputChange('sanpinMaxLoad14', parseInt(e.target.value))}
                />
              </div>
              <div className="excel-gen-input-group-vertical">
                <label>Макс нагрузка в неделю (5-9 класс)</label>
                <input 
                  type="number" 
                  min="30" max="40"
                  value={settings.sanpinMaxLoad59}
                  onChange={(e) => handleInputChange('sanpinMaxLoad59', parseInt(e.target.value))}
                />
              </div>
              <div className="excel-gen-input-group-vertical">
                <label>Макс нагрузка в неделю (10-11 класс)</label>
                <input 
                  type="number" 
                  min="35" max="45"
                  value={settings.sanpinMaxLoad1011}
                  onChange={(e) => handleInputChange('sanpinMaxLoad1011', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
          
          <div className="excel-gen-setting-checkbox">
            <input
              type="checkbox"
              id="balance-complexity"
              checked={settings.balanceComplexity}
              onChange={(e) => handleInputChange('balanceComplexity', e.target.checked)}
            />
            <label htmlFor="balance-complexity">
              <FaBalanceScale /> Балансировать сложность по дням
            </label>
          </div>
          
          <div className="excel-gen-setting-checkbox">
            <input
              type="checkbox"
              id="avoid-duplicate-subjects"
              checked={settings.avoidDuplicateSubjects}
              onChange={(e) => handleInputChange('avoidDuplicateSubjects', e.target.checked)}
            />
            <label htmlFor="avoid-duplicate-subjects">
              <FaExclamationTriangle /> Избегать одинаковых предметов подряд
            </label>
          </div>
        </div>

        {/* Экспортные настройки */}
        <div className="excel-gen-settings-group">
          <h4><FaRegCalendarCheck /> Настройки экспорта</h4>
          
          <div className="excel-gen-inputs-row">
            <div className="excel-gen-input-group-vertical">
              <label>Формат экспорта</label>
              <select 
                value={settings.exportFormat}
                onChange={(e) => handleInputChange('exportFormat', e.target.value)}
              >
                <option value="single">Один файл</option>
                <option value="separate">По классам отдельно</option>
                <option value="teachers">По учителям</option>
                <option value="full">Полный пакет</option>
              </select>
            </div>
            
            <div className="excel-gen-input-group-vertical">
              <label>Включить в экспорт</label>
              <div className="excel-gen-tags-container">
                {['Расписание классов', 'Расписание учителей', 'Загрузка кабинетов', 'Статистика'].map(item => (
                  <div 
                    key={item}
                    className={`excel-gen-tag ${settings.exportIncludes.includes(item) ? 'active' : ''}`}
                    onClick={() => {
                      const newIncludes = settings.exportIncludes.includes(item)
                        ? settings.exportIncludes.filter(i => i !== item)
                        : [...settings.exportIncludes, item];
                      handleInputChange('exportIncludes', newIncludes);
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="excel-gen-setting-checkbox">
            <input
              type="checkbox"
              id="auto-open-excel"
              checked={settings.autoOpenExcel}
              onChange={(e) => handleInputChange('autoOpenExcel', e.target.checked)}
            />
            <label htmlFor="auto-open-excel">Автоматически открыть Excel после генерации</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationSettings;