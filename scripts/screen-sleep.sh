#!/bin/sh

sudo systemctl stop getty@tty1.service
sudo dd if=/dev/zero of=/dev/fb1 2>/dev/null
