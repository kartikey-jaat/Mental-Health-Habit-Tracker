// Constants and configuration
const STORAGE_VERSION = 1;
const DEBOUNCE_DELAY = 300;

// DOM Elements cache
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

// Templates
const habitTemplate = document.getElementById('habit-template');
const entryTemplate = document.getElementById('entry-template');

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
  // Safe text content setter
  setTextContent(element, text) {
    if (element) element.textContent = text;
  },

  // Sanitize user input
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  // Debounce function
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

  // Format date
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format time
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Get mood emoji
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

  // Calculate mood average
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

  // Update progress ring
  updateProgressRing(percentage) {
    if (elements.progressRing) {
      const circumference = 2 * Math.PI * 54;
      const offset = circumference - (percentage / 100) * circumference;
      elements.progressRing.style.strokeDashoffset = offset;
    }
  },

  // Set current year in footer
  setCurrentYear() {
    if (elements.currentYear) {
      elements.currentYear.textContent = new Date().getFullYear();
    }
  }
};

// Storage module
const storage = {
  // Versioned data structure
  getData() {
    const rawData = localStorage.getItem('mindfulMomentsData');
    if (!rawData) return null;

    try {
      const data = JSON.parse(rawData);
      if (data.version === STORAGE_VERSION) {
        return data;
      }
      // Future: Add migration logic here for different versions
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
    localStorage.setItem('mindfulMomentsData', JSON.stringify(versionedData));
  },

  // Specific getters
  getJournalEntries() {
    const stored = this.getData();
    return stored?.data?.journalEntries || [];
  },

  getHabits() {
    const stored = this.getData();
    return stored?.data?.habits || [];
  },

  // Specific setters
  setJournalEntries(entries) {
    const currentData = this.getData()?.data || {};
    this.setData({
      ...currentData,
      journalEntries: entries
    });
  },

  setHabits(habits) {
    const currentData = this.getData()?.data || {};
    this.setData({
      ...currentData,
      habits: habits
    });
  },

  // Clear all data
  clearAll() {
    localStorage.removeItem('mindfulMomentsData');
  },

  // Export data
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

  // Import data
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
  // Show notification
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

    // Auto-remove
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInDown 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);

    // Close button
    closeButton.addEventListener('click', () => {
      notification.style.animation = 'slideInDown 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    });
  },

  // Set button loading state
  setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  },

  // Show empty state
  showEmptyState(container, message, icon = 'fas fa-feather') {
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

  // Render habit list
  renderHabits(habits, filter = 'all') {
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
      const clone = document.importNode(habitTemplate.content, true);
      const item = clone.querySelector('.habit-item');
      const checkbox = clone.querySelector('.habit-checkbox');
      const text = clone.querySelector('.habit-text');
      const deleteBtn = clone.querySelector('.delete-habit');

      // Set habit data
      utils.setTextContent(text, habit.text);
      checkbox.checked = habit.completed;
      checkbox.disabled = habit.completed;
      
      if (habit.completed) {
        item.classList.add('completed');
      }

      // Add event listeners
      checkbox.addEventListener('change', () => {
        app.toggleHabit(habit.id);
      });

      deleteBtn.addEventListener('click', () => {
        app.deleteHabit(habit.id);
      });

      fragment.appendChild(clone);
    });

    elements.habitList.innerHTML = '';
    elements.habitList.appendChild(fragment);
  },

  // Render journal entries
  renderJournalEntries(entries, moodFilter = 'all', sortOrder = 'newest') {
    const fragment = document.createDocumentFragment();
    
    let filteredEntries = [...entries];
    
    // Filter by mood
    if (moodFilter !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.mood === moodFilter);
    }
    
    // Sort entries
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
      const clone = document.importNode(entryTemplate.content, true);
      const date = clone.querySelector('.entry-date');
      const mood = clone.querySelector('.entry-mood');
      const content = clone.querySelector('.entry-content');

      // Set entry data
      date.setAttribute('datetime', new Date(entry.timestamp).toISOString());
      utils.setTextContent(date, `${utils.formatDate(entry.timestamp)} at ${utils.formatTime(entry.timestamp)}`);
      
      // FIX: Properly set mood with emoji and text
      const moodEmoji = utils.getMoodEmoji(entry.mood);
      mood.textContent = `${moodEmoji} ${entry.mood}`;
      
      if (entry.journal && entry.journal.trim() !== '') {
        utils.setTextContent(content, entry.journal);
      } else {
        content.style.display = 'none';
      }

      fragment.appendChild(clone);
    });

    elements.log.innerHTML = '';
    elements.log.appendChild(fragment);
  },

  // Update statistics
  updateStats(entries, habits) {
    utils.setTextContent(elements.totalEntries, entries.length);
    
    // Calculate streak
    const today = new Date().toDateString();
    let streak = 0;
    
    // Simple streak calculation
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
    
    // Calculate completion rate
    const completedHabits = habits.filter(habit => habit.completed).length;
    const completionRate = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;
    utils.setTextContent(elements.completionRate, `${completionRate}%`);
    utils.updateProgressRing(completionRate);
    
    // Calculate mood average
    const moodAverage = utils.calculateMoodAverage(entries);
    utils.setTextContent(elements.moodAverage, moodAverage);
  },

  // Initialize mood selector
  initMoodSelector() {
    const moodOptions = elements.moodSelector.querySelectorAll('.mood-option');
    
    moodOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        moodOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Update hidden select value
        const moodValue = option.getAttribute('data-value');
        elements.moodSelect.value = moodValue;
        state.selectedMood = moodValue;
        
        // Clear any error
        const errorElement = document.getElementById('mood-error');
        if (errorElement) {
          errorElement.classList.remove('show');
        }
      });
    });
  }
};

