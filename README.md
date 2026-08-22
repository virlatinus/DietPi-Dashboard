# DietPi-Dashboard

A lightweight, 480x320 optimized web dashboard designed for a Raspberry Pi kiosk display (such as a DietPi setup). 

![Clock View](screenshot1.png)
![Dashboard View](screenshot2.png)

## Features
- **Real-time Clock & Date**: Clean and prominent display with automatic network status indicators.
- **Weather Integration**: Live weather updates using the Open-Meteo API.
- **System Monitoring**: View CPU load, Temperature, Memory usage, and Storage via sparkline graphs.
- **Swipe Navigation**: Touch-enabled carousel to switch between the clock and dashboard pages, and a swipe-down settings overlay for Power Off and Reboot.
- **Service Status**: Quick overview of running services like Vaultwarden and Tailscale.

## Setup
1. Use the included `update_ip.py` script to periodically generate `data.json` with the system's live metrics. Run it in the background:
   ```bash
   python update_ip.py &
   ```
2. Serve the directory and enable the API endpoints by running the custom server script. This handles static file serving as well as executing the power commands when triggered from the settings overlay:
   ```bash
   python server.py 8080
   ```
