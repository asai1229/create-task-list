// データ永続化モジュール
class DataManager {
    constructor() {
        this.storageKeys = {
            tasks: 'tasks',
            statuses: 'statuses'
        };
    }

    // タスクの保存
    saveTasks(tasks) {
        try {
            localStorage.setItem(this.storageKeys.tasks, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('タスクの保存に失敗しました:', error);
            return false;
        }
    }

    // タスクの読み込み
    loadTasks() {
        try {
            const savedTasks = localStorage.getItem(this.storageKeys.tasks);
            return savedTasks ? JSON.parse(savedTasks) : [];
        } catch (error) {
            console.error('タスクの読み込みに失敗しました:', error);
            return [];
        }
    }

    // ステータスの保存
    saveStatuses(statuses) {
        try {
            localStorage.setItem(this.storageKeys.statuses, JSON.stringify(statuses));
            return true;
        } catch (error) {
            console.error('ステータスの保存に失敗しました:', error);
            return false;
        }
    }

    // ステータスの読み込み
    loadStatuses() {
        try {
            const savedStatuses = localStorage.getItem(this.storageKeys.statuses);
            return savedStatuses ? JSON.parse(savedStatuses) : ['未着手', '進行中', '完了'];
        } catch (error) {
            console.error('ステータスの読み込みに失敗しました:', error);
            return ['未着手', '進行中', '完了'];
        }
    }

    // 全データの保存
    saveAll(tasks, statuses) {
        const tasksResult = this.saveTasks(tasks);
        const statusesResult = this.saveStatuses(statuses);
        return tasksResult && statusesResult;
    }

    // 全データの読み込み
    loadAll() {
        return {
            tasks: this.loadTasks(),
            statuses: this.loadStatuses()
        };
    }

    // データのクリア
    clearTasks() {
        try {
            localStorage.removeItem(this.storageKeys.tasks);
            return true;
        } catch (error) {
            console.error('タスクのクリアに失敗しました:', error);
            return false;
        }
    }

    clearStatuses() {
        try {
            localStorage.removeItem(this.storageKeys.statuses);
            return true;
        } catch (error) {
            console.error('ステータスのクリアに失敗しました:', error);
            return false;
        }
    }

    // 全データのクリア
    clearAll() {
        const tasksResult = this.clearTasks();
        const statusesResult = this.clearStatuses();
        return tasksResult && statusesResult;
    }

    // ストレージの使用量チェック
    getStorageUsage() {
        let totalSize = 0;
        
        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                }
            }
            return {
                used: totalSize,
                limit: 1024 * 1024 * 5, // 5MB (概算)
                percentage: (totalSize / (1024 * 1024 * 5)) * 100
            };
        } catch (error) {
            console.error('ストレージ使用量の取得に失敗しました:', error);
            return { used: 0, limit: 0, percentage: 0 };
        }
    }

    // データの検証
    validateTaskData(tasks) {
        if (!Array.isArray(tasks)) return false;
        
        return tasks.every(task => {
            return task.id && 
                   task.title && 
                   task.hasOwnProperty('detail') &&
                   task.hasOwnProperty('deadline') &&
                   Array.isArray(task.tags) &&
                   task.status &&
                   task.createdAt;
        });
    }

    validateStatusData(statuses) {
        if (!Array.isArray(statuses)) return false;
        
        const defaultStatuses = ['未着手', '進行中', '完了'];
        return defaultStatuses.every(status => statuses.includes(status));
    }

    // データのバックアップ
    exportBackup() {
        const data = this.loadAll();
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: data
        };
        
        return JSON.stringify(backup, null, 2);
    }

    // バックアップからのリストア
    importBackup(backupString) {
        try {
            const backup = JSON.parse(backupString);
            
            if (!backup.data || !backup.data.tasks || !backup.data.statuses) {
                throw new Error('無効なバックアップデータです');
            }
            
            if (!this.validateTaskData(backup.data.tasks) || 
                !this.validateStatusData(backup.data.statuses)) {
                throw new Error('バックアップデータの検証に失敗しました');
            }
            
            const result = this.saveAll(backup.data.tasks, backup.data.statuses);
            
            if (result) {
                return {
                    success: true,
                    message: 'バックアップからの復元が完了しました',
                    timestamp: backup.timestamp
                };
            } else {
                throw new Error('データの保存に失敗しました');
            }
            
        } catch (error) {
            return {
                success: false,
                message: `バックアップの復元に失敗しました: ${error.message}`
            };
        }
    }

    // ストレージの可用性チェック
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}