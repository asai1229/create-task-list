// タスク管理アプリケーション
class TaskManager {
    constructor() {
        this.tasks = [];
        this.statuses = ['未着手', '進行中', '完了'];
        this.currentEditingTask = null;
        this.reminderShown = new Set();
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderTasks();
        this.updateTagFilter();
        this.checkReminders();
        setInterval(() => this.checkReminders(), 60000); // 1分ごとにチェック
    }

    // データの読み込み
    loadData() {
        const savedTasks = localStorage.getItem('tasks');
        const savedStatuses = localStorage.getItem('statuses');
        
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
        
        if (savedStatuses) {
            this.statuses = JSON.parse(savedStatuses);
        }
    }

    // データの保存
    saveData() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('statuses', JSON.stringify(this.statuses));
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // タスク追加ボタン
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // 設定ボタン
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettingsModal();
        });

        // CSV出力ボタン
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportCSV();
        });

        // CSV読込ボタン
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        // ファイル選択
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importCSV(e.target.files[0]);
        });

        // 検索機能
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterTasks();
        });

        // タグフィルター
        document.getElementById('tagFilter').addEventListener('change', (e) => {
            this.filterTasks();
        });

        // モーダル関連
        this.setupModalListeners();

        // ドラッグ＆ドロップ
        this.setupDragAndDrop();
    }

    // モーダルのイベントリスナー
    setupModalListeners() {
        // タスクモーダル
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        document.getElementById('deleteTaskBtn').addEventListener('click', () => {
            this.deleteTask();
        });

        // 設定モーダル
        document.getElementById('closeSettingsModal').addEventListener('click', () => {
            this.closeSettingsModal();
        });

        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            this.closeSettingsModal();
        });

        document.getElementById('addStatusBtn').addEventListener('click', () => {
            this.addStatus();
        });

        // 確認モーダル
        document.getElementById('confirmOk').addEventListener('click', () => {
            this.confirmCallback();
            this.closeConfirmModal();
        });

        document.getElementById('confirmCancel').addEventListener('click', () => {
            this.closeConfirmModal();
        });

        // モーダル外クリックで閉じる
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // ドラッグ＆ドロップの設定
    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.remove('dragging');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const columnContent = e.target.closest('.column-content');
            if (columnContent) {
                columnContent.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const columnContent = e.target.closest('.column-content');
            if (columnContent && !columnContent.contains(e.relatedTarget)) {
                columnContent.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const columnContent = e.target.closest('.column-content');
            if (columnContent) {
                columnContent.classList.remove('drag-over');
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = columnContent.dataset.status;
                this.moveTask(taskId, newStatus);
            }
        });
    }

    // タスクの移動
    moveTask(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            task.statusChangedAt = new Date().toISOString();
            this.saveData();
            this.renderTasks();
        }
    }

    // タスクの表示
    renderTasks() {
        // 各ステータス列をクリア
        this.statuses.forEach(status => {
            const column = document.querySelector(`[data-status="${status}"]`);
            if (column) {
                const content = column.querySelector('.column-content');
                if (content) {
                    content.innerHTML = '';
                }
            }
        });

        // ボード列を再構築
        this.renderColumns();

        // フィルタリングされたタスクを表示
        const filteredTasks = this.getFilteredTasks();
        
        filteredTasks.forEach(task => {
            const taskCard = this.createTaskCard(task);
            const column = document.querySelector(`[data-status="${task.status}"] .column-content`);
            if (column) {
                column.appendChild(taskCard);
            }
        });

        // タスク数の更新
        this.updateTaskCounts();
    }

    // ボード列の再構築
    renderColumns() {
        const boardColumns = document.getElementById('boardColumns');
        boardColumns.innerHTML = '';

        this.statuses.forEach(status => {
            const column = document.createElement('div');
            column.className = 'column';
            column.setAttribute('data-status', status);
            
            column.innerHTML = `
                <div class="column-header">
                    <h2>${status}</h2>
                    <span class="task-count">0</span>
                </div>
                <div class="column-content" data-status="${status}"></div>
            `;
            
            boardColumns.appendChild(column);
        });
    }

    // タスクカードの作成
    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('data-task-id', task.id);
        card.draggable = true;

        // 締切の警告スタイル
        const now = new Date();
        const deadline = new Date(task.deadline);
        const timeDiff = deadline - now;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (task.deadline && timeDiff < 0) {
            card.classList.add('overdue');
        } else if (task.deadline && daysDiff <= 1) {
            card.classList.add('due-soon');
        }

        const tagsHtml = task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('');
        
        const deadlineHtml = task.deadline ? `
            <div class="task-deadline ${timeDiff < 0 ? 'overdue' : daysDiff <= 1 ? 'due-soon' : ''}">
                ⏰ ${this.formatDateTime(task.deadline)}
            </div>
        ` : '';

        card.innerHTML = `
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            ${task.detail ? `<div class="task-detail">${this.escapeHtml(task.detail)}</div>` : ''}
            <div class="task-meta">
                ${deadlineHtml}
                ${task.tags.length > 0 ? `<div class="task-tags">${tagsHtml}</div>` : ''}
                <div class="task-dates">
                    作成: ${this.formatDateTime(task.createdAt)}
                    ${task.statusChangedAt ? `<br>更新: ${this.formatDateTime(task.statusChangedAt)}` : ''}
                </div>
            </div>
        `;

        // クリックイベント
        card.addEventListener('click', () => {
            this.openTaskModal(task);
        });

        return card;
    }

    // タスクの作成/編集
    openTaskModal(task = null) {
        this.currentEditingTask = task;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const deleteBtn = document.getElementById('deleteTaskBtn');
        const modalTitle = document.getElementById('modalTitle');

        // フォームのリセット
        form.reset();

        // ステータス選択肢の更新
        const statusSelect = document.getElementById('taskStatus');
        statusSelect.innerHTML = '';
        this.statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });

        if (task) {
            // 編集モード
            modalTitle.textContent = 'タスク編集';
            deleteBtn.style.display = 'block';
            
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDetail').value = task.detail || '';
            document.getElementById('taskDeadline').value = task.deadline || '';
            document.getElementById('taskTags').value = task.tags.join(', ');
            document.getElementById('taskStatus').value = task.status;
        } else {
            // 新規作成モード
            modalTitle.textContent = 'タスク追加';
            deleteBtn.style.display = 'none';
            document.getElementById('taskStatus').value = '未着手';
        }

        modal.style.display = 'block';
    }

    // タスクモーダルを閉じる
    closeTaskModal() {
        document.getElementById('taskModal').style.display = 'none';
        this.currentEditingTask = null;
    }

    // タスクの保存
    saveTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const detail = document.getElementById('taskDetail').value.trim();
        const deadline = document.getElementById('taskDeadline').value;
        const tags = document.getElementById('taskTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const status = document.getElementById('taskStatus').value;

        if (!title) {
            alert('タイトルは必須です。');
            return;
        }

        const now = new Date().toISOString();

        if (this.currentEditingTask) {
            // 編集
            const task = this.currentEditingTask;
            const oldStatus = task.status;
            
            task.title = title;
            task.detail = detail;
            task.deadline = deadline;
            task.tags = tags;
            task.status = status;
            
            if (oldStatus !== status) {
                task.statusChangedAt = now;
            }
        } else {
            // 新規作成
            const task = {
                id: this.generateId(),
                title: title,
                detail: detail,
                deadline: deadline,
                tags: tags,
                status: status,
                createdAt: now,
                statusChangedAt: now
            };
            
            this.tasks.push(task);
        }

        this.saveData();
        this.renderTasks();
        this.updateTagFilter();
        this.closeTaskModal();
    }

    // タスクの削除
    deleteTask() {
        if (!this.currentEditingTask) return;

        this.showConfirmModal(`「${this.currentEditingTask.title}」を削除しますか？`, () => {
            this.tasks = this.tasks.filter(task => task.id !== this.currentEditingTask.id);
            this.saveData();
            this.renderTasks();
            this.updateTagFilter();
            this.closeTaskModal();
        });
    }

    // 設定モーダルを開く
    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        this.renderStatusList();
        modal.style.display = 'block';
    }

    // 設定モーダルを閉じる
    closeSettingsModal() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    // ステータスリストの表示
    renderStatusList() {
        const statusList = document.getElementById('statusList');
        statusList.innerHTML = '';

        const defaultStatuses = ['未着手', '進行中', '完了'];

        this.statuses.forEach(status => {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            
            if (defaultStatuses.includes(status)) {
                statusItem.classList.add('default');
            }

            statusItem.innerHTML = `
                <span class="status-name">${status}</span>
                <div class="status-actions">
                    ${!defaultStatuses.includes(status) ? `<button class="btn btn-danger btn-small" onclick="taskManager.removeStatus('${status}')">削除</button>` : ''}
                </div>
            `;

            statusList.appendChild(statusItem);
        });
    }

    // ステータスの追加
    addStatus() {
        const input = document.getElementById('newStatusInput');
        const status = input.value.trim();

        if (!status) {
            alert('ステータス名を入力してください。');
            return;
        }

        if (this.statuses.includes(status)) {
            alert('そのステータスは既に存在します。');
            return;
        }

        this.statuses.push(status);
        input.value = '';
        this.saveData();
        this.renderStatusList();
        this.renderTasks();
    }

    // ステータスの削除
    removeStatus(status) {
        if (['未着手', '進行中', '完了'].includes(status)) {
            alert('デフォルトのステータスは削除できません。');
            return;
        }

        this.showConfirmModal(`ステータス「${status}」を削除しますか？\nこのステータスのタスクは「未着手」に移動されます。`, () => {
            // そのステータスのタスクを「未着手」に移動
            this.tasks.forEach(task => {
                if (task.status === status) {
                    task.status = '未着手';
                    task.statusChangedAt = new Date().toISOString();
                }
            });

            this.statuses = this.statuses.filter(s => s !== status);
            this.saveData();
            this.renderStatusList();
            this.renderTasks();
        });
    }

    // フィルタリング
    getFilteredTasks() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const tagFilter = document.getElementById('tagFilter').value;

        return this.tasks.filter(task => {
            const matchesSearch = !searchTerm || 
                task.title.toLowerCase().includes(searchTerm) ||
                (task.detail && task.detail.toLowerCase().includes(searchTerm)) ||
                task.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            const matchesTag = !tagFilter || task.tags.includes(tagFilter);

            return matchesSearch && matchesTag;
        });
    }

    // タスクフィルタリング
    filterTasks() {
        this.renderTasks();
    }

    // タグフィルターの更新
    updateTagFilter() {
        const tagFilter = document.getElementById('tagFilter');
        const currentValue = tagFilter.value;
        
        tagFilter.innerHTML = '<option value="">すべてのタグ</option>';
        
        const allTags = [...new Set(this.tasks.flatMap(task => task.tags))].sort();
        allTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });

        tagFilter.value = currentValue;
    }

    // タスク数の更新
    updateTaskCounts() {
        this.statuses.forEach(status => {
            const column = document.querySelector(`[data-status="${status}"]`);
            if (column) {
                const count = this.getFilteredTasks().filter(task => task.status === status).length;
                const countElement = column.querySelector('.task-count');
                if (countElement) {
                    countElement.textContent = count;
                }
            }
        });
    }

    // CSV出力
    exportCSV() {
        const headers = ['タスクID', 'タイトル', '詳細', '締切日時', '作成日時', '進捗ステータス', '進捗状況を切り替えた日時', 'タグ'];
        const rows = [headers];

        this.tasks.forEach(task => {
            rows.push([
                task.id,
                task.title,
                task.detail || '',
                task.deadline || '',
                task.createdAt,
                task.status,
                task.statusChangedAt || '',
                task.tags.join(';')
            ]);
        });

        const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    // CSV読込
    importCSV(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
            
            let importedCount = 0;
            let skippedCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = line.split(',').map(v => v.replace(/"/g, ''));
                
                try {
                    const task = {
                        id: values[0] || this.generateId(),
                        title: values[1],
                        detail: values[2] || '',
                        deadline: values[3] || '',
                        createdAt: values[4] || new Date().toISOString(),
                        status: values[5] || '未着手',
                        statusChangedAt: values[6] || '',
                        tags: values[7] ? values[7].split(';') : []
                    };

                    // 必須項目チェック
                    if (!task.title) {
                        skippedCount++;
                        continue;
                    }

                    // 日付フォーマットチェック
                    if (task.deadline && isNaN(new Date(task.deadline).getTime())) {
                        skippedCount++;
                        continue;
                    }

                    // 存在しないステータスは「未着手」に
                    if (!this.statuses.includes(task.status)) {
                        task.status = '未着手';
                    }

                    // 既存タスクのチェック
                    const existingIndex = this.tasks.findIndex(t => t.id === task.id);
                    if (existingIndex !== -1) {
                        this.tasks[existingIndex] = task;
                    } else {
                        this.tasks.push(task);
                    }

                    importedCount++;
                } catch (error) {
                    skippedCount++;
                }
            }

            this.saveData();
            this.renderTasks();
            this.updateTagFilter();
            
            alert(`CSV読込完了\n読込件数: ${importedCount}\nスキップ件数: ${skippedCount}`);
        };

        reader.readAsText(file);
    }

    // リマインダーのチェック
    checkReminders() {
        const now = new Date();
        
        this.tasks.forEach(task => {
            if (!task.deadline || this.reminderShown.has(task.id)) return;
            
            const deadline = new Date(task.deadline);
            const timeDiff = deadline - now;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // 24時間前から24時間後の範囲でリマインダー
            if (hoursDiff <= 24 && hoursDiff >= -24) {
                this.reminderShown.add(task.id);
                alert(`リマインダー: 「${task.title}」の締切が近づいています。\n締切: ${this.formatDateTime(task.deadline)}`);
            }
        });
    }

    // 確認モーダル
    showConfirmModal(message, callback) {
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'block';
        this.confirmCallback = callback;
    }

    // 確認モーダルを閉じる
    closeConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.confirmCallback = null;
    }

    // ユーティリティメソッド
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// アプリケーションの初期化
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});