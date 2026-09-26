"""
=============================================
Arduino IDE - Backend Server
=============================================

This server handles:
  - Saving and loading project files (.bbp)
  - Compiling and uploading Arduino C++ sketches via Arduino CLI
  - Real-time Serial Monitor with SSE streaming
  - Auto-detecting connected Arduino boards (Uno, Nano, Mega, etc.)
  - Serving the frontend web app

Author: Arduino IDE Block Coding
License: MIT
"""

import os
import sys
import json
import subprocess
import tempfile
import shutil
import threading
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS

# Setup PATH for Arduino CLI
path_separator = ';' if sys.platform == 'win32' else ':'
paths_to_add = [
    os.path.expanduser('~/bin'),
]
if sys.platform == 'win32':
    local_app_data = os.environ.get('LOCALAPPDATA', '')
    if local_app_data:
        paths_to_add.append(os.path.join(local_app_data, 'Arduino15'))
        paths_to_add.append(os.path.join(local_app_data, 'Programs', 'arduino-ide'))

existing_paths = [p for p in paths_to_add if os.path.isdir(p)]
system_path = os.environ.get('PATH', '')
if system_path:
    existing_paths.append(system_path)

os.environ['PATH'] = path_separator.join(existing_paths)

# ==========================================
# App Configuration
# ==========================================

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

app = Flask(__name__, static_folder='..', static_url_path='')
CORS(app)

@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# User-writable projects directory
if sys.platform == 'win32':
    _appdata = os.environ.get('APPDATA', os.path.expanduser('~'))
    PROJECTS_DIR = os.path.join(_appdata, 'ArduinoBlockCoding', 'projects')
else:
    PROJECTS_DIR = os.path.join(os.path.expanduser('~'), '.arduinoblockcoding', 'projects')
os.makedirs(PROJECTS_DIR, exist_ok=True)

# Locate arduino-cli binary
ARDUINO_CLI_PATH = (
    shutil.which('arduino-cli') or
    shutil.which('arduino-cli.exe') or
    os.path.expanduser('~/bin/arduino-cli') or
    os.path.expanduser('~/bin/arduino-cli.exe')
)

# Auto-detect serial port for Arduino
def detect_boards_and_ports():
    """
    Detect connected Arduino boards — ONLY returns ports with a confirmed board.
    Bluetooth virtual COM ports (BTHENUM) are always skipped.
    Returns: [{'port': 'COM7', 'fqbn': 'arduino:avr:uno', 'label': '...', 'is_usb': True}]
    """
    detected = []

    # 1. arduino-cli board list — ONLY add ports that have a confirmed matching board
    if ARDUINO_CLI_PATH and os.path.isfile(ARDUINO_CLI_PATH):
        try:
            cmd = [ARDUINO_CLI_PATH, 'board', 'list', '--format', 'json']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=8)
            if result.returncode == 0:
                data = json.loads(result.stdout)
                ports = data.get('detected_ports', [])
                for p in ports:
                    address = p.get('port', {}).get('address', '')
                    label   = p.get('port', {}).get('label', address)
                    proto   = p.get('port', {}).get('protocol_label', '')
                    matching = p.get('matching_boards', [])

                    if not address:
                        continue

                    # Skip ports with NO matched board (Unknown = Bluetooth / generic serial)
                    if not matching:
                        continue

                    # Pick best FQBN — prefer avr/uno
                    fqbn = None
                    board_name = ''
                    for m in matching:
                        m_fqbn = m.get('fqbn', '')
                        if 'uno' in m_fqbn.lower() or 'avr' in m_fqbn.lower():
                            fqbn = m_fqbn
                            board_name = m.get('name', '')
                            break
                    if not fqbn:
                        fqbn = matching[0].get('fqbn', 'arduino:avr:uno')
                        board_name = matching[0].get('name', '')

                    if board_name:
                        label = f"{address} ({board_name})"

                    is_usb = 'usb' in proto.lower() or 'usb' in label.lower()
                    detected.append({
                        'port': address,
                        'fqbn': fqbn,
                        'label': label,
                        'is_usb': is_usb,
                        'confirmed': True,
                    })
        except Exception as e:
            print(f"[ESPD] arduino-cli board list error: {e}")

    # 2. Fallback: serial.tools.list_ports (skip Bluetooth by hwid)
    try:
        import serial.tools.list_ports
        for p in serial.tools.list_ports.comports():
            # Already found by arduino-cli
            if any(d['port'] == p.device for d in detected):
                continue

            desc = (p.description or '').lower()
            hwid = (p.hwid or '').lower()

            # Hard skip: Bluetooth virtual COM ports
            if ('bluetooth' in desc or 'bthenum' in hwid or
                    hwid.startswith('bth') or 'bth' in hwid.split('\\')[0].lower()):
                continue

            is_usb = (hwid.startswith('usb') or
                      any(x in desc for x in ['usb', 'uart', 'ch340', 'cp210', 'ftdi', 'arduino', 'uno']))

            detected.append({
                'port': p.device,
                'fqbn': 'arduino:avr:uno',
                'label': f"{p.device} - {p.description}" if p.description else p.device,
                'is_usb': is_usb,
                'confirmed': False,
            })
    except Exception as e:
        print(f"[ESPD] serial.tools.list_ports error: {e}")

    # Sort: confirmed USB Arduino boards first, then other USB, then rest
    detected.sort(key=lambda x: (
        not x.get('confirmed', False),
        not x.get('is_usb', False),
        x['port']
    ))

    print(f"[ESPD] Detected boards: {[d['port'] + ' -> ' + d['fqbn'] for d in detected]}")
    return detected


