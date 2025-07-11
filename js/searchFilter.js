// 検索・フィルタリングモジュール
class SearchFilterManager {
    constructor() {
        this.currentSearchTerm = '';
        this.currentTagFilter = '';
        this.searchDebounceTimer = null;
        this.debounceDelay = 300;
    }

    // 検索とフィルタリングのセットアップ
    setupSearchAndFilter(onUpdate) {
        this.onUpdate = onUpdate;
        
        // 検索入力の監視
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
        }

        // タグフィルターの監視
        const tagFilter = document.getElementById('tagFilter');
        if (tagFilter) {
            tagFilter.addEventListener('change', (e) => {
                this.handleTagFilter(e.target.value);
            });
        }
    }

    // 検索入力の処理（デバウンス付き）
    handleSearchInput(searchTerm) {
        clearTimeout(this.searchDebounceTimer);
        
        this.searchDebounceTimer = setTimeout(() => {
            this.currentSearchTerm = searchTerm;
            if (this.onUpdate) {
                this.onUpdate();
            }
        }, this.debounceDelay);
    }

    // タグフィルターの処理
    handleTagFilter(tagFilter) {
        this.currentTagFilter = tagFilter;
        if (this.onUpdate) {
            this.onUpdate();
        }
    }

    // タスクのフィルタリング
    filterTasks(tasks) {
        if (!Array.isArray(tasks)) {
            return [];
        }

        return tasks.filter(task => {
            const matchesSearch = this.matchesSearchTerm(task, this.currentSearchTerm);
            const matchesTag = this.matchesTagFilter(task, this.currentTagFilter);
            return matchesSearch && matchesTag;
        });
    }

    // 検索条件のマッチング
    matchesSearchTerm(task, searchTerm) {
        if (!searchTerm) return true;
        
        const term = searchTerm.toLowerCase();
        
        // タイトルでの検索
        if (task.title && task.title.toLowerCase().includes(term)) {
            return true;
        }
        
        // 詳細での検索
        if (task.detail && task.detail.toLowerCase().includes(term)) {
            return true;
        }
        
        // タグでの検索
        if (task.tags && task.tags.some(tag => tag.toLowerCase().includes(term))) {
            return true;
        }
        
        return false;
    }

    // タグフィルターのマッチング
    matchesTagFilter(task, tagFilter) {
        if (!tagFilter) return true;
        
        return task.tags && task.tags.includes(tagFilter);
    }

    // 高度な検索
    advancedSearch(tasks, criteria) {
        if (!Array.isArray(tasks)) {
            return [];
        }

        return tasks.filter(task => {
            // 検索条件の適用
            if (criteria.searchTerm && !this.matchesSearchTerm(task, criteria.searchTerm)) {
                return false;
            }

            // ステータスフィルター
            if (criteria.status && task.status !== criteria.status) {
                return false;
            }

            // タグフィルター
            if (criteria.tags && criteria.tags.length > 0) {
                const hasMatchingTag = criteria.tags.some(tag => task.tags.includes(tag));
                if (!hasMatchingTag) {
                    return false;
                }
            }

            // 期限フィルター
            if (criteria.deadline) {
                const now = new Date();
                const taskDeadline = new Date(task.deadline);
                
                switch (criteria.deadline) {
                    case 'overdue':
                        if (!task.deadline || taskDeadline >= now) {
                            return false;
                        }
                        break;
                    case 'today':
                        if (!task.deadline || !this.isSameDay(taskDeadline, now)) {
                            return false;
                        }
                        break;
                    case 'thisWeek':
                        if (!task.deadline || !this.isThisWeek(taskDeadline)) {
                            return false;
                        }
                        break;
                    case 'thisMonth':
                        if (!task.deadline || !this.isThisMonth(taskDeadline)) {
                            return false;
                        }
                        break;
                }
            }

            // 作成日フィルター
            if (criteria.createdDate) {
                const taskCreatedDate = new Date(task.createdAt);
                
                switch (criteria.createdDate) {
                    case 'today':
                        if (!this.isSameDay(taskCreatedDate, new Date())) {
                            return false;
                        }
                        break;
                    case 'thisWeek':
                        if (!this.isThisWeek(taskCreatedDate)) {
                            return false;
                        }
                        break;
                    case 'thisMonth':
                        if (!this.isThisMonth(taskCreatedDate)) {
                            return false;
                        }
                        break;
                }
            }

            return true;
        });
    }

    // ソート機能
    sortTasks(tasks, sortBy = 'createdAt', sortOrder = 'desc') {
        if (!Array.isArray(tasks)) {
            return [];
        }

        return [...tasks].sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'title':
                    aValue = (a.title || '').toLowerCase();
                    bValue = (b.title || '').toLowerCase();
                    break;
                case 'deadline':
                    aValue = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
                    bValue = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'status':
                    aValue = a.status || '';
                    bValue = b.status || '';
                    break;
                case 'priority':
                    // 優先度の順序を定義
                    const priorityOrder = { '高': 0, '中': 1, '低': 2 };
                    aValue = priorityOrder[a.priority] ?? 999;
                    bValue = priorityOrder[b.priority] ?? 999;
                    break;
                default:
                    aValue = a[sortBy] || '';
                    bValue = b[sortBy] || '';
            }

            // 比較
            let comparison = 0;
            if (aValue < bValue) {
                comparison = -1;
            } else if (aValue > bValue) {
                comparison = 1;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    // タグフィルターの選択肢を更新
    updateTagFilter(allTags, selectedTag = '') {
        const tagFilter = document.getElementById('tagFilter');
        if (!tagFilter) return;

        const currentValue = selectedTag || tagFilter.value;
        
        tagFilter.innerHTML = '<option value="">すべてのタグ</option>';
        
        allTags.sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            option.selected = tag === currentValue;
            tagFilter.appendChild(option);
        });
    }

    // 検索結果の統計
    getSearchStats(allTasks, filteredTasks) {
        const stats = {
            total: allTasks.length,
            displayed: filteredTasks.length,
            filtered: allTasks.length - filteredTasks.length,
            byStatus: {}
        };

        // ステータス別の集計
        filteredTasks.forEach(task => {
            stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
        });

        return stats;
    }

    // 現在の検索条件の取得
    getCurrentFilters() {
        return {
            searchTerm: this.currentSearchTerm,
            tagFilter: this.currentTagFilter
        };
    }

    // 検索条件のクリア
    clearFilters() {
        this.currentSearchTerm = '';
        this.currentTagFilter = '';
        
        // UI要素をクリア
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const tagFilter = document.getElementById('tagFilter');
        if (tagFilter) {
            tagFilter.value = '';
        }
        
        if (this.onUpdate) {
            this.onUpdate();
        }
    }

    // 日付比較ヘルパー
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    isThisWeek(date) {
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        return date >= startOfWeek && date <= endOfWeek;
    }

    isThisMonth(date) {
        const now = new Date();
        return date.getFullYear() === now.getFullYear() &&
               date.getMonth() === now.getMonth();
    }
}