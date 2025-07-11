// UI管理モジュール
class UIManager {
    constructor() {
        this.currentFilters = {
            searchTerm: '',
            tagFilter: ''
        };
    }

    // ボード列の描画
    renderColumns(statuses) {
        const boardColumns = document.getElementById('boardColumns');
        if (!boardColumns) return;

        boardColumns.innerHTML = '';

        statuses.forEach(status => {
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

    // タスクの描画
    renderTasks(tasks, statuses) {
        // 各ステータス列をクリア
        statuses.forEach(status => {
            const columnContent = document.querySelector(`[data-status="${status}"] .column-content`);
            if (columnContent) {
                columnContent.innerHTML = '';
            }
        });

        // ボード列を再構築
        this.renderColumns(statuses);

        // タスクカードを作成して配置
        tasks.forEach(task => {
            const taskCard = this.createTaskCard(task);
            const columnContent = document.querySelector(`[data-status="${task.status}"] .column-content`);
            if (columnContent) {
                columnContent.appendChild(taskCard);
            }
        });

        // タスク数の更新
        this.updateTaskCounts(tasks, statuses);
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

        const tagsHtml = task.tags.map(tag => `<span class="task-tag">${this.escapeHtml(tag)}</span>`).join('');
        
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

        return card;
    }

    // タスク数の更新
    updateTaskCounts(tasks, statuses) {
        statuses.forEach(status => {
            const column = document.querySelector(`[data-status="${status}"]`);
            if (column) {
                const count = tasks.filter(task => task.status === status).length;
                const countElement = column.querySelector('.task-count');
                if (countElement) {
                    countElement.textContent = count;
                }
            }
        });
    }

    // タグフィルターの更新
    updateTagFilter(allTags, selectedTag = '') {
        const tagFilter = document.getElementById('tagFilter');
        if (!tagFilter) return;

        const currentValue = selectedTag || tagFilter.value;
        
        tagFilter.innerHTML = '<option value="">すべてのタグ</option>';
        
        allTags.sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            if (tag === currentValue) {
                option.selected = true;
            }
            tagFilter.appendChild(option);
        });
    }

    // 検索フィールドの取得
    getSearchTerm() {
        const searchInput = document.getElementById('searchInput');
        return searchInput ? searchInput.value.trim() : '';
    }

    // タグフィルターの取得
    getTagFilter() {
        const tagFilter = document.getElementById('tagFilter');
        return tagFilter ? tagFilter.value : '';
    }

    // 検索フィールドのクリア
    clearSearchAndFilter() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const tagFilter = document.getElementById('tagFilter');
        if (tagFilter) {
            tagFilter.value = '';
        }
    }

    // ローディング表示
    showLoading(message = '読み込み中...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading';
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
    }

    // ローディング非表示
    hideLoading() {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // 成功メッセージの表示
    showSuccessMessage(message, duration = 3000) {
        this.showMessage(message, 'success', duration);
    }

    // エラーメッセージの表示
    showErrorMessage(message, duration = 5000) {
        this.showMessage(message, 'error', duration);
    }

    // 情報メッセージの表示
    showInfoMessage(message, duration = 3000) {
        this.showMessage(message, 'info', duration);
    }

    // メッセージの表示
    showMessage(message, type = 'info', duration = 3000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // 既存のメッセージを削除
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        document.body.appendChild(messageDiv);
        
        // 自動で消去
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, duration);
    }

    // アニメーション付きでタスクカードを追加
    addTaskCardWithAnimation(task, status) {
        const taskCard = this.createTaskCard(task);
        const columnContent = document.querySelector(`[data-status="${status}"] .column-content`);
        
        if (columnContent) {
            taskCard.style.opacity = '0';
            taskCard.style.transform = 'translateY(-20px)';
            columnContent.appendChild(taskCard);
            
            // アニメーション
            setTimeout(() => {
                taskCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                taskCard.style.opacity = '1';
                taskCard.style.transform = 'translateY(0)';
            }, 10);
        }
    }

    // アニメーション付きでタスクカードを削除
    removeTaskCardWithAnimation(taskId) {
        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskCard) {
            taskCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            taskCard.style.opacity = '0';
            taskCard.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                if (taskCard.parentNode) {
                    taskCard.remove();
                }
            }, 300);
        }
    }

    // 空の状態メッセージの表示
    showEmptyState(message = 'タスクがありません') {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.innerHTML = `
            <div class="empty-icon">📝</div>
            <div class="empty-message">${message}</div>
        `;
        
        const boardColumns = document.getElementById('boardColumns');
        if (boardColumns) {
            boardColumns.appendChild(emptyDiv);
        }
    }

    // 空の状態メッセージの非表示
    hideEmptyState() {
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
    }

    // レスポンシブチェック
    isMobile() {
        return window.innerWidth <= 768;
    }

    // スクロール位置の保存
    saveScrollPosition() {
        return {
            x: window.pageXOffset,
            y: window.pageYOffset
        };
    }

    // スクロール位置の復元
    restoreScrollPosition(position) {
        window.scrollTo(position.x, position.y);
    }

    // 日付のフォーマット
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

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // キーボードショートカットの設定
    setupKeyboardShortcuts(shortcuts) {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + キーの組み合わせ
            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toLowerCase();
                if (shortcuts[key]) {
                    e.preventDefault();
                    shortcuts[key]();
                }
            }
        });
    }

    // フォーカス管理
    focusElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.focus();
        }
    }

    // エラー境界の設定
    setupErrorBoundary() {
        window.addEventListener('error', (e) => {
            console.error('JavaScript Error:', e.error);
            this.showErrorMessage('エラーが発生しました。ページを再読み込みしてください。');
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled Promise Rejection:', e.reason);
            this.showErrorMessage('予期しないエラーが発生しました。');
        });
    }
}