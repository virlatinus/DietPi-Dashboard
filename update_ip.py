import socket
import json
import time
import os
import subprocess

def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0)
        s.connect(('10.254.254.254', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def get_cpu_temp():
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            return round(int(f.read().strip()) / 1000.0, 1)
    except Exception:
        return 0.0

def get_cpu_usage():
    try:
        with open('/proc/stat', 'r') as f:
            lines = f.readlines()
        for line in lines:
            if line.startswith('cpu '):
                parts = [int(p) for p in line.split()[1:]]
                idle = parts[3]
                total = sum(parts)
                return idle, total
    except:
        return 0, 1

def get_mem_usage():
    try:
        out = subprocess.check_output(['free', '-m']).decode('utf-8')
        lines = out.split('\n')
        mem_line = lines[1].split()
        total = int(mem_line[1])
        used = int(mem_line[2])
        return round((used / total) * 100, 1) if total > 0 else 0
    except:
        return 0.0

def get_disk_usage():
    try:
        out = subprocess.check_output(['df', '-h', '/']).decode('utf-8')
        lines = out.split('\n')
        disk_line = lines[1].split()
        usage = disk_line[4].replace('%', '')
        return int(usage)
    except:
        return 0

def get_service_status(service_name):
    if service_name == 'vaultwarden':
        try:
            # Standalone Vaultwarden running on port 8001
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1.0)
                if s.connect_ex(('127.0.0.1', 8001)) == 0:
                    return True
        except Exception:
            pass
        return False

    try:
        out = subprocess.check_output(['systemctl', 'is-active', service_name], stderr=subprocess.DEVNULL).decode('utf-8').strip()
        if out == 'active':
            return True
    except subprocess.CalledProcessError:
        pass
            
    return False

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, 'data.json')
    
    prev_idle, prev_total = get_cpu_usage()
    
    history_len = 60
    history = {
        "cpu": [],
        "temp": [],
        "ram": [],
        "disk": []
    }
    
    while True:
        time.sleep(1) # Wait a sec to get CPU diff
        curr_idle, curr_total = get_cpu_usage()
        
        cpu_diff = curr_total - prev_total
        idle_diff = curr_idle - prev_idle
        
        cpu_usage = 0
        if cpu_diff > 0:
            cpu_usage = round(100.0 * (1.0 - idle_diff / cpu_diff), 1)
            
        prev_idle, prev_total = curr_idle, curr_total
        
        current_ip = get_ip_address()
        cpu_temp = get_cpu_temp()
        mem_usage = get_mem_usage()
        disk_usage = get_disk_usage()
        
        vault_status = get_service_status('vaultwarden')
        tail_status = get_service_status('tailscaled')
        
        history["cpu"].append(cpu_usage)
        history["temp"].append(cpu_temp)
        history["ram"].append(mem_usage)
        history["disk"].append(disk_usage)
        
        for k in history:
            history[k] = history[k][-history_len:]
        
        data = {
            "ip": current_ip,
            "cpu": cpu_usage,
            "temp": cpu_temp,
            "ram": mem_usage,
            "disk": disk_usage,
            "history": history,
            "services": {
                "vaultwarden": vault_status,
                "tailscale": tail_status
            }
        }
        
        try:
            with open(json_path, 'w') as f:
                json.dump(data, f)
            print(f"Updated data: {data}")
        except Exception as e:
            print(f"Error writing data.json: {e}")
            
        time.sleep(14) # Check ~4 times a minute

if __name__ == '__main__':
    main()
