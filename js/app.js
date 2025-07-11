// メインアプリケーションモジュール
// メインアプリケーションクラス
class TaskApp {
    constructor() {
        this.taskManager = new TaskManager();
        this.dataManager = new DataManager();
        this.csvManager = new CSVManager();
        this.searchFilterManager = new SearchFilterManager();
        this.settingsManager = new SettingsManager();
        this.uiManager = new UIManager();
        this.modalManager = new ModalManager();
        this.dragDropManager = null;
        
        this.statuses = ['未着手', '進行中', '完了'];
        this.init();
    }

    // アプリケーションの初期化
    init() {
        this.loadData();
        this.setupManagers();
        this.setupEventListeners();
        this.render();
        this.uiManager.setupErrorBoundary();
    }

    // データの読み込み
    loadData() {
        const data = this.dataManager.loadAll();
        this.taskManager.setTasks(data.tasks);
        this.statuses = data.statuses;
        this.settingsManager.setStatuses(this.statuses);
    }

    // マネージャーの設定
    setupManagers() {
        // ドラッグ&ドロップマネージャー
        this.dragDropManager = new DragDropManager((taskId, newStatus) => {
            this.moveTask(taskId, newStatus);
        });

        // 検索・フィルターマネージャー
        this.searchFilterManager.setupSearchAndFilter(() => {
            this.render();
        });

        // 設定マネージャー
        this.settingsManager.init(this.statuses, (statuses, removedStatus, renamedFromStatus) => {
            this.handleStatusChange(statuses, removedStatus, renamedFromStatus);
        });

        // モーダルマネージャー
        this.modalManager.setupTaskModal(
            () => this.saveTask(),
            () => this.deleteTask(),
            () => this.modalManager.closeModal('taskModal')
        );

        this.modalManager.setupSettingsModal(() => {
            this.modalManager.closeModal('settingsModal');
        });

        // ステータス順序変更のコールバック設定
        this.modalManager.setStatusReorderCallback((newOrder) => {
            this.settingsManager.reorderStatuses(newOrder);
        });
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // タスク追加ボタン
        document.getElementById('addTaskBtn')?.addEventListener('click', () => {
            this.openTaskModal();
        });

        // 設定ボタン
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.openSettingsModal();
        });

        // CSV出力ボタン
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportCSV();
        });

        // CSV読込ボタン
        document.getElementById('importBtn')?.addEventListener('click', () => {
            document.getElementById('importFile')?.click();
        });

        // ファイル選択
        document.getElementById('importFile')?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.importCSV(e.target.files[0]);
            }
        });

        // タスクカードクリック（イベント委譲）
        document.addEventListener('click', (e) => {
            const taskCard = e.target.closest('.task-card');
            if (taskCard) {
                const taskId = taskCard.dataset.taskId;
                const task = this.taskManager.getTask(taskId);
                if (task) {
                    this.openTaskModal(task);
                }
            }
        });

        // キーボードショートカット
        this.uiManager.setupKeyboardShortcuts({
            'n': () => this.openTaskModal(),
            's': () => this.openSettingsModal(),
            'e': () => this.exportCSV(),
            'f': () => this.uiManager.focusElement('#searchInput')
        });
    }

    // 描画
    render() {
        const allTasks = this.taskManager.getAllTasks();
        const filteredTasks = this.searchFilterManager.filterTasks(allTasks);
        
        this.uiManager.renderTasks(filteredTasks, this.statuses);
        this.uiManager.updateTagFilter(this.taskManager.getAllTags());
        
        // 空の状態チェック
        if (allTasks.length === 0) {
            this.uiManager.showEmptyState('タスクを追加して始めましょう');
        } else if (filteredTasks.length === 0) {
            this.uiManager.showEmptyState('該当するタスクがありません');
        } else {
            this.uiManager.hideEmptyState();
        }
    }

    // タスクモーダルを開く
    openTaskModal(task = null) {
        this.taskManager.setCurrentEditingTask(task);
        this.modalManager.showTaskModal(task, this.statuses);
    }

    // タスクの保存
    saveTask() {
        if (!this.modalManager.validateTaskForm()) {
            return;
        }

        const formData = this.modalManager.getTaskFormData();
        const currentTask = this.taskManager.getCurrentEditingTask();

        if (currentTask) {
            // 編集
            this.taskManager.updateTask(currentTask.id, formData);
        } else {
            // 新規作成
            this.taskManager.createTask(formData);
        }

        this.saveData();
        this.render();
        this.modalManager.closeModal('taskModal');
        
        this.uiManager.showSuccessMessage('タスクを保存しました');
    }

    // タスクの削除
    deleteTask() {
        const currentTask = this.taskManager.getCurrentEditingTask();
        if (!currentTask) return;

        this.modalManager.showConfirmModal(
            `「${currentTask.title}」を削除しますか？`,
            () => {
                this.taskManager.deleteTask(currentTask.id);
                this.saveData();
                this.render();
                        this.modalManager.closeModal('taskModal');
                this.uiManager.showSuccessMessage('タスクを削除しました');
            }
        );
    }

    // タスクの移動
    moveTask(taskId, newStatus) {
        if (this.taskManager.moveTask(taskId, newStatus)) {
            this.saveData();
            this.render();
            }
    }

    // 設定モーダルを開く
    openSettingsModal() {
        this.modalManager.showSettingsModal(this.statuses);
    }

    // ステータス変更の処理
    handleStatusChange(statuses, removedStatus, renamedFromStatus) {
        this.statuses = statuses;
        
        // 削除されたステータスのタスクを「未着手」に移動
        if (removedStatus) {
            const tasks = this.taskManager.getAllTasks();
            tasks.forEach(task => {
                if (task.status === removedStatus) {
                    this.taskManager.moveTask(task.id, '未着手');
                }
            });
        }

        // 名前変更されたステータスのタスクを更新
        if (renamedFromStatus) {
            const tasks = this.taskManager.getAllTasks();
            tasks.forEach(task => {
                if (task.status === renamedFromStatus) {
                    const newStatus = statuses.find(s => s !== renamedFromStatus);
                    if (newStatus) {
                        this.taskManager.moveTask(task.id, newStatus);
                    }
                }
            });
        }

        this.saveData();
        this.render();
    }

    // CSV出力
    exportCSV() {
        try {
            const tasks = this.taskManager.getAllTasks();
            const csvContent = this.csvManager.exportTasks(tasks);
            
            if (this.csvManager.downloadCSV(csvContent)) {
                this.uiManager.showSuccessMessage('CSVファイルをエクスポートしました');
            } else {
                this.uiManager.showErrorMessage('CSVファイルのダウンロードに失敗しました');
            }
        } catch (error) {
            console.error('CSV export error:', error);
            this.uiManager.showErrorMessage('CSV出力中にエラーが発生しました');
        }
    }

    // CSV読込
    async importCSV(file) {
        try {
            this.uiManager.showLoading('CSVファイルを読み込み中...');
            
            const csvContent = await this.csvManager.readFile(file);
            const tasks = this.taskManager.getAllTasks();
            const result = this.csvManager.importTasks(csvContent, tasks, this.statuses);
            
            this.taskManager.setTasks(tasks);
            this.saveData();
            this.render();
                
            const message = this.csvManager.generateImportMessage(result);
            this.uiManager.showInfoMessage(message, 5000);
            
        } catch (error) {
            console.error('CSV import error:', error);
            this.uiManager.showErrorMessage(`CSV読込エラー: ${error.message}`);
        } finally {
            this.uiManager.hideLoading();
        }
    }

    // データの保存
    saveData() {
        const tasks = this.taskManager.getAllTasks();
        this.dataManager.saveAll(tasks, this.statuses);
    }



    // アプリケーションの終了処理
    destroy() {
        // 他のクリーンアップ処理
    }
}

// アプリケーションの起動
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TaskApp();
});

// グローバルにアプリケーションインスタンスを公開（デバッグ用）
window.taskApp = app;