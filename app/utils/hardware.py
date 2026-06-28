import subprocess
import hashlib
import platform

def get_hardware_fingerprint():
    """
    Generates a unique SHA-256 fingerprint for the current hardware.
    Combines CPU ProcessorID and Motherboard Serial Number.
    """
    system = platform.system()
    components = []

    try:
        if system == "Windows":
            # Get CPU ID
            cpu_cmd = 'powershell -Command "Get-CimInstance Win32_Processor | Select-Object -ExpandProperty ProcessorId"'
            cpu_id = subprocess.check_output(cpu_cmd, shell=True).decode().strip()
            components.append(cpu_id)

            # Get Motherboard Serial
            mb_cmd = 'powershell -Command "Get-CimInstance Win32_BaseBoard | Select-Object -ExpandProperty SerialNumber"'
            mb_serial = subprocess.check_output(mb_cmd, shell=True).decode().strip()
            components.append(mb_serial)
        else:
            # Fallback for non-windows (e.g. Linux machine-id)
            import socket
            components.append(socket.gethostname())
    except Exception:
        # Extreme fallback
        components.append("NIMAPOS-GENERIC-HFP-001")

    # Combine and hash
    raw_id = "|".join(components)
    return hashlib.sha256(raw_id.encode()).hexdigest()

if __name__ == "__main__":
    print(f"Hardware Fingerprint: {get_hardware_fingerprint()}")
