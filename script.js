    // 1. Real-time Clock
    function updateClock() {
      const now = new Date();

      // Format Time (12-hour format with AM/PM)
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0'); // Get seconds
      const ampm = hours >= 12 ? 'PM' : 'AM';

      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12

      document.getElementById('hours-mins').textContent = `${hours}:${minutes}`;
      document.getElementById('seconds').textContent = `:${seconds}`; // Update DOM with seconds
      document.getElementById('ampm').textContent = ampm;

      // Format Date: e.g., "Friday, Aug 21, 2026"
      const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
      document.getElementById('date').textContent = now.toLocaleDateString('en-US', options);
    }

    // 2. Weather Code Translator (WMO Weather interpretation codes)
    const weatherIcons = {
      satellite: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12.5a4.5 4.5 0 0 1 4.5-4.5M8 8a9 9 0 0 1 9 9M8 4a13 13 0 0 1 13 13"/><circle cx="5" cy="19" r="2"/></svg>`,
      sun: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
      cloudSun: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="M20 12h2"></path><path d="m19.07 4.93-1.41 1.41"></path><path d="M15.94 13A7.14 7.14 0 0 0 10 7.42"></path><path d="M6 13a4 4 0 0 0 4 4h8a4 4 0 0 0 0-8h-1"></path></svg>`,
      cloud: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
      rain: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13v8"/><path d="M8 13v8"/><path d="M12 15v8"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
      storm: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>`
    };

    function decodeWmo(code) {
      switch (code) {
        case 0: return { desc: 'Clear Sky', icon: weatherIcons.sun };
        case 1: return { desc: 'Mainly Clear', icon: weatherIcons.sun };
        case 2: return { desc: 'Partly Cloudy', icon: weatherIcons.cloudSun };
        case 3: return { desc: 'Overcast', icon: weatherIcons.cloud };
        case 45: case 48: return { desc: 'Foggy', icon: weatherIcons.cloud };
        case 51: case 53: case 55: return { desc: 'Drizzle', icon: weatherIcons.rain };
        case 61: case 63: case 65: return { desc: 'Rain', icon: weatherIcons.rain };
        case 80: case 81: case 82: return { desc: 'Showers', icon: weatherIcons.rain };
        case 95: case 96: case 99: return { desc: 'Thunderstorm', icon: weatherIcons.storm };
        default: return { desc: 'Cloudy', icon: weatherIcons.cloud };
      }
    }

    // 3. Live Weather Fetch with Auto-Retry
    let weatherTimeout;

    async function fetchWeather() {
      clearTimeout(weatherTimeout);

      const lat = 14.6349;
      const lon = -90.5069;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=America%2FGuatemala`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();

        const current = data.current;
        const temp = Math.round(current.temperature_2m);
        const humidity = current.relative_humidity_2m;
        const weatherInfo = decodeWmo(current.weather_code);

        // Update DOM
        document.getElementById('weather-temp').textContent = `${temp}°C`;
        document.getElementById('weather-icon').innerHTML = weatherInfo.icon;
        document.getElementById('weather-desc').textContent = weatherInfo.desc;
        document.getElementById('weather-extra').textContent = `Humidity: ${humidity}%`;

        // Network dot turns green
        const dot = document.getElementById('live-indicator');
        dot.style.background = '#22c55e';
        dot.style.boxShadow = '0 0 8px #22c55e';

        // Success: check again in 15 mins (900,000 ms)
        weatherTimeout = setTimeout(fetchWeather, 15 * 60 * 1000);

      } catch (err) {
        if (document.getElementById('weather-temp').textContent === '--°C') {
          document.getElementById('weather-desc').textContent = 'Connecting...';
        }

        // Network dot turns red to indicate connection drop
        const dot = document.getElementById('live-indicator');
        dot.style.background = '#ef4444';
        dot.style.boxShadow = '0 0 8px #ef4444';

        // Fail: Pi is likely booting and Wi-Fi isn't up yet. Retry aggressively in 10 seconds.
        weatherTimeout = setTimeout(fetchWeather, 10000);
      }
    }

    // 4. Fetch System Data (data.json)
    let dataTimeout;
    async function fetchSystemData() {
      clearTimeout(dataTimeout);
      const ipElement = document.getElementById('ip-address');
      try {
        const res = await fetch('data.json?t=' + new Date().getTime());
        if (!res.ok) throw new Error('File not found');
        const data = await res.json();

        if (data.ip) ipElement.textContent = `IP: ${data.ip}`;
        if (data.cpu !== undefined) document.getElementById('cpu-val').textContent = `${data.cpu}%`;
        if (data.temp !== undefined) document.getElementById('temp-val').textContent = `${data.temp}°C`;
        if (data.ram !== undefined) document.getElementById('ram-val').textContent = `${data.ram}%`;
        if (data.disk !== undefined) document.getElementById('disk-val').textContent = `${data.disk}%`;

        if (data.history) {
          drawSparkline(document.getElementById('cpu-graph'), data.history.cpu, '#38bdf8', 0, 100);
          drawSparkline(document.getElementById('temp-graph'), data.history.temp, '#f59e0b', 30, 80);
          drawSparkline(document.getElementById('ram-graph'), data.history.ram, '#a855f7', 0, 100);
          drawSparkline(document.getElementById('disk-graph'), data.history.disk, '#10b981', 0, 100);
        }

        if (data.services) {
          const vaultSpan = document.getElementById('vault-status');
          vaultSpan.textContent = data.services.vaultwarden ? 'Active' : 'Down';
          vaultSpan.className = 'badge-status ' + (data.services.vaultwarden ? 'status-up' : 'status-down');

          const tailSpan = document.getElementById('tail-status');
          tailSpan.textContent = data.services.tailscale ? 'Active' : 'Down';
          tailSpan.className = 'badge-status ' + (data.services.tailscale ? 'status-up' : 'status-down');
        }
      } catch (e) {
        ipElement.textContent = 'IP: Not Available';
      }
      dataTimeout = setTimeout(fetchSystemData, 10000);
    }

    function drawSparkline(svgElement, data, color, minVal, maxVal) {
      if (!data || data.length === 0 || !svgElement) return;

      const width = 100;
      const height = 30;

      svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svgElement.setAttribute('preserveAspectRatio', 'none');
      svgElement.innerHTML = '';

      let dataMin = Math.min(...data);
      let dataMax = Math.max(...data);

      if (minVal !== undefined) dataMin = Math.min(dataMin, minVal);
      if (maxVal !== undefined) dataMax = Math.max(dataMax, maxVal);

      if (dataMax === dataMin) {
        dataMax += 1;
        dataMin = Math.max(0, dataMin - 1);
      }

      const range = dataMax - dataMin;

      const points = data.map((val, i) => {
        const x = data.length > 1 ? (i / (data.length - 1)) * width : 0;
        const y = height - ((val - dataMin) / range) * height;
        return { x, y };
      });

      const gradientId = 'grad-' + Math.random().toString(36).substr(2, 9);

      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
          <linearGradient id="${gradientId}" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="${color}" stop-opacity="0.0"/>
          </linearGradient>
      `;
      svgElement.appendChild(defs);

      const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let dFill = `M${points[0].x},${height} L${points[0].x},${points[0].y} `;
      for (let i = 1; i < points.length; i++) {
        dFill += `L${points[i].x},${points[i].y} `;
      }
      dFill += `L${points[points.length - 1].x},${height} Z`;

      fillPath.setAttribute('d', dFill);
      fillPath.setAttribute('fill', `url(#${gradientId})`);
      svgElement.appendChild(fillPath);

      const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let dLine = `M${points[0].x},${points[0].y} `;
      for (let i = 1; i < points.length; i++) {
        dLine += `L${points[i].x},${points[i].y} `;
      }
      linePath.setAttribute('d', dLine);
      linePath.setAttribute('fill', 'none');
      linePath.setAttribute('stroke', color);
      linePath.setAttribute('stroke-width', '1.5');
      linePath.setAttribute('stroke-linejoin', 'round');
      linePath.setAttribute('vector-effect', 'non-scaling-stroke');
      svgElement.appendChild(linePath);
    }

    // 5. Swipe Navigation
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let swipeDirection = null; // 'horizontal' or 'vertical'
    let currentPage = 0; // 0 = Clock, 1 = Dashboard
    let isSettingsVisible = false;
    const carousel = document.getElementById('carousel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const dotClock = document.getElementById('dot-clock');
    const dotDashboard = document.getElementById('dot-dashboard');

    function handleDragStart(e) {
      startX = e.clientX;
      startY = e.clientY;
      isDragging = true;
      swipeDirection = null;
      carousel.style.transition = 'none';
      settingsOverlay.style.transition = 'none';
    }

    function handleDragMove(e) {
      if (!isDragging) return;
      currentX = e.clientX;
      currentY = e.clientY;
      
      const diffX = currentX - startX;
      const diffY = currentY - startY;

      if (!swipeDirection) {
        if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
          swipeDirection = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
        }
      }

      if (swipeDirection === 'horizontal' && !isSettingsVisible) {
        let translate = (currentPage * -480) + diffX;
        if (translate > 0) translate = translate * 0.3;
        if (translate < -480) translate = -480 + ((translate + 480) * 0.3);
        carousel.style.transform = `translateX(${translate}px)`;
      } else if (swipeDirection === 'vertical') {
        if (!isSettingsVisible && diffY > 0) {
          // Pulling down from top
          let translate = -320 + diffY;
          if (translate > 0) translate = translate * 0.3;
          settingsOverlay.style.transform = `translateY(${translate}px)`;
        } else if (isSettingsVisible && diffY < 0) {
          // Pushing up from bottom
          let translate = diffY;
          if (translate < -320) translate = -320 + ((translate + 320) * 0.3);
          settingsOverlay.style.transform = `translateY(${translate}px)`;
        }
      }
    }

    function handleDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      const diffX = currentX - startX;
      const diffY = currentY - startY;

      carousel.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      settingsOverlay.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';

      if (swipeDirection === 'horizontal' && !isSettingsVisible) {
        if (diffX < -50 && currentPage === 0) {
          currentPage = 1; // Swipe left to Dashboard
        } else if (diffX > 50 && currentPage === 1) {
          currentPage = 0; // Swipe right to Clock
        }
        carousel.style.transform = `translateX(${currentPage * -480}px)`;
        dotClock.classList.toggle('active', currentPage === 0);
        dotDashboard.classList.toggle('active', currentPage === 1);
      } else if (swipeDirection === 'vertical') {
        if (!isSettingsVisible && diffY > 50) {
          isSettingsVisible = true;
          settingsOverlay.style.transform = `translateY(0)`;
        } else if (!isSettingsVisible) {
          settingsOverlay.style.transform = `translateY(-100%)`;
        } else if (isSettingsVisible && diffY < -50) {
          isSettingsVisible = false;
          settingsOverlay.style.transform = `translateY(-100%)`;
        } else if (isSettingsVisible) {
          settingsOverlay.style.transform = `translateY(0)`;
        }
      }
    }

    // Use Pointer Events to handle both mouse and touch transparently
    document.addEventListener('pointerdown', handleDragStart);
    document.addEventListener('pointermove', handleDragMove);
    document.addEventListener('pointerup', handleDragEnd);
    document.addEventListener('pointercancel', handleDragEnd);

    let pendingCommandUrl = null;

    function showConfirm(url) {
      pendingCommandUrl = url;
      document.getElementById('confirm-overlay').classList.add('active');
    }

    function closeConfirm(isConfirmed) {
      document.getElementById('confirm-overlay').classList.remove('active');
      if (isConfirmed && pendingCommandUrl) {
        const isReboot = pendingCommandUrl.includes('reboot');
        const msg = isReboot ? 'Rebooting...' : 'Shutting down...';
        
        const blackScreen = document.getElementById('black-screen-overlay');
        const blackMsg = document.getElementById('black-screen-message');
        
        blackMsg.textContent = msg;
        blackMsg.style.opacity = '1';
        blackScreen.classList.add('active');

        // Hide message after a few seconds, leaving screen completely black
        setTimeout(() => {
          blackMsg.style.opacity = '0';
        }, 3000);

        const urlToFetch = pendingCommandUrl;
        setTimeout(() => {
          fetch(urlToFetch, { method: 'POST' }).then(() => {
            console.log('Command sent:', urlToFetch);
          }).catch(err => {
            console.error('Failed to send command:', err);
          });
        }, 1500);
      }
      pendingCommandUrl = null;
    }

    // Initialize
    updateClock();
    setInterval(updateClock, 1000);
    fetchWeather();
    fetchSystemData();

