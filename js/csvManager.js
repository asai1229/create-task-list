// CSV管理モジュール
class CSVManager {
    constructor() {
        this.headers = [
            'タスクID', 'タイトル', '詳細', '締切日時', 
            '作成日時', '進捗ステータス', '進捗状況を切り替えた日時', 'タグ'
        ];
    }

    // CSVエクスポート
    exportTasks(tasks) {
        if (!Array.isArray(tasks)) {
            throw new Error('タスクデータが不正です');
        }

        const rows = [this.headers];

        tasks.forEach(task => {
            rows.push([
                task.id || '',
                task.title || '',
                task.detail || '',
                task.deadline || '',
                task.createdAt || '',
                task.status || '',
                task.statusChangedAt || '',
                Array.isArray(task.tags) ? task.tags.join(';') : ''
            ]);
        });

        return this.convertToCSV(rows);
    }

    // CSVインポート
    importTasks(csvContent, existingTasks = [], availableStatuses = ['未着手', '進行中', '完了']) {
        const result = {
            imported: [],
            skipped: [],
            errors: [],
            summary: {
                totalRows: 0,
                importedCount: 0,
                skippedCount: 0,
                errorCount: 0
            }
        };

        try {
            const lines = this.parseCSV(csvContent);
            
            if (lines.length === 0) {
                throw new Error('CSVファイルが空です');
            }

            // ヘッダー行をスキップ
            const dataLines = lines.slice(1);
            result.summary.totalRows = dataLines.length;

            dataLines.forEach((line, index) => {
                const lineNumber = index + 2; // ヘッダーを考慮した行番号
                
                try {
                    const task = this.parseTaskFromCSVLine(line, availableStatuses);
                    
                    if (this.validateTask(task)) {
                        // 既存タスクのチェック
                        const existingIndex = existingTasks.findIndex(t => t.id === task.id);
                        
                        if (existingIndex !== -1) {
                            // 既存タスクを更新
                            existingTasks[existingIndex] = task;
                        } else {
                            // 新規タスクを追加
                            existingTasks.push(task);
                        }
                        
                        result.imported.push(task);
                        result.summary.importedCount++;
                    } else {
                        result.skipped.push({
                            line: lineNumber,
                            reason: '必須項目が未入力です',
                            data: line
                        });
                        result.summary.skippedCount++;
                    }
                } catch (error) {
                    result.errors.push({
                        line: lineNumber,
                        error: error.message,
                        data: line
                    });
                    result.summary.errorCount++;
                }
            });

        } catch (error) {
            result.errors.push({
                line: 0,
                error: error.message,
                data: null
            });
            result.summary.errorCount++;
        }

        return result;
    }

    // CSVライン解析
    parseTaskFromCSVLine(line, availableStatuses) {
        if (!Array.isArray(line) || line.length < 8) {
            throw new Error('CSV行のフォーマットが不正です');
        }

        const [id, title, detail, deadline, createdAt, status, statusChangedAt, tags] = line;

        // 必須項目チェック
        if (!title || !title.trim()) {
            throw new Error('タイトルが空です');
        }

        // 日付フォーマットチェック
        if (deadline && !this.isValidDate(deadline)) {
            throw new Error('締切日時のフォーマットが不正です');
        }

        if (createdAt && !this.isValidDate(createdAt)) {
            throw new Error('作成日時のフォーマットが不正です');
        }

        if (statusChangedAt && !this.isValidDate(statusChangedAt)) {
            throw new Error('ステータス変更日時のフォーマットが不正です');
        }

        // ステータスの確認・調整
        let validStatus = status;
        if (!availableStatuses.includes(status)) {
            validStatus = '未着手';
        }

        // タグの処理
        const taskTags = tags ? tags.split(';').map(tag => tag.trim()).filter(tag => tag) : [];

        return {
            id: id || this.generateId(),
            title: title.trim(),
            detail: detail ? detail.trim() : '',
            deadline: deadline || '',
            createdAt: createdAt || new Date().toISOString(),
            status: validStatus,
            statusChangedAt: statusChangedAt || new Date().toISOString(),
            tags: taskTags
        };
    }

    // タスクの検証
    validateTask(task) {
        return task.title && task.title.trim().length > 0;
    }

    // 日付の検証
    isValidDate(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    // CSV文字列の解析
    parseCSV(csvContent) {
        const lines = [];
        const rows = csvContent.split('\n');
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) continue;
            
            const columns = this.parseCSVRow(row);
            lines.push(columns);
        }
        
        return lines;
    }

    // CSV行の解析
    parseCSVRow(row) {
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                if (inQuotes && row[i + 1] === '"') {
                    // エスケープされた引用符
                    current += '"';
                    i++; // 次の文字をスキップ
                } else {
                    // 引用符の開始/終了
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 区切り文字
                columns.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // 最後の列を追加
        columns.push(current);
        
        return columns;
    }

    // 配列をCSV文字列に変換
    convertToCSV(rows) {
        return rows.map(row => 
            row.map(cell => {
                const str = String(cell);
                // 特殊文字を含む場合は引用符で囲む
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        ).join('\n');
    }

    // CSVファイルのダウンロード
    downloadCSV(csvContent, filename = null) {
        const defaultFilename = `tasks_${new Date().toISOString().split('T')[0]}.csv`;
        const finalFilename = filename || defaultFilename;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = finalFilename;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return true;
        }
        
        return false;
    }

    // ファイルの読み込み
    readFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('ファイルが選択されていません'));
                return;
            }
            
            if (!file.name.toLowerCase().endsWith('.csv')) {
                reject(new Error('CSVファイルを選択してください'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    resolve(e.target.result);
                } catch (error) {
                    reject(new Error('ファイルの読み込みに失敗しました'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('ファイルの読み込み中にエラーが発生しました'));
            };
            
            reader.readAsText(file, 'UTF-8');
        });
    }

    // ID生成
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // インポート結果のメッセージ生成
    generateImportMessage(result) {
        let message = `CSV読込完了\n`;
        message += `処理件数: ${result.summary.totalRows}\n`;
        message += `読込件数: ${result.summary.importedCount}\n`;
        message += `スキップ件数: ${result.summary.skippedCount}\n`;
        message += `エラー件数: ${result.summary.errorCount}`;
        
        if (result.errors.length > 0) {
            message += '\n\nエラー詳細:\n';
            result.errors.slice(0, 3).forEach(error => {
                message += `行 ${error.line}: ${error.error}\n`;
            });
            if (result.errors.length > 3) {
                message += `他 ${result.errors.length - 3} 件のエラー`;
            }
        }
        
        return message;
    }
}