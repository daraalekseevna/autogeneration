// src/frontend/config/extracurricular/dragdrop.js
import { FaGripVertical, FaExchangeAlt, FaTimes } from 'react-icons/fa';

export const DragDropConfig = {
    // Классы для состояний перетаскивания
    classes: {
        draggable: "draggable",
        dragging: "dragging",
        dragOver: "drag-over",
        dragHandle: "drag-handle",
        dropZone: "drop-zone",
        validDrop: "valid-drop",
        invalidDrop: "invalid-drop"
    },
    
    // Иконки
    icons: {
        dragHandle: FaGripVertical,
        swap: FaExchangeAlt,
        cancel: FaTimes
    },
    
    // Анимации
    animations: {
        duration: {
            fast: "150ms",
            normal: "300ms",
            slow: "500ms",
            drop: "200ms"
        },
        easing: {
            ease: "ease",
            easeIn: "ease-in",
            easeOut: "ease-out",
            easeInOut: "ease-in-out",
            bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
        }
    },
    
    // Сообщения и подсказки
    messages: {
        dragHint: "Перетащите для изменения порядка",
        dropHint: "Отпустите для изменения порядка",
        dragStart: "Начато перетаскивание",
        dragEnd: "Перетаскивание завершено",
        dropSuccess: "Урок перемещен",
        dropError: "Невозможно переместить урок",
        swapHint: "Перетащите для обмена уроками"
    },
    
    // Настройки DataTransfer
    dataTransfer: {
        format: "text/plain",
        effect: "move",
        types: {
            LESSON: "application/lesson",
            TEACHER: "application/teacher",
            ROOM: "application/room"
        }
    },
    
    // Ограничения
    constraints: {
        maxDragDistance: 1000, // пикселей
        minHoldTime: 150, // миллисекунд
        autoScrollSpeed: 10 // пикселей в секунду
    },
    
    // Функции-помощники
    helpers: {
        // Получение индекса из DataTransfer
        getDragData(event, type = "index") {
            try {
                const data = event.dataTransfer.getData(this.dataTransfer.format);
                if (type === "index") {
                    return parseInt(data);
                }
                return JSON.parse(data);
            } catch (error) {
                return null;
            }
        },
        
        // Установка данных в DataTransfer
        setDragData(event, data, type = "index") {
            try {
                if (type === "index") {
                    event.dataTransfer.setData(this.dataTransfer.format, data.toString());
                } else {
                    event.dataTransfer.setData(this.dataTransfer.format, JSON.stringify(data));
                }
                event.dataTransfer.effectAllowed = this.dataTransfer.effect;
            } catch (error) {
                console.error('Ошибка установки данных перетаскивания:', error);
            }
        },
        
        // Проверка возможности перетаскивания
        canDrag(source, target) {
            // Проверяем, что источник и цель не одинаковы
            if (source === target) return false;
            
            // Проверяем, что оба элемента существуют
            if (source == null || target == null) return false;
            
            // Дополнительные проверки можно добавить здесь
            return true;
        },
        
        // Проверка валидности цели для сброса
        isValidDropTarget(source, target, context = {}) {
            // Проверяем базовые условия
            if (!this.canDrag(source, target)) return false;
            
            // Проверяем контекстные ограничения
            if (context.maxLessonsPerDay && context.currentLessons >= context.maxLessonsPerDay) {
                return false;
            }
            
            if (context.excludedRooms && context.excludedRooms.includes(target.room)) {
                return false;
            }
            
            if (context.excludedTeachers && context.excludedTeachers.includes(target.teacher)) {
                return false;
            }
            
            return true;
        },
        
        // Перестановка элементов в массиве
        reorderArray(array, fromIndex, toIndex) {
            if (fromIndex === toIndex) return array;
            
            const newArray = [...array];
            const [movedItem] = newArray.splice(fromIndex, 1);
            newArray.splice(toIndex, 0, movedItem);
            return newArray;
        },
        
        // Обмен элементов местами
        swapArrayItems(array, indexA, indexB) {
            if (indexA === indexB) return array;
            
            const newArray = [...array];
            [newArray[indexA], newArray[indexB]] = [newArray[indexB], newArray[indexA]];
            return newArray;
        },
        
        // Обновление порядка элементов
        updateOrder(array, startField = "order") {
            return array.map((item, index) => ({
                ...item,
                [startField]: index
            }));
        },
        
        // Получение стилей для перетаскиваемого элемента
        getDragStyle(isDragging, isValid = true) {
            return {
                opacity: isDragging ? 0.5 : 1,
                cursor: isDragging ? 'grabbing' : 'grab',
                transform: isDragging ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.2s ease',
                border: isValid ? '2px dashed #4CAF50' : '2px dashed #f44336',
                backgroundColor: isValid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'
            };
        },
        
        // Получение стилей для зоны сброса
        getDropZoneStyle(isOver, isValid = true) {
            return {
                border: isOver ? (isValid ? '2px solid #4CAF50' : '2px solid #f44336') : '2px dashed #ddd',
                backgroundColor: isOver ? (isValid ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)') : 'transparent',
                transition: 'all 0.2s ease',
                minHeight: '50px'
            };
        }
    },
    
    // События
    events: {
        onDragStart(event, data) {
            event.stopPropagation();
            this.helpers.setDragData(event, data);
            
            // Добавляем визуальную обратную связь
            event.currentTarget.classList.add(this.classes.dragging);
            
            console.log(this.messages.dragStart, data);
        },
        
        onDragOver(event, isValid = true) {
            event.preventDefault();
            event.dataTransfer.dropEffect = isValid ? 'move' : 'none';
            
            if (isValid) {
                event.currentTarget.classList.add(this.classes.validDrop);
                event.currentTarget.classList.remove(this.classes.invalidDrop);
            } else {
                event.currentTarget.classList.add(this.classes.invalidDrop);
                event.currentTarget.classList.remove(this.classes.validDrop);
            }
        },
        
        onDragLeave(event) {
            event.currentTarget.classList.remove(this.classes.validDrop);
            event.currentTarget.classList.remove(this.classes.invalidDrop);
        },
        
        onDrop(event, onDropCallback) {
            event.preventDefault();
            event.stopPropagation();
            
            const data = this.helpers.getDragData(event);
            
            // Убираем классы
            event.currentTarget.classList.remove(this.classes.validDrop);
            event.currentTarget.classList.remove(this.classes.invalidDrop);
            
            if (data && onDropCallback) {
                onDropCallback(data);
                console.log(this.messages.dropSuccess, data);
            }
        },
        
        onDragEnd(event) {
            // Убираем класс перетаскивания
            document.querySelectorAll(`.${this.classes.dragging}`).forEach(el => {
                el.classList.remove(this.classes.dragging);
            });
            
            console.log(this.messages.dragEnd);
        }
    },
    
    // Хуки для кастомной логики
    hooks: {
        beforeDrag: null,
        afterDrag: null,
        beforeDrop: null,
        afterDrop: null,
        validateDrop: null
    },
    
    // Инициализация
    initialize(hooks = {}) {
        this.hooks = { ...this.hooks, ...hooks };
        console.log('DragDropConfig инициализирован');
        return this;
    }
};