def detect_arduino_port():
    boards = detect_boards_and_ports()
    if boards:
        return boards[0]['port']
    if sys.platform == 'win32':
        return 'COM3'
    elif sys.platform == 'darwin':
        return '/dev/cu.usbmodem14101'
    return '/dev/ttyACM0'

DEFAULT_PORT = detect_arduino_port()

def _project_path(filename, add_extension=False):
    """Return a safe path inside PROJECTS_DIR for a .bbp project file."""
    if not isinstance(filename, str):
        raise ValueError('Project name must be a string')

    filename = filename.strip()
    if add_extension and filename and not filename.lower().endswith('.bbp'):
        filename += '.bbp'

    if not filename or filename.lower() == '.bbp':
        raise ValueError('Project name cannot be empty')
    if not filename.lower().endswith('.bbp'):
        raise ValueError('Project filename must end with .bbp')
    if any(char in filename for char in ('/', '\\', '\x00')):
        raise ValueError('Project name cannot contain path separators')
    if any(ord(char) < 32 for char in filename):
        raise ValueError('Project name contains invalid characters')

    projects_root = os.path.abspath(PROJECTS_DIR)
    filepath = os.path.abspath(os.path.join(projects_root, filename))
    if os.path.commonpath((projects_root, filepath)) != projects_root:
        raise ValueError('Invalid project path')
    return filepath

# ==========================================
# Routes: Frontend Serving
# ==========================================

