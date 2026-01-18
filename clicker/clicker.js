(function() {
  // Generator definitions
  const GENERATORS = [
    { 
      id: 'coffee', 
      name: 'Coffee', 
      icon: '☕', 
      baseCost: 15, 
      baseProduction: 0.5, 
      desc: 'The fuel of creativity',
      color: '#8B4513'
    },
    { 
      id: 'thesaurus', 
      name: 'Thesaurus', 
      icon: '📖', 
      baseCost: 100, 
      baseProduction: 2, 
      desc: 'Makes everything sound fancier',
      color: '#FF6B6B'
    },
    { 
      id: 'junior', 
      name: 'Junior Copywriter', 
      icon: '👤', 
      baseCost: 1100, 
      baseProduction: 10, 
      desc: 'Eager but needs supervision',
      color: '#4ECDC4'
    },
    { 
      id: 'senior', 
      name: 'Senior Copywriter', 
      icon: '👥', 
      baseCost: 12000, 
      baseProduction: 50, 
      desc: 'Knows all the buzzwords',
      color: '#95E1D3'
    },
    { 
      id: 'cd', 
      name: 'Creative Director', 
      icon: '✨', 
      baseCost: 130000, 
      baseProduction: 200, 
      desc: 'Has opinions about kerning',
      color: '#F38181'
    },
    { 
      id: 'ai', 
      name: 'AI Writing Tool', 
      icon: '🤖', 
      baseCost: 1400000, 
      baseProduction: 1000, 
      desc: 'Needs heavy editing but fast',
      color: '#AA96DA'
    },
    { 
      id: 'retainer', 
      name: 'Agency Retainer', 
      icon: '💼', 
      baseCost: 20000000, 
      baseProduction: 5000, 
      desc: 'Passive income baby',
      color: '#FFD93D'
    }
  ];

  const EVENTS = [
    { text: 'Client changed their mind', effect: -0.1, type: 'bad' },
    { text: 'Brief marked URGENT', effect: 2, duration: 5, type: 'good' },
    { text: 'Legal has feedback', effect: 0, duration: 3, type: 'bad' },
    { text: 'Approved in one round!', effect: 1000, type: 'bonus' }
  ];

  const ACHIEVEMENTS = [
    { id: 'first', name: 'First Draft', desc: 'Generate 1,000 words', threshold: 1000 },
    { id: 'clicks', name: 'Carpal Tunnel', desc: 'Click 500 times', threshold: 500, stat: 'clicks' },
    { id: 'scope', name: 'Scope Creep', desc: 'Own 10 of any generator', threshold: 10, stat: 'generator' },
    { id: 'passive', name: 'Passive Aggressive Income', desc: 'Earn 100k words', threshold: 100000 }
  ];

  // Game state
  const state = {
    words: 0,
    totalWords: 0,
    clicks: 0,
    generators: {},
    achievements: new Set(),
    eventMultiplier: 1,
    lastUpdate: Date.now(),
    nextEventTime: Date.now() + Math.random() * 30000 + 20000,
    eventEndTime: 0
  };

  // Initialize generators
  GENERATORS.forEach(g => state.generators[g.id] = 0);

  // DOM elements
  const els = {
    wordCount: document.getElementById('word-count'),
    wps: document.getElementById('wps'),
    boost: document.getElementById('boost'),
    totalWords: document.getElementById('total-words'),
    clicks: document.getElementById('clicks'),
    achievementsCount: document.getElementById('achievements-count'),
    clickButton: document.getElementById('click-button'),
    resetButton: document.getElementById('reset-button'),
    generatorsList: document.getElementById('generators-list'),
    achievementsList: document.getElementById('achievements-list')
  };

  // Utility functions
  function formatNumber(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return Math.floor(n).toLocaleString();
  }

  function calculateWPS() {
    return GENERATORS.reduce((sum, g) => {
      return sum + (state.generators[g.id] * g.baseProduction);
    }, 0);
  }

  function showNotification(content, type) {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = content;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.remove();
    }, 3000);
  }

  function showAchievement(achievement) {
    showNotification(`
      <div class="notification-content">
        <span class="notification-icon">🏆</span>
        <div>
          <div class="notification-title">${achievement.name}</div>
          <div class="notification-desc">${achievement.desc}</div>
        </div>
      </div>
    `, 'achievement');
  }

  function checkAchievements() {
    ACHIEVEMENTS.forEach(ach => {
      if (state.achievements.has(ach.id)) return;

      let unlocked = false;
      if (ach.stat === 'clicks') {
        unlocked = state.clicks >= ach.threshold;
      } else if (ach.stat === 'generator') {
        unlocked = Object.values(state.generators).some(count => count >= ach.threshold);
      } else {
        unlocked = state.totalWords >= ach.threshold;
      }

      if (unlocked) {
        state.achievements.add(ach.id);
        showAchievement(ach);
        renderAchievements();
      }
    });
  }

  // Click handler
  els.clickButton.addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const amount = 1;
    state.words += amount;
    state.totalWords += amount;
    state.clicks += 1;

    // Floating text
    const floater = document.createElement('div');
    floater.className = 'floating-text';
    floater.textContent = `+${amount}`;
    floater.style.left = x + 'px';
    floater.style.top = y + 'px';
    els.clickButton.appendChild(floater);

    setTimeout(() => floater.remove(), 1000);

    updateDisplay();
    checkAchievements();
  });

  // Reset handler
  els.resetButton.addEventListener('click', () => {
    if (confirm('Reset everything? (This is a prototype, no prestige bonuses yet!)')) {
      state.words = 0;
      state.totalWords = 0;
      state.clicks = 0;
      state.eventMultiplier = 1;
      state.achievements.clear();
      GENERATORS.forEach(g => state.generators[g.id] = 0);
      
      updateDisplay();
      renderGenerators();
      renderAchievements();
    }
  });

  // Buy generator
  function buyGenerator(gen) {
    const cost = Math.floor(gen.baseCost * Math.pow(1.15, state.generators[gen.id]));
    if (state.words >= cost) {
      state.words -= cost;
      state.generators[gen.id] += 1;
      updateDisplay();
      renderGenerators();
      checkAchievements();
    }
  }

  // Render generators
  function renderGenerators() {
    els.generatorsList.innerHTML = '';
    
    GENERATORS.forEach(gen => {
      const cost = Math.floor(gen.baseCost * Math.pow(1.15, state.generators[gen.id]));
      const canBuy = state.words >= cost;

      const button = document.createElement('button');
      button.className = 'generator-item';
      button.disabled = !canBuy;
      button.onclick = () => buyGenerator(gen);

      button.innerHTML = `
        <div class="generator-content">
          <div class="generator-icon" style="background-color: ${gen.color}30;">
            ${gen.icon}
          </div>
          <div class="generator-info">
            <div class="generator-name">${gen.name}</div>
            <div class="generator-desc">${gen.desc}</div>
            <div class="generator-production">+${gen.baseProduction}/sec</div>
          </div>
          <div class="generator-cost-info">
            <div class="generator-cost">${formatNumber(cost)}</div>
            <div class="generator-owned">Owned: ${state.generators[gen.id]}</div>
          </div>
        </div>
      `;

      els.generatorsList.appendChild(button);
    });
  }

  // Render achievements
  function renderAchievements() {
    els.achievementsList.innerHTML = '';

    ACHIEVEMENTS.forEach(ach => {
      const unlocked = state.achievements.has(ach.id);
      
      const div = document.createElement('div');
      div.className = `achievement-item ${unlocked ? 'unlocked' : ''}`;
      
      div.innerHTML = `
        <div class="achievement-content">
          ${unlocked ? '<span class="achievement-icon">🏆</span>' : ''}
          <div class="achievement-info">
            <div class="achievement-name ${unlocked ? 'unlocked' : 'locked'}">${ach.name}</div>
            <div class="achievement-desc">${ach.desc}</div>
          </div>
        </div>
      `;

      els.achievementsList.appendChild(div);
    });
  }

  // Update display
  function updateDisplay() {
    els.wordCount.textContent = formatNumber(state.words);
    els.wps.textContent = formatNumber(calculateWPS()) + '/sec';
    els.totalWords.textContent = formatNumber(state.totalWords);
    els.clicks.textContent = state.clicks.toLocaleString();
    els.achievementsCount.textContent = `${state.achievements.size}/${ACHIEVEMENTS.length}`;

    if (state.eventMultiplier !== 1) {
      els.boost.style.display = 'block';
      els.boost.textContent = `×${state.eventMultiplier} BOOST!`;
    } else {
      els.boost.style.display = 'none';
    }
  }

  // Trigger event
  function triggerEvent(event) {
    if (event.type === 'bad' && event.effect === -0.1) {
      state.words = Math.max(0, state.words * (1 + event.effect));
    } else if (event.type === 'bonus') {
      state.words += event.effect;
      state.totalWords += event.effect;
    } else if (event.duration) {
      state.eventMultiplier = event.effect;
      state.eventEndTime = Date.now() + event.duration * 1000;
    }

    showNotification(`
      <div class="notification-content">
        <div class="notification-title">${event.text}</div>
      </div>
    `, `event-${event.type}`);

    updateDisplay();
  }

  // Game loop
  function gameLoop() {
    const now = Date.now();
    const dt = (now - state.lastUpdate) / 1000;
    state.lastUpdate = now;

    // Production
    const wps = calculateWPS();
    const produced = wps * dt * state.eventMultiplier;
    if (produced > 0) {
      state.words += produced;
      state.totalWords += produced;
    }

    // Random events
    if (now > state.nextEventTime) {
      const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      triggerEvent(event);
      state.nextEventTime = now + Math.random() * 40000 + 30000;
    }

    // End timed events
    if (state.eventMultiplier !== 1 && now > state.eventEndTime) {
      state.eventMultiplier = 1;
    }

    updateDisplay();
    renderGenerators();
    checkAchievements();

    requestAnimationFrame(gameLoop);
  }

  // Initialize
  renderGenerators();
  renderAchievements();
  updateDisplay();
  gameLoop();
})();
