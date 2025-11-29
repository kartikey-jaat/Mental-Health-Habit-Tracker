// Constants and configuration
const STORAGE_VERSION = 1;
const DEBOUNCE_DELAY = 300;

// Simple UUID generator for unique IDs
function generateId() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// DOM Elements cache (add checks when using)
const elements = {
  themeToggle: document.getElementById('themeToggle'),
  moodForm: document.getElementById('moodForm'),
  habitInput: document.getElementById('habitInput'),
  addHabitBtn: document.getElementById('addHabitBtn'),
  habitList: document.getElementById('habitList'),
  log: document.getElementById('log'),
  clearDataBtn: document.getElementById('clearDataBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  importFile: document.getElementById('importFile'),
  habitFilter: document.getElementById('habitFilter'),
  moodFilter: document.getElementById('moodFilter'),
  sortOrder: document.getElementById('sortOrder'),
  totalEntries: document.getElementById('totalEntries'),
  currentStreak: document.getElementById('currentStreak'),
  completionRate: document.getElementById('completionRate'),
  moodAverage: document.getElementById('moodAverage'),
  submitBtn: document.getElementById('submitBtn'),
  moodSelector: document.getElementById('moodSelector'),
  moodSelect: document.getElementById('mood'),
  progressRing: document.querySelector('.progress-ring-fill'),
  currentYear: document.getElementById('currentYear')
};

// State
let state = {
  journalEntries: [],
  habits: [],
  filters: {
    habitStatus: 'all',
    mood: 'all',
    sort: 'newest'
  },
  selectedMood: null
};

// Utility functions
const utils = {
  setTextContent(element, text) {
    if (element) element.textContent = text;
  },
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  getMoodEmoji(mood) {
    const emojis = {
      'Happy': '😊',
      'Neutral': '😐',
      'Sad': '😢',
      'Stressed': '😰',
      'Anxious': '😥',
      'Excited': '🤩',
      'Grateful': '🙏'
    };
    return emojis[mood] || '😐';
  },
  calculateMoodAverage(entries) {
    if (entries.length === 0) return '-';
    const moodValues = {
      'Sad': 1,
      'Stressed': 2,
      'Anxious': 3,
      'Neutral': 4,
      'Grateful': 5,
      'Happy': 6,
      'Excited': 7
    };
    const sum = entries.reduce((total, entry) => {
      return total + (moodValues[entry.mood] || 4);
    }, 0);
    const average = sum / entries.length;
    return average.toFixed(1);
  },
  updateProgressRing(percentage) {
    if (elements.progressRing) {
      const circumference = 2 * Math.PI * 54;
      const offset = circumference - (percentage / 100) * circumference;
      elements.progressRing.style.strokeDashoffset = offset;
    }
  },
  setCurrentYear() {
    if (elements.currentYear) {
      elements.currentYear.textContent = new Date().getFullYear();
    }
  }
};

// Storage module
const storage = {
  getData() {
    const rawData = localStorage.getItem('mindfulMomentsData');
    if (!rawData) return null;
    try {
      const data = JSON.parse(rawData);
      if (data.version === STORAGE_VERSION) {
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error parsing stored data:', error);
      return null;
    }
  },
  setData(data) {
    const versionedData = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      data: data
    };
    try {
      localStorage.setItem('mindfulMomentsData', JSON.stringify(versionedData));
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  },
  getJournalEntries() {
    const stored = this.getData();
    return stored?.data?.journalEntries || [];
  },
  getHabits() {
    const stored = this.getData();
    return stored?.data?.habits || [];
  },
  setJournalEntries(entries) {
    const currentData = this.getData()?.data || {};
    return this.setData({
      ...currentData,
      journalEntries: entries
    });
  },
  setHabits(habits) {
    const currentData = this.getData()?.data || {};
    return this.setData({
      ...currentData,
      habits: habits
    });
  },
  clearAll() {
    localStorage.removeItem('mindfulMomentsData');
  },
  exportData() {
    const data = this.getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindful-moments-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.version && data.data) {
            this.setData(data.data);
            resolve(data.data);
          } else {
            reject(new Error('Invalid data format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};

// UI module
const ui = {
  showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.setAttribute('aria-label', 'Close notification');
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times';
    closeIcon.setAttribute('aria-hidden', 'true');
    closeButton.appendChild(closeIcon);
    notification.appendChild(messageSpan);
    notification.appendChild(closeButton);
    document.body.appendChild(notification);
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInDown 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
    closeButton.addEventListener('click', () => {
      notification.style.animation = 'slideInDown 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    });
  },
  setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  },
  showEmptyState(container, message, icon = 'fas fa-feather') {
    if (!container) return;
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    const iconElement = document.createElement('i');
    iconElement.className = `${icon} icon`;
    iconElement.setAttribute('aria-hidden', 'true');
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    emptyState.appendChild(iconElement);
    emptyState.appendChild(messageElement);
    container.innerHTML = '';
    container.appendChild(emptyState);
  },
  renderHabits(habits, filter = 'all') {
    if (!elements.habitList) return;
    const fragment = document.createDocumentFragment();
    const filteredHabits = habits.filter(habit => {
      if (filter === 'active') return !habit.completed;
      if (filter === 'completed') return habit.completed;
      return true;
    });
    if (filteredHabits.length === 0) {
      this.showEmptyState(
        elements.habitList, 
        filter === 'completed' ? 'No completed habits yet' : 'No habits yet. Add your first habit to get started!',
        'fas fa-clipboard-list'
      );
      return;
    }
    filteredHabits.forEach(habit => {
      const habitItem = document.createElement('li');
      habitItem.className = 'habit-item';
      habitItem.setAttribute('role', 'listitem');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'habit-checkbox';
      checkbox.setAttribute('aria-label', `Mark "${habit.text}" as completed`);
      checkbox.checked = habit.completed;
      checkbox.disabled = habit.completed;
      const text = document.createElement('span');
      text.className = 'habit-text';
      utils.setTextContent(text, habit.text);
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-habit';
      deleteBtn.setAttribute('aria-label', `Delete habit "${habit.text}"`);
      const deleteIcon = document.createElement('i');
      deleteIcon.className = 'fas fa-times';
      deleteIcon.setAttribute('aria-hidden', 'true');
      deleteBtn.appendChild(deleteIcon);
      if (habit.completed) {
        habitItem.classList.add('completed');
      }
      // Add event listeners
      checkbox.addEventListener('change', () => {
        app.toggleHabit(habit.id);
      });
      deleteBtn.addEventListener('click', () => {
        app.deleteHabit(habit.id);
      });
      habitItem.appendChild(checkbox);
      habitItem.appendChild(text);
      habitItem.appendChild(deleteBtn);
      fragment.appendChild(habitItem);
    });
    elements.habitList.innerHTML = '';
    elements.habitList.appendChild(fragment);
  },
  renderJournalEntries(entries, moodFilter = 'all', sortOrder = 'newest') {
    if (!elements.log) return;
    elements.log.innerHTML = '';
    let filteredEntries = [...entries];
    if (moodFilter !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.mood === moodFilter);
    }
    filteredEntries.sort((a, b) => {
      return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });
    if (filteredEntries.length === 0) {
      this.showEmptyState(
        elements.log,
        moodFilter === 'all' 
          ? 'No journal entries yet. Start by writing about your day!' 
          : `No entries with ${moodFilter} mood`,
        'fas fa-book'
      );
      return;
    }
    filteredEntries.forEach(entry => {
      const article = document.createElement('article');
      article.className = 'log-entry';
      const header = document.createElement('header');
      header.className = 'entry-header';
      const date = document.createElement('time');
      date.className = 'entry-date';
      date.setAttribute('datetime', new Date(entry.timestamp).toISOString());
      utils.setTextContent(date, `${utils.formatDate(entry.timestamp)} at ${utils.formatTime(entry.timestamp)}`);
      const mood = document.createElement('span');
      mood.className = 'entry-mood';
      const moodEmoji = utils.getMoodEmoji(entry.mood);
      mood.textContent = `${moodEmoji} ${entry.mood}`;
      const content = document.createElement('div');
      content.className = 'entry-content';
      if (entry.journal && entry.journal.trim() !== '') {
        utils.setTextContent(content, entry.journal);
      } else {
        content.textContent = 'No journal content';
        content.style.fontStyle = 'italic';
        content.style.color = 'var(--text-light)';
      }
      header.appendChild(date);
      header.appendChild(mood);
      article.appendChild(header);
      article.appendChild(content);
      elements.log.appendChild(article);
    });
  },
  updateStats(entries, habits) {
    utils.setTextContent(elements.totalEntries, entries.length);
    const today = new Date().toDateString();
    let streak = 0;
    const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    let currentDate = new Date();
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].timestamp).toDateString();
      const checkDate = new Date(currentDate).toDateString();
      if (entryDate === checkDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    utils.setTextContent(elements.currentStreak, streak);
    const completedHabits = habits.filter(habit => habit.completed).length;
    const completionRate = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;
    utils.setTextContent(elements.completionRate, `${completionRate}%`);
    utils.updateProgressRing(completionRate);
    const moodAverage = utils.calculateMoodAverage(entries);
    utils.setTextContent(elements.moodAverage, moodAverage);
  },
  initMoodSelector() {
    const moodOptions = elements.moodSelector ? elements.moodSelector.querySelectorAll('.mood-option') : [];
    moodOptions.forEach(option => {
      option.addEventListener('click', () => {
        moodOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        const moodValue = option.getAttribute('data-value');
        if (elements.moodSelect) elements.moodSelect.value = moodValue;
        state.selectedMood = moodValue;
        const errorElement = document.getElementById('mood-error');
        if (errorElement) {
          errorElement.classList.remove('show');
          errorElement.textContent = '';
        }
      });
    });
  }
};

// Theme module
const theme = {
  init() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let theme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.setTheme(theme);
    if (elements.themeToggle) {
      elements.themeToggle.setAttribute('aria-pressed', theme === 'dark');
    }
    this.updateToggleIcon(theme);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  },
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (elements.themeToggle) {
      elements.themeToggle.setAttribute('aria-pressed', theme === 'dark');
    }
    this.updateToggleIcon(theme);
  },
  updateToggleIcon(theme) {
    const icon = elements.themeToggle ? elements.themeToggle.querySelector('i') : null;
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  },
  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }
};

// Main application
const app = {
  init() {
    theme.init();
    utils.setCurrentYear();
    this.loadData();
    this.setupEventListeners();
    ui.initMoodSelector();
    this.renderUI();
    if (state.journalEntries.length === 0 && state.habits.length === 0) {
      setTimeout(() => {
        ui.showNotification('Welcome! Start by adding a journal entry or habit.', 'info', 8000);
      }, 1000);
    }
  },
  loadData() {
    const entries = storage.getJournalEntries();
    const habits = storage.getHabits();
    state.journalEntries = Array.isArray(entries) ? entries : [];
    state.habits = Array.isArray(habits) ? habits : [];
    console.log('Loaded entries:', state.journalEntries);
    console.log('Loaded habits:', state.habits);
  },
  saveData() {
    const journalSuccess = storage.setJournalEntries(state.journalEntries);
    const habitsSuccess = storage.setHabits(state.habits);
    if (!journalSuccess || !habitsSuccess) {
      ui.showNotification('Error saving data to storage', 'danger');
      return false;
    }
    return true;
  },
  setupEventListeners() {
    if (elements.themeToggle) {
      elements.themeToggle.addEventListener('click', () => theme.toggle());
    }
    if (elements.moodForm) {
      elements.moodForm.addEventListener('submit', (e) => this.handleMoodSubmit(e));
    }
    if (elements.addHabitBtn) {
      elements.addHabitBtn.addEventListener('click', () => this.addHabit());
    }
    if (elements.habitInput) {
      elements.habitInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addHabit();
        }
      });
    }
    if (elements.clearDataBtn) {
      elements.clearDataBtn.addEventListener('click', () => this.clearAllData());
    }
    if (elements.exportBtn) {
      elements.exportBtn.addEventListener('click', () => storage.exportData());
    }
    if (elements.importBtn && elements.importFile) {
      elements.importBtn.addEventListener('click', () => elements.importFile.click());
      elements.importFile.addEventListener('change', (e) => this.handleImport(e));
    }
    if (elements.habitFilter) {
      elements.habitFilter.addEventListener('change', (e) => {
        state.filters.habitStatus = e.target.value;
        this.renderUI();
      });
    }
    if (elements.moodFilter) {
      elements.moodFilter.addEventListener('change', utils.debounce((e) => {
        state.filters.mood = e.target.value;
        this.renderUI();
      }, DEBOUNCE_DELAY));
    }
    if (elements.sortOrder) {
      elements.sortOrder.addEventListener('change', utils.debounce((e) => {
        state.filters.sort = e.target.value;
        this.renderUI();
      }, DEBOUNCE_DELAY));
    }
  },
  handleMoodSubmit(e) {
    e.preventDefault();
    console.log('Form submitted');
    const mood = elements.moodSelect ? elements.moodSelect.value : '';
    const journalElem = document.getElementById('journal');
    const journal = journalElem ? journalElem.value : '';
    console.log('Mood selected:', mood);
    console.log('Journal text:', journal);
    if (!mood || mood === '') {
      const moodError = document.getElementById('mood-error');
      if (moodError) {
        moodError.classList.add('show');
        moodError.textContent = 'Please select your mood';
      }
      ui.showNotification('Please select a mood before saving', 'warning');
      return;
    }
    ui.setButtonLoading(elements.submitBtn, true);
    const entry = {
      id: generateId(),
      mood: mood,
      journal: utils.sanitizeInput(journal),
      timestamp: Date.now()
    };
    console.log('Created entry:', entry);
    state.journalEntries.unshift(entry);
    console.log('State after adding entry:', state.journalEntries);
    const saveSuccess = this.saveData();
    if (saveSuccess) {
      this.renderUI();
      if (elements.moodForm) elements.moodForm.reset();
      if (elements.moodSelector) {
        const moodOptions = elements.moodSelector.querySelectorAll('.mood-option');
        moodOptions.forEach(opt => opt.classList.remove('selected'));
      }
      state.selectedMood = null;
      const moodError = document.getElementById('mood-error');
      if (moodError) {
        moodError.classList.remove('show');
        moodError.textContent = '';
      }
      ui.showNotification('Journal entry saved successfully!', 'success');
    } else {
      ui.showNotification('Failed to save entry. Please try again.', 'danger');
      state.journalEntries.shift();
    }
    ui.setButtonLoading(elements.submitBtn, false);
  },
  addHabit() {
    if (!elements.habitInput || !elements.addHabitBtn) return;
    const habitText = elements.habitInput.value.trim();
    if (!habitText) {
      ui.showNotification('Please enter a habit name', 'warning');
      elements.habitInput.focus();
      return;
    }
    ui.setButtonLoading(elements.addHabitBtn, true);
    const habit = {
      id: generateId(),
      text: utils.sanitizeInput(habitText),
      completed: false,
      createdAt: Date.now()
    };
    state.habits.push(habit);
    const saveSuccess = this.saveData();
    if (saveSuccess) {
      this.renderUI();
      elements.habitInput.value = '';
      ui.showNotification('Habit added successfully!', 'success');
    } else {
      ui.showNotification('Failed to save habit. Please try again.', 'danger');
      state.habits.pop();
    }
    ui.setButtonLoading(elements.addHabitBtn, false);
  },
  toggleHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (habit) {
      habit.completed = !habit.completed;
      this.saveData();
      this.renderUI();
      if (habit.completed) {
        ui.showNotification('Habit completed! Great job! 🎉', 'success');
      }
    }
  },
  deleteHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;
    if (!confirm(`Are you sure you want to delete the habit "${habit.text}"?`)) return;
    state.habits = state.habits.filter(h => h.id !== id);
    this.saveData();
    this.renderUI();
    ui.showNotification(`Habit "${habit.text}" deleted`, 'info', 6000);
  },
  async handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      ui.setButtonLoading(elements.importBtn, true);
      const data = await storage.importData(file);
      state.journalEntries = data.journalEntries || [];
      state.habits = data.habits || [];
      this.renderUI();
      ui.showNotification('Data imported successfully!', 'success');
    } catch (error) {
      console.error('Import error:', error);
      ui.showNotification('Failed to import data. Please check the file format.', 'danger');
    } finally {
      ui.setButtonLoading(elements.importBtn, false);
      e.target.value = '';
    }
  },
  clearAllData() {
    if (!confirm('Are you sure you want to delete ALL your data? This cannot be undone.')) return;
    storage.clearAll();
    state.journalEntries = [];
    state.habits = [];
    this.renderUI();
    ui.showNotification('All data has been cleared', 'info');
  },
  renderUI() {
    console.log('Rendering UI with entries:', state.journalEntries);
    if (elements.habitFilter) elements.habitFilter.value = state.filters.habitStatus;
    if (elements.moodFilter) elements.moodFilter.value = state.filters.mood;
    if (elements.sortOrder) elements.sortOrder.value = state.filters.sort;
    ui.renderHabits(state.habits, state.filters.habitStatus);
    ui.renderJournalEntries(
      state.journalEntries, 
      state.filters.mood, 
      state.filters.sort
    );
    ui.updateStats(state.journalEntries, state.habits);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