@app.route('/')
def serve_frontend():
    return send_from_directory(PROJECT_ROOT, 'index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(PROJECT_ROOT, 'favicon.svg', mimetype='image/svg+xml')

# ==========================================
# Routes: Project Management
# ==========================================

@app.route('/api/save', methods=['POST'])
def save_project():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or 'workspace' not in data:
            return jsonify({'success': False, 'error': 'Invalid project data'}), 400

        project = {
            'name': data.get('name', 'untitled'),
            'version': '2.0',
            'target': 'arduino',
            'saved': datetime.now().isoformat(),
            'language': data.get('language', 'en'),
            'workspace': data['workspace'],
        }

        filepath = _project_path(project['name'], add_extension=True)
        filename = os.path.basename(filepath)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(project, f, indent=2, ensure_ascii=False)

        return jsonify({
            'success': True,
            'message': f'Project saved as {filename}',
            'filename': filename,
        })
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/load/<filename>', methods=['GET'])
def load_project(filename):
    try:
        filepath = _project_path(filename)
        if not os.path.exists(filepath):
            return jsonify({'success': False, 'error': 'Project not found'}), 404

        with open(filepath, 'r', encoding='utf-8') as f:
            project = json.load(f)

        return jsonify({'success': True, 'project': project})
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/projects', methods=['GET'])
def list_projects():
    try:
        files = [f for f in os.listdir(PROJECTS_DIR) if f.endswith('.bbp')]
        files.sort(key=lambda f: os.path.getmtime(os.path.join(PROJECTS_DIR, f)), reverse=True)
        return jsonify({'success': True, 'projects': files})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/delete/<filename>', methods=['DELETE'])
def delete_project(filename):
    try:
        filepath = _project_path(filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({'success': True, 'message': 'Project deleted'})
        return jsonify({'success': False, 'error': 'File not found'}), 404
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==========================================
# Routes: Port Detection & Upload
# ==========================================

@app.route('/api/detect-port', methods=['GET'])
def detect_port():
    try:
        boards = detect_boards_and_ports()
        return jsonify({
            'success': True,
            'ports': [{'address': b['port'], 'fqbn': b['fqbn'], 'label': b['label']} for b in boards]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/upload-arduino', methods=['POST'])
@app.route('/upload', methods=['POST'])
@app.route('/api/upload', methods=['POST'])
def upload_arduino_to_board():
    """
    Compile and upload Arduino C++ sketch to Arduino board via Arduino CLI.
    """
    logs = []
    temp_dir = None

    def log_step(message):
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        logs.append(f"[{timestamp}] {message}")
        try:
            print(f"[Arduino Upload] {message}")
        except UnicodeEncodeError:
            print(f"[Arduino Upload] {message.encode('ascii', 'replace').decode('ascii')}")

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({
            'success': False,
            'error': 'Request body must be a JSON object',
            'logs': logs,
        }), 400

    if not ARDUINO_CLI_PATH or not os.path.isfile(ARDUINO_CLI_PATH):
        return jsonify({
            'success': False,
            'error': (
                'arduino-cli not found on this system.\n\n'
                'Please install arduino-cli:\n'
                '  Windows: winget install ArduinoSA.CLI\n'
                '  Website: https://arduino.github.io/arduino-cli/latest/installation/\n\n'
                'After installing, make sure arduino-cli is in your PATH.'
            ),
            'logs': [f'[ERROR] arduino-cli not found. ARDUINO_CLI_PATH={ARDUINO_CLI_PATH}']
        }), 500

    try:
        code = data.get('code', '')
        port = data.get('port', '')
        fqbn = data.get('fqbn', 'arduino:avr:uno')
        baud_rate = data.get('baud_rate', '9600')

        if not isinstance(code, str) or not code.strip():
            return jsonify({'success': False, 'error': 'No code provided', 'logs': logs}), 400

        log_step("Starting Arduino compilation & upload pipeline.")
        log_step(f"Sketch size: {len(code)} bytes.")
        log_step(f"Selected board FQBN: {fqbn}")

        # 1. Resolve Port and FQBN
        detected_boards = detect_boards_and_ports()
        if not port or port == 'auto':
            if detected_boards:
                port = detected_boards[0]['port']
                log_step(f"Auto-detected port: {port}")
            else:
                port = DEFAULT_PORT
                log_step(f"No port detected, using default: {port}")
        else:
            log_step(f"Using port: {port}")

        if not fqbn or fqbn == 'auto':
            fqbn = 'arduino:avr:uno'

        # 1b. Always force-close Serial Monitor before uploading.
        #     Windows does not allow two processes to own the same COM port.
        log_step("Ensuring Serial Monitor is closed before upload...")
        _serial_mon['running'] = False
        if _serial_mon.get('reader_thread') and _serial_mon['reader_thread'].is_alive():
            _serial_mon['reader_thread'].join(timeout=2)
        ser = _serial_mon.get('serial')
        if ser:
            try:
                ser.close()
            except Exception:
                pass
        _serial_mon['serial'] = None
        with _serial_mon['lock']:
            _serial_mon['buffer'].clear()
        # Give Windows time to fully release the COM port handle
        time.sleep(0.5)
        log_step(f"Port {port} is free. Proceeding with upload...")

        # 2. Create temporary sketch directory
        temp_dir = tempfile.mkdtemp(prefix='arduino_sketch_')
        sketch_name = os.path.basename(temp_dir)
        sketch_dir = os.path.join(temp_dir, sketch_name)
        os.makedirs(sketch_dir, exist_ok=True)
        ino_file = os.path.join(sketch_dir, f"{sketch_name}.ino")

        # Double safety: ensure sketch has valid setup() and loop() functions
        if 'void setup(' not in code or 'void loop(' not in code:
            log_step("Auto-wrapping bare statements into Arduino setup() and loop()...")
            lines = [l.strip() for l in code.strip().split('\n') if l.strip()]
            setup_lines = [f"  {l}" for l in lines if l.startswith('pinMode') or l.startswith('Serial.begin')]
            loop_lines = [f"  {l}" for l in lines if not (l.startswith('pinMode') or l.startswith('Serial.begin'))]
            
            code = "// Auto-wrapped by ESPD IDE\nvoid setup() {\n  Serial.begin(9600);\n"
            if setup_lines:
                code += '\n'.join(setup_lines) + '\n'
            code += "}\n\nvoid loop() {\n"
            if loop_lines:
                code += '\n'.join(loop_lines) + '\n'
            code += "}\n"

        with open(ino_file, 'w', encoding='utf-8') as f:
            f.write(code)
        log_step(f"Wrote generated Arduino sketch to {ino_file}")

        # 3. Compile the sketch
        compile_cmd = [
            ARDUINO_CLI_PATH,
            'compile',
            '--fqbn', fqbn,
            '--clean',
            sketch_dir
        ]
        log_step(f"Compiling sketch: {' '.join(compile_cmd)}")
        compile_result = subprocess.run(
            compile_cmd,
            capture_output=True,
            text=True,
            timeout=180,
        )

        compile_output = (compile_result.stdout or '') + (compile_result.stderr or '')
        if compile_result.returncode != 0:
            log_step(f"[Compilation Failed]\n{compile_output}")
            return jsonify({
                'success': False,
                'error': f"Compilation failed:\n{compile_output}",
                'logs': logs,
                'step': 'compile'
            }), 400

        log_step("Compilation completed successfully!")

        # 4. Upload to Arduino Board
        upload_cmd = [
            ARDUINO_CLI_PATH,
            'upload',
            '--fqbn', fqbn,
            '--port', port,
            sketch_dir
        ]
        log_step(f"Uploading sketch: {' '.join(upload_cmd)}")
        upload_result = subprocess.run(
            upload_cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )

        upload_output = (upload_result.stdout or '') + (upload_result.stderr or '')
        if upload_result.returncode != 0:
            log_step(f"[Upload Failed]\n{upload_output}")
            return jsonify({
                'success': False,
                'error': f"Upload failed:\n{upload_output}",
                'logs': logs,
                'step': 'upload'
            }), 400

        log_step("Sketch uploaded successfully to Arduino board!")
        return jsonify({
            'success': True,
            'message': 'Code uploaded successfully to Arduino board!',
            'logs': logs,
            'flash_verified': True
        })

    except subprocess.TimeoutExpired:
        log_step("Upload timed out.")
        return jsonify({'success': False, 'error': 'Operation timed out', 'logs': logs}), 500
    except Exception as e:
        log_step(f"Unexpected error: {str(e)}")
        return jsonify({'success': False, 'error': str(e), 'logs': logs}), 500
    finally:
        if temp_dir:
            shutil.rmtree(temp_dir, ignore_errors=True)

# ==========================================
# Routes: Serial Monitor
# ==========================================

_serial_mon = {
    'serial': None,
    'running': False,
    'port': None,
    'baud': 9600,
    'buffer': [],
    'lock': threading.Lock(),
    'reader_thread': None,
}

def _serial_reader(ser):
    import serial
    try:
        while _serial_mon.get('running') and ser and ser.is_open:
            if ser.in_waiting:
                raw = ser.read(ser.in_waiting)
                text = raw.decode('utf-8', errors='replace')
                with _serial_mon['lock']:
                    _serial_mon['buffer'].append(text)
            time.sleep(0.02)
    except serial.SerialException:
        pass
    except Exception:
        pass
    finally:
        if ser and ser.is_open:
            try:
                ser.close()
            except Exception:
                pass
        if _serial_mon.get('serial') is ser:
            _serial_mon['running'] = False
            _serial_mon['serial'] = None

@app.route('/api/serial-monitor/open', methods=['POST'])
def serial_open():
    import serial
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'success': False, 'error': 'Request body must be a JSON object'}), 400
    port = data.get('port', DEFAULT_PORT)
    if not isinstance(port, str) or not port:
        return jsonify({'success': False, 'error': 'Port must be a non-empty string'}), 400
    try:
        baud = int(data.get('baud', 9600))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'error': 'Baud rate must be an integer'}), 400
    if baud <= 0:
        return jsonify({'success': False, 'error': 'Baud rate must be positive'}), 400

    _serial_mon['running'] = False
    if _serial_mon['reader_thread'] and _serial_mon['reader_thread'].is_alive():
        _serial_mon['reader_thread'].join(timeout=2)
    if _serial_mon['serial'] and _serial_mon['serial'].is_open:
        try:
            _serial_mon['serial'].close()
        except Exception:
            pass
    _serial_mon['serial'] = None
    with _serial_mon['lock']:
        _serial_mon['buffer'].clear()

    try:
        ser = serial.Serial(port, baud, timeout=0.05, write_timeout=0.1)
        _serial_mon['serial'] = ser
        _serial_mon['port'] = port
        _serial_mon['baud'] = baud
        _serial_mon['running'] = True
        t = threading.Thread(target=_serial_reader, args=(ser,), daemon=True)
        _serial_mon['reader_thread'] = t
        t.start()
        return jsonify({'success': True, 'message': f'Connected to {port} at {baud} baud', 'port': port, 'baud': baud})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/serial-monitor/stream')
