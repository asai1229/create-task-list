// タスク管理モジュール
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentEditingTask = null;
    }

    // タスクの作成
    createTask(taskData) {
        const now = new Date().toISOString();
        const task = {
            id: this.generateId(),
            title: taskData.title,
            detail: taskData.detail || '',
            deadline: taskData.deadline || '',
            tags: taskData.tags || [],
            status: taskData.status || '未着手',
            createdAt: now,
            statusChangedAt: now
        };
        
        this.tasks.push(task);
        return task;
    }

    // タスクの更新
    updateTask(taskId, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return null;

        const task = this.tasks[taskIndex];
        const oldStatus = task.status;
        const now = new Date().toISOString();

        task.title = taskData.title;
        task.detail = taskData.detail || '';
        task.deadline = taskData.deadline || '';
        task.tags = taskData.tags || [];
        task.status = taskData.status || task.status;

        if (oldStatus !== task.status) {
            task.statusChangedAt = now;
        }

        return task;
    }

    // タスクの削除
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return false;

        this.tasks.splice(taskIndex, 1);
        return true;
    }

    // タスクの取得
    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    }

    // 全タスクの取得
    getAllTasks() {
        return this.tasks;
    }

    // ステータス別タスクの取得
    getTasksByStatus(status) {
        return this.tasks.filter(task => task.status === status);
    }

    // タスクのステータス変更
    moveTask(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            task.statusChangedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    // タスクの検索
    searchTasks(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.tasks.filter(task => 
            task.title.toLowerCase().includes(term) ||
            (task.detail && task.detail.toLowerCase().includes(term)) ||
            task.tags.some(tag => tag.toLowerCase().includes(term))
        );
    }

    // タグフィルタリング
    filterTasksByTag(tagName) {
        if (!tagName) return this.tasks;
        return this.tasks.filter(task => task.tags.includes(tagName));
    }

    // 全タグの取得
    getAllTags() {
        return [...new Set(this.tasks.flatMap(task => task.tags))].sort();
    }

    // 締切が近いタスクの取得
    getTasksDueSoon() {
        const now = new Date();
        return this.tasks.filter(task => {
            if (!task.deadline) return false;
            const deadline = new Date(task.deadline);
            const timeDiff = deadline - now;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            return hoursDiff <= 24 && hoursDiff >= -24;
        });
    }

    // 期限切れタスクの取得
    getOverdueTasks() {
        const now = new Date();
        return this.tasks.filter(task => {
            if (!task.deadline) return false;
            const deadline = new Date(task.deadline);
            return deadline < now;
        });
    }

    // IDの生成
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // タスクデータの設定
    setTasks(tasks) {
        this.tasks = tasks;
    }

    // 現在編集中のタスクの設定
    setCurrentEditingTask(task) {
        this.currentEditingTask = task;
    }

    // 現在編集中のタスクの取得
    getCurrentEditingTask() {
        return this.currentEditingTask;
    }
}