// 設定管理モジュール
class SettingsManager {
    constructor() {
        this.statuses = ['未着手', '進行中', '完了'];
        this.defaultStatuses = ['未着手', '進行中', '完了'];
        this.onStatusChange = null;
    }

    // 設定管理の初期化
    init(initialStatuses = ['未着手', '進行中', '完了'], onStatusChange = null) {
        this.statuses = [...initialStatuses];
        this.onStatusChange = onStatusChange;
        this.setupEventListeners();
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // ステータス追加ボタン
        const addStatusBtn = document.getElementById('addStatusBtn');
        if (addStatusBtn) {
            addStatusBtn.addEventListener('click', () => {
                this.addStatus();
            });
        }

        // 新しいステータス入力でEnterキー
        const newStatusInput = document.getElementById('newStatusInput');
        if (newStatusInput) {
            newStatusInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addStatus();
                }
            });
        }

        // ステータス削除ボタン（動的に追加される要素）
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-status]') && e.target.textContent === '削除') {
                const status = e.target.dataset.status;
                this.removeStatus(status);
            }
        });
    }

    // ステータス一覧の取得
    getStatuses() {
        return [...this.statuses];
    }

    // ステータスの設定
    setStatuses(statuses) {
        this.statuses = [...statuses];
        if (this.onStatusChange) {
            this.onStatusChange(this.statuses);
        }
    }

    // ステータスの追加
    addStatus() {
        const input = document.getElementById('newStatusInput');
        if (!input) return false;

        const newStatus = input.value.trim();
        
        if (!newStatus) {
            alert('ステータス名を入力してください。');
            return false;
        }

        if (this.statuses.includes(newStatus)) {
            alert('そのステータスは既に存在します。');
            return false;
        }

        if (newStatus.length > 20) {
            alert('ステータス名は20文字以内で入力してください。');
            return false;
        }

        this.statuses.push(newStatus);
        input.value = '';
        
        this.renderStatusList();
        
        if (this.onStatusChange) {
            this.onStatusChange(this.statuses);
        }
        
        return true;
    }

    // ステータスの削除
    removeStatus(status) {
        if (this.defaultStatuses.includes(status)) {
            alert('デフォルトのステータスは削除できません。');
            return false;
        }

        const index = this.statuses.indexOf(status);
        if (index === -1) {
            return false;
        }

        // 確認メッセージ
        const message = `ステータス「${status}」を削除しますか？\nこのステータスのタスクは「未着手」に移動されます。`;
        
        if (confirm(message)) {
            this.statuses.splice(index, 1);
            this.renderStatusList();
            
            if (this.onStatusChange) {
                this.onStatusChange(this.statuses, status);
            }
            
            return true;
        }
        
        return false;
    }

    // ステータスの並び替え
    reorderStatuses(newOrder) {
        if (!Array.isArray(newOrder)) return false;
        
        // 全てのステータスが含まれているかチェック
        const isValid = newOrder.length === this.statuses.length &&
                        newOrder.every(status => this.statuses.includes(status));
        
        if (!isValid) return false;
        
        this.statuses = [...newOrder];
        this.renderStatusList();
        
        if (this.onStatusChange) {
            this.onStatusChange(this.statuses);
        }
        
        return true;
    }

    // ステータスの名前変更
    renameStatus(oldName, newName) {
        const index = this.statuses.indexOf(oldName);
        if (index === -1) return false;
        
        if (this.statuses.includes(newName)) {
            alert('そのステータス名は既に存在します。');
            return false;
        }
        
        if (newName.length > 20) {
            alert('ステータス名は20文字以内で入力してください。');
            return false;
        }
        
        this.statuses[index] = newName;
        this.renderStatusList();
        
        if (this.onStatusChange) {
            this.onStatusChange(this.statuses, oldName, newName);
        }
        
        return true;
    }

    // ステータスリストの描画
    renderStatusList() {
        const statusList = document.getElementById('statusList');
        if (!statusList) return;

        statusList.innerHTML = '';

        this.statuses.forEach((status, index) => {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            statusItem.draggable = true;
            statusItem.dataset.status = status;
            statusItem.dataset.index = index;
            
            if (this.defaultStatuses.includes(status)) {
                statusItem.classList.add('default');
            }

            const isEditable = !this.defaultStatuses.includes(status);
            
            statusItem.innerHTML = `
                <div class="status-drag-handle">≡</div>
                <span class="status-name" ${isEditable ? 'contenteditable="true"' : ''}>${status}</span>
                <div class="status-actions">
                    ${isEditable ? `
                        <button class="btn btn-danger btn-small" data-status="${status}">削除</button>
                    ` : ''}
                </div>
            `;

            // 編集可能な場合のイベントリスナー
            if (isEditable) {
                const nameElement = statusItem.querySelector('.status-name');
                nameElement.addEventListener('blur', () => {
                    const newName = nameElement.textContent.trim();
                    if (newName !== status && newName) {
                        if (this.renameStatus(status, newName)) {
                            // 成功時は何もしない（renderStatusListで再描画される）
                        } else {
                            // 失敗時は元の名前に戻す
                            nameElement.textContent = status;
                        }
                    }
                });

                nameElement.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        nameElement.blur();
                    }
                });
            }

            statusList.appendChild(statusItem);
        });

        // ドラッグ&ドロップ機能の設定
        this.setupDragAndDrop();
    }

    // ドラッグ&ドロップ機能の設定
    setupDragAndDrop() {
        const statusList = document.getElementById('statusList');
        if (!statusList) return;

        let draggedElement = null;

        statusList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('status-item')) {
                draggedElement = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });

        statusList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('status-item')) {
                e.target.classList.remove('dragging');
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
                const newOrder = Array.from(statusList.children).map(item => item.dataset.status);
                this.reorderStatuses(newOrder);
                draggedElement = null;
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

    // 設定の検証
    validateSettings() {
        const errors = [];
        
        // 必須ステータスの確認
        this.defaultStatuses.forEach(status => {
            if (!this.statuses.includes(status)) {
                errors.push(`必須ステータス「${status}」が見つかりません`);
            }
        });
        
        // 重複チェック
        const uniqueStatuses = new Set(this.statuses);
        if (uniqueStatuses.size !== this.statuses.length) {
            errors.push('重複するステータスが存在します');
        }
        
        // 空のステータスチェック
        if (this.statuses.some(status => !status || !status.trim())) {
            errors.push('空のステータスが存在します');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // 設定のリセット
    resetSettings() {
        if (confirm('設定をリセットしますか？\nカスタムステータスはすべて削除されます。')) {
            this.statuses = [...this.defaultStatuses];
            this.renderStatusList();
            
            if (this.onStatusChange) {
                this.onStatusChange(this.statuses);
            }
            
            return true;
        }
        
        return false;
    }

    // 設定のエクスポート
    exportSettings() {
        const settings = {
            statuses: this.statuses,
            version: '1.0',
            exportDate: new Date().toISOString()
        };
        
        return JSON.stringify(settings, null, 2);
    }

    // 設定のインポート
    importSettings(settingsString) {
        try {
            const settings = JSON.parse(settingsString);
            
            if (!settings.statuses || !Array.isArray(settings.statuses)) {
                throw new Error('設定データが不正です');
            }
            
            // 必須ステータスの確認
            const hasRequiredStatuses = this.defaultStatuses.every(status => 
                settings.statuses.includes(status)
            );
            
            if (!hasRequiredStatuses) {
                throw new Error('必須ステータスが不足しています');
            }
            
            this.statuses = [...settings.statuses];
            this.renderStatusList();
            
            if (this.onStatusChange) {
                this.onStatusChange(this.statuses);
            }
            
            return {
                success: true,
                message: '設定のインポートが完了しました'
            };
            
        } catch (error) {
            return {
                success: false,
                message: `設定のインポートに失敗しました: ${error.message}`
            };
        }
    }

    // ステータスの色設定（将来の拡張用）
    setStatusColor(status, color) {
        // 将来的にステータスに色を設定する機能
        // 現在は実装していないが、拡張の余地を残す
        return false;
    }

    // ステータスの並び順取得
    getStatusOrder() {
        return [...this.statuses];
    }

    // デフォルトステータス判定
    isDefaultStatus(status) {
        return this.defaultStatuses.includes(status);
    }
}