def serial_stream():
    def generate():
        yield f"data: {json.dumps({'type':'info','message':'Stream connected'})}\n\n"
        while _serial_mon.get('running'):
            try:
                lines = []
                with _serial_mon['lock']:
                    if _serial_mon['buffer']:
                        lines = list(_serial_mon['buffer'])
                        _serial_mon['buffer'].clear()
                for line in lines:
                    yield f"data: {json.dumps({'type':'data','text':line})}\n\n"
                if not lines:
                    yield f"data: {json.dumps({'type':'keepalive'})}\n\n"
                time.sleep(0.1)
            except GeneratorExit:
                break
            except Exception as e:
                yield f"data: {json.dumps({'type':'error','message':str(e)})}\n\n"
                break
        yield f"data: {json.dumps({'type':'error','message':'Disconnected'})}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*',
        }
    )

@app.route('/api/serial-monitor/send', methods=['POST'])
def serial_send():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'success': False, 'error': 'Request body must be a JSON object'}), 400
    text = data.get('text', '')
    if not isinstance(text, str):
        return jsonify({'success': False, 'error': 'Text must be a string'}), 400
    ser = _serial_mon.get('serial')
    if not ser or not ser.is_open:
        return jsonify({'success': False, 'error': 'Not connected'}), 400
    try:
        ser.write(text.encode('utf-8'))
        return jsonify({'success': True, 'sent': text})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/serial-monitor/close', methods=['POST'])
def serial_close():
    _serial_mon['running'] = False
    if _serial_mon['reader_thread'] and _serial_mon['reader_thread'].is_alive():
        _serial_mon['reader_thread'].join(timeout=2)
    ser = _serial_mon.get('serial')
    if ser:
        try:
            ser.close()
        except Exception:
            pass
    _serial_mon['serial'] = None
    with _serial_mon['lock']:
        _serial_mon['buffer'].clear()
    return jsonify({'success': True, 'message': 'Disconnected'})

# ==========================================
# Error Handlers
# ==========================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

# ==========================================
# Main Entry Point
# ==========================================

if __name__ == '__main__':
    print("=" * 50)
    print("  ESPD IDE - Backend Server")
    print("=" * 50)
    print(f"  Projects directory: {os.path.abspath(PROJECTS_DIR)}")
    print(f"  Target: Arduino Uno / AVR Boards")
    print(f"  Server starting on: http://localhost:5001")
    print("=" * 50)

    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False,
    )
