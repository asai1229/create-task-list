// ドラッグ＆ドロップモジュール
class DragDropManager {
    constructor(onTaskMove) {
        this.onTaskMove = onTaskMove;
        this.isDragging = false;
        this.draggedElement = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('dragstart', (e) => this.handleDragStart(e));
        document.addEventListener('dragend', (e) => this.handleDragEnd(e));
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
    }

    handleDragStart(e) {
        if (e.target.classList.contains('task-card')) {
            this.isDragging = true;
            this.draggedElement = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    handleDragEnd(e) {
        if (e.target.classList.contains('task-card')) {
            this.isDragging = false;
            this.draggedElement = null;
            e.target.classList.remove('dragging');
            
            // 全てのドラッグオーバー状態をクリア
            document.querySelectorAll('.column-content').forEach(column => {
                column.classList.remove('drag-over');
            });
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        
        const columnContent = e.target.closest('.column-content');
        if (columnContent && this.isDragging) {
            e.dataTransfer.dropEffect = 'move';
            columnContent.classList.add('drag-over');
            
            // 他の列のドラッグオーバー状態をクリア
            document.querySelectorAll('.column-content').forEach(column => {
                if (column !== columnContent) {
                    column.classList.remove('drag-over');
                }
            });
        }
    }

    handleDragLeave(e) {
        const columnContent = e.target.closest('.column-content');
        if (columnContent && !columnContent.contains(e.relatedTarget)) {
            columnContent.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        
        const columnContent = e.target.closest('.column-content');
        if (columnContent && this.isDragging) {
            columnContent.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = columnContent.dataset.status;
            
            if (taskId && newStatus) {
                // コールバック関数を呼び出してタスクの移動を通知
                if (this.onTaskMove) {
                    this.onTaskMove(taskId, newStatus);
                }
            }
        }
    }

    // ドラッグ可能な要素の有効/無効切り替え
    enableDragAndDrop() {
        document.querySelectorAll('.task-card').forEach(card => {
            card.draggable = true;
        });
    }

    disableDragAndDrop() {
        document.querySelectorAll('.task-card').forEach(card => {
            card.draggable = false;
        });
    }

    // 現在のドラッグ状態を取得
    isDraggingActive() {
        return this.isDragging;
    }

    // ドラッグ中の要素を取得
    getDraggedElement() {
        return this.draggedElement;
    }
}