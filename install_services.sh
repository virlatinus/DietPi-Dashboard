#!/bin/bash

# Ensure the script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run this script with sudo or as root."
  exit 1
fi

echo "============================================="
echo "Migrating rc.local Python scripts to systemd"
echo "============================================="

# 1. Create IP Update Service
echo "Creating ip-update.service..."
cat << 'EOF' > /etc/systemd/system/ip-update.service
[Unit]
Description=Update IP Address Script
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /var/www/html/update_ip.py
Restart=on-failure
RestartSec=10
StandardOutput=null
StandardError=null

[Install]
WantedBy=multi-user.target
EOF

# 2. Create Python Web Server Service
echo "Creating python-server.service..."
cat << 'EOF' > /etc/systemd/system/python-server.service
[Unit]
Description=Python Web Server on Port 8000
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /var/www/html/server.py 8000
Restart=always
RestartSec=5
StandardOutput=null
StandardError=null

[Install]
WantedBy=multi-user.target
EOF

# 3. Reload systemd daemon to recognize new services
echo "Reloading systemd daemon..."
systemctl daemon-reload

# 4. Enable and start the new services
echo "Enabling and starting new services..."
systemctl enable ip-update.service
systemctl start ip-update.service

systemctl enable python-server.service
systemctl start python-server.service

# 5. Safely comment out the old entries in /etc/rc.local
if [ -f /etc/rc.local ]; then
    echo "Commenting out old entries in /etc/rc.local..."
    sed -i 's|.*update_ip.py.*|# & # Migrated to systemd|' /etc/rc.local
    sed -i 's|.*server.py 8000.*|# & # Migrated to systemd|' /etc/rc.local
fi

echo "============================================="
echo "Migration successful!"
echo "============================================="
echo "Check ip-update status:     systemctl status ip-update"
echo "Check python-server status: systemctl status python-server"