// Theme module
const theme = {
  init() {
    // Check for saved theme or prefer-color-scheme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let theme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.setTheme(theme);
    
    // Update toggle button state
    elements.themeToggle.setAttribute('aria-pressed', theme === 'dark');
    this.updateToggleIcon(theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    elements.themeToggle.setAttribute('aria-pressed', theme === 'dark');
    this.updateToggleIcon(theme);
  },

  updateToggleIcon(theme) {
    const icon = elements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
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
    // Initialize theme
    theme.init();
    
    // Set current year
    utils.setCurrentYear();
    
    // Load data
    this.loadData();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize UI components
    ui.initMoodSelector();
    
    // Render initial UI
    this.renderUI();
    
    // Show welcome message for first-time users
    if (state.journalEntries.length === 0 && state.habits.length === 0) {
      setTimeout(() => {
        ui.showNotification('Welcome! Start by adding a journal entry or habit.', 'info', 8000);
      }, 1000);
    }
  },

  loadData() {
    state.journalEntries = storage.getJournalEntries();
    state.habits = storage.getHabits();
  },

  saveData() {
    storage.setJournalEntries(state.journalEntries);
    storage.setHabits(state.habits);
  },

  setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', () => theme.toggle());
    
    // Mood form submission
    elements.moodForm.addEventListener('submit', (e) => this.handleMoodSubmit(e));
    
    // Add habit
    elements.addHabitBtn.addEventListener('click', () => this.addHabit());
    elements.habitInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addHabit();
      }
    });
    
    // Clear data
    elements.clearDataBtn.addEventListener('click', () => this.clearAllData());
    
    // Export/import
    elements.exportBtn.addEventListener('click', () => storage.exportData());
    elements.importBtn.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', (e) => this.handleImport(e));
    
    // Filters with debouncing
    elements.habitFilter.addEventListener('change', (e) => {
      state.filters.habitStatus = e.target.value;
      this.renderUI();
    });
    
    elements.moodFilter.addEventListener('change', utils.debounce((e) => {
      state.filters.mood = e.target.value;
      this.renderUI();
    }, DEBOUNCE_DELAY));
    
    elements.sortOrder.addEventListener('change', utils.debounce((e) => {
      state.filters.sort = e.target.value;
      this.renderUI();
    }, DEBOUNCE_DELAY));
    
    // Form validation
    elements.moodForm.addEventListener('input', utils.debounce(() => {
      this.validateForm();
    }, DEBOUNCE_DELAY));
  },

  handleMoodSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm()) return;
    
    const formData = new FormData(elements.moodForm);
    const mood = formData.get('mood');
    const journal = utils.sanitizeInput(formData.get('journal') || '');
    
    // FIX: Check if mood is actually selected
    if (!mood || mood === '') {
      ui.showNotification('Please select a mood', 'warning');
      return;
    }
    
    ui.setButtonLoading(elements.submitBtn, true);
    
    // Create entry immediately
    const entry = {
      id: Date.now(),
      mood: mood,
      journal: journal,
      timestamp: Date.now()
    };
    
    // Add to state immediately for instant UI update
    state.journalEntries.unshift(entry);
    
    // Save to storage
    this.saveData();
    
    // Update UI immediately
    this.renderUI();
    
    // Reset form
    elements.moodForm.reset();
    
    // Reset mood selector
    const moodOptions = elements.moodSelector.querySelectorAll('.mood-option');
    moodOptions.forEach(opt => opt.classList.remove('selected'));
    state.selectedMood = null;
    
    // Show success message
    setTimeout(() => {
      ui.setButtonLoading(elements.submitBtn, false);
      ui.showNotification('Journal entry saved successfully!', 'success');
    }, 300);
  },

  validateForm() {
    const mood = elements.moodSelect;
    const moodError = document.getElementById('mood-error');
    
    let isValid = true;
    
    // Validate mood
    if (!mood.value) {
      if (moodError) {
        moodError.classList.add('show');
        utils.setTextContent(moodError, 'Please select your mood');
      }
      mood.setAttribute('aria-invalid', 'true');
      isValid = false;
    } else {
      if (moodError) {
        moodError.classList.remove('show');
      }
      mood.setAttribute('aria-invalid', 'false');
    }
    
    return isValid;
  },

  addHabit() {
    const habitText = elements.habitInput.value.trim();
    
    if (!habitText) {
      ui.showNotification('Please enter a habit name', 'warning');
      elements.habitInput.focus();
      return;
    }
    
    ui.setButtonLoading(elements.addHabitBtn, true);
    
    // Create habit immediately
    const habit = {
      id: Date.now(),
      text: utils.sanitizeInput(habitText),
      completed: false,
      createdAt: Date.now()
    };
    
    // Add to state immediately for instant UI update
    state.habits.push(habit);
    
    // Save to storage
    this.saveData();
    
    // Update UI immediately
    this.renderUI();
    
    // Reset input
    elements.habitInput.value = '';
    
    // Show success message
    setTimeout(() => {
      ui.setButtonLoading(elements.addHabitBtn, false);
      ui.showNotification('Habit added successfully!', 'success');
    }, 300);
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
    
    // Store for potential undo
    const deletedHabit = { ...habit };
    
    if (!confirm(`Are you sure you want to delete the habit "${habit.text}"?`)) return;
    
    state.habits = state.habits.filter(h => h.id !== id);
    this.saveData();
    this.renderUI();
    
    ui.showNotification(
      `Habit "${habit.text}" deleted`, 
      'info', 
      6000
    );
  },

  async handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      ui.setButtonLoading(elements.importBtn, true);
      const data = await storage.importData(file);
      
      state.journalEntries = data.journalEntries || [];
      state.habits = data.habits || [];
      this.saveData();
      this.renderUI();
      
      ui.showNotification('Data imported successfully!', 'success');
    } catch (error) {
      console.error('Import error:', error);
      ui.showNotification('Failed to import data. Please check the file format.', 'danger');
    } finally {
      ui.setButtonLoading(elements.importBtn, false);
      e.target.value = ''; // Reset file input
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
    // Update filter dropdowns to reflect current state
    if (elements.habitFilter) elements.habitFilter.value = state.filters.habitStatus;
    if (elements.moodFilter) elements.moodFilter.value = state.filters.mood;
    if (elements.sortOrder) elements.sortOrder.value = state.filters.sort;
    
    // Render all UI components
    ui.renderHabits(state.habits, state.filters.habitStatus);
    ui.renderJournalEntries(
      state.journalEntries, 
      state.filters.mood, 
      state.filters.sort
    );
    ui.updateStats(state.journalEntries, state.habits);
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { app, storage, theme, ui, utils };
}
