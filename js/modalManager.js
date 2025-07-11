// モーダル管理モジュール
class ModalManager {
    constructor() {
        this.confirmCallback = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // モーダル外クリックで閉じる
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    // モーダルを開く
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            // フォーカスを最初の入力要素に設定
            const firstInput = modal.querySelector('input, textarea, select, button');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }

    // モーダルを閉じる
    closeModal(modalElement) {
        if (typeof modalElement === 'string') {
            modalElement = document.getElementById(modalElement);
        }
        if (modalElement) {
            modalElement.style.display = 'none';
            // フォームのリセット
            const form = modalElement.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }

    // 全てのモーダルを閉じる
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // 確認モーダルの表示
    showConfirmModal(message, onConfirm, onCancel = null) {
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        if (modal && messageElement) {
            messageElement.textContent = message;
            
            // 既存のイベントリスナーを削除
            const newConfirmBtn = confirmBtn.cloneNode(true);
            const newCancelBtn = cancelBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

            // 新しいイベントリスナーを追加
            newConfirmBtn.addEventListener('click', () => {
                if (onConfirm) onConfirm();
                this.closeModal(modal);
            });

            newCancelBtn.addEventListener('click', () => {
                if (onCancel) onCancel();
                this.closeModal(modal);
            });

            this.openModal('confirmModal');
        }
    }

    // タスクモーダルの設定
    setupTaskModal(onSave, onDelete, onCancel) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const deleteBtn = document.getElementById('deleteTaskBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const closeBtn = document.getElementById('closeModal');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (onSave) onSave();
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (onDelete) onDelete();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (onCancel) onCancel();
                this.closeModal(modal);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (onCancel) onCancel();
                this.closeModal(modal);
            });
        }
    }

    // 設定モーダルの設定
    setupSettingsModal(onClose) {
        const modal = document.getElementById('settingsModal');
        const closeBtn = document.getElementById('closeSettingsModal');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (onClose) onClose();
                this.closeModal(modal);
            });
        }

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                if (onClose) onClose();
                this.closeModal(modal);
            });
        }
    }

    // タスクモーダルの表示設定
    showTaskModal(task = null, statuses = []) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const deleteBtn = document.getElementById('deleteTaskBtn');
        const modalTitle = document.getElementById('modalTitle');
        const statusSelect = document.getElementById('taskStatus');

        if (!modal || !form) return;

        // フォームのリセット
        form.reset();

        // ステータス選択肢の更新
        if (statusSelect) {
            statusSelect.innerHTML = '';
            statuses.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = status;
                statusSelect.appendChild(option);
            });
        }

        const statusFormGroup = document.getElementById('taskStatus').closest('.form-group');

        if (task) {
            // 編集モード
            modalTitle.textContent = 'タスク編集';
            deleteBtn.style.display = 'block';
            
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDetail').value = task.detail || '';
            document.getElementById('taskDeadline').value = task.deadline || '';
            document.getElementById('taskTags').value = task.tags.join(', ');
            document.getElementById('taskStatus').value = task.status;
            
            // 編集モードではステータス選択を表示・有効化
            if (statusFormGroup) {
                statusFormGroup.style.display = 'block';
            }
            if (document.getElementById('taskStatus')) {
                document.getElementById('taskStatus').disabled = false;
            }
        } else {
            // 新規作成モード
            modalTitle.textContent = 'タスク追加';
            deleteBtn.style.display = 'none';
            
            // ステータス欄を非表示にし、値は「未着手」に固定
            if (statusFormGroup) {
                statusFormGroup.style.display = 'none';
            }
            if (document.getElementById('taskStatus')) {
                document.getElementById('taskStatus').value = '未着手';
            }
        }

        this.openModal('taskModal');
    }

    // タスクフォームデータの取得
    getTaskFormData() {
        const title = document.getElementById('taskTitle').value.trim();
        const detail = document.getElementById('taskDetail').value.trim();
        const deadline = document.getElementById('taskDeadline').value;
        const tags = document.getElementById('taskTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const status = document.getElementById('taskStatus').value;

        return { title, detail, deadline, tags, status };
    }

    // フォームバリデーション
    validateTaskForm() {
        const formData = this.getTaskFormData();
        
        if (!formData.title) {
            alert('タイトルは必須です。');
            return false;
        }

        // 締切日時の検証（新規作成時のみ）
        if (formData.deadline) {
            const deadlineDate = new Date(formData.deadline);
            const now = new Date();
            
            // 現在時刻より前の日時が設定されている場合はエラー
            if (deadlineDate < now) {
                alert('締切日時は現在時刻より後の日時を設定してください。');
                return false;
            }
        }

        return true;
    }

    // 設定モーダルの表示
    showSettingsModal(statuses = []) {
        this.renderStatusList(statuses);
        this.openModal('settingsModal');
    }

    // ステータスリストの描画
    renderStatusList(statuses) {
        const statusList = document.getElementById('statusList');
        if (!statusList) return;

        statusList.innerHTML = '';
        const defaultStatuses = ['未着手', '進行中', '完了'];

        statuses.forEach((status, index) => {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            statusItem.draggable = true;
            statusItem.dataset.status = status;
            statusItem.dataset.index = index;
            
            if (defaultStatuses.includes(status)) {
                statusItem.classList.add('default');
            }

            statusItem.innerHTML = `
                <div class="status-drag-handle">≡</div>
                <span class="status-name">${status}</span>
                <div class="status-actions">
                    ${!defaultStatuses.includes(status) ? 
                        `<button class="btn btn-danger btn-small" data-status="${status}">削除</button>` : 
                        ''
                    }
                </div>
            `;

            statusList.appendChild(statusItem);
        });

        // ドラッグ&ドロップイベントリスナーの設定
        this.setupStatusDragAndDrop();
    }

    // ステータスのドラッグ&ドロップ設定
    setupStatusDragAndDrop() {
        const statusList = document.getElementById('statusList');
        if (!statusList) return;

        let draggedElement = null;
        let draggedIndex = null;

        statusList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('status-item')) {
                draggedElement = e.target;
                draggedIndex = parseInt(e.target.dataset.index);
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });

        statusList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('status-item')) {
                e.target.classList.remove('dragging');
                // ドロップゾーンのクリア
                document.querySelectorAll('.status-item.drag-over').forEach(item => {
                    item.classList.remove('drag-over');
                });
            }
        });

        statusList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = this.getDragAfterElement(statusList, e.clientY);
            const draggingElement = document.querySelector('.status-item.dragging');
            
            if (afterElement == null) {
                statusList.appendChild(draggingElement);
            } else {
                statusList.insertBefore(draggingElement, afterElement);
            }
        });

        statusList.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement) {
                // 新しい順序を取得
                const newOrder = Array.from(statusList.children).map(item => item.dataset.status);
                
                // 設定マネージャーにコールバック
                if (this.onStatusReorder) {
                    this.onStatusReorder(newOrder);
                }
                
                draggedElement = null;
                draggedIndex = null;
            }
        });
    }

    // ドラッグ時の挿入位置を決定
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.status-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // ステータス順序変更コールバックの設定
    setStatusReorderCallback(callback) {
        this.onStatusReorder = callback;
    }

    // 新しいステータス名の取得
    getNewStatusName() {
        const input = document.getElementById('newStatusInput');
        return input ? input.value.trim() : '';
    }

    // 新しいステータス名の入力フィールドをクリア
    clearNewStatusInput() {
        const input = document.getElementById('newStatusInput');
        if (input) {
            input.value = '';
        }
    }
}