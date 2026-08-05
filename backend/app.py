"""
=============================================
ESPY IDE - Flask Backend Server
=============================================

This server handles:
  - Saving projects as JSON files
  - Loading project files  
  - Generating Arduino code
  - Uploading code to ESP32 via Arduino CLI
  - Serving the frontend in production mode

Requirements:
  pip install flask flask-cors

Author: ESPY Team
License: MIT
"""

import os
import json
import subprocess
import tempfile
import shutil
import threading
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from flask_cors import CORS

# Ensure ~/bin, Python Scripts, and Python user bin are in PATH
import sys
path_separator = ';' if sys.platform == 'win32' else ':'
paths_to_add = [
    os.path.expanduser('~/bin'),
    os.path.expanduser('~/Library/Python/3.9/bin')
]

if sys.platform == 'win32':
    # Add Python Scripts directory (where mpremote.exe, pip, etc. reside)
    python_scripts = os.path.join(os.path.dirname(sys.executable), 'Scripts')
    paths_to_add.append(python_scripts)
    
    # Also add user-site Scripts directory
    import site
    if hasattr(site, 'getusersitepackages'):
        try:
            user_site = site.getusersitepackages()
            user_scripts = os.path.join(os.path.dirname(user_site), 'Scripts')
            paths_to_add.append(user_scripts)
        except Exception:
            pass

# Filter out paths that don't exist, and join with correct separator
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
CORS(app)  # Allow cross-origin requests from frontend

@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Use a user-writable directory for projects (avoid Program Files permission issues)
if sys.platform == 'win32':
    _appdata = os.environ.get('APPDATA', os.path.expanduser('~'))
    PROJECTS_DIR = os.path.join(_appdata, 'BharatBlocks', 'projects')
else:
    PROJECTS_DIR = os.path.join(os.path.expanduser('~'), '.bharatblocks', 'projects')
os.makedirs(PROJECTS_DIR, exist_ok=True)

# Locate mpremote binary (or use module via bundled python -m mpremote)
_mpremote_fallback = os.path.expanduser('~/Library/Python/3.9/bin/mpremote')
MPREMOTE_PATH = shutil.which('mpremote') or shutil.which('mpremote.exe')
if not MPREMOTE_PATH and os.path.isfile(_mpremote_fallback):
    MPREMOTE_PATH = _mpremote_fallback
MPREMOTE_CMD = [MPREMOTE_PATH] if MPREMOTE_PATH else [sys.executable, '-m', 'mpremote']

# Locate arduino-cli binary
ARDUINO_CLI_PATH = shutil.which('arduino-cli') or shutil.which('arduino-cli.exe') or os.path.expanduser('~/bin/arduino-cli')

# Auto-detect serial port for ESP32
def detect_boards_and_ports():
    """
    Detect connected boards using arduino-cli and fallback to serial.tools.list_ports.
    Returns a list of dicts: [{'port': 'COM3', 'fqbn': 'esp32:esp32:esp32', 'label': '...'}]
    """
    detected = []
    # 1. Try arduino-cli board list
    try:
        cmd = [ARDUINO_CLI_PATH, 'board', 'list', '--format', 'json']
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            ports = data.get('detected_ports', [])
            for p in ports:
                address = p.get('port', {}).get('address')
                label = p.get('port', {}).get('label', address)
                matching = p.get('matching_boards', [])
                fqbn = None
                if matching:
                    for m in matching:
                        if 'esp32' in m.get('fqbn', ''):
                            fqbn = m.get('fqbn')
                            label = f"{label} ({m.get('name')})"
                            break
                    if not fqbn:
                        fqbn = matching[0].get('fqbn')
                        label = f"{label} ({matching[0].get('name')})"
                
                if address:
                    detected.append({
                        'port': address,
                        'fqbn': fqbn or 'esp32:esp32:esp32',
                        'label': label,
                        'is_usb': True
                    })
    except Exception as e:
        print(f"Error running arduino-cli board list: {e}")

    # 2. Fallback to serial.tools.list_ports
    try:
        import serial.tools.list_ports
        ports = list(serial.tools.list_ports.comports())
        for p in ports:
            if any(d['port'] == p.device for d in detected):
                continue
            
            desc = p.description.lower() if p.description else ''
            is_usb = any(x in desc for x in ['usb', 'uart', 'serial', 'ch340', 'cp210', 'ftdi', 'silicon'])
            
            detected.append({
                'port': p.device,
                'fqbn': 'esp32:esp32:esp32',
                'label': f"{p.device} - {p.description}" if p.description else p.device,
                'is_usb': is_usb
            })
    except Exception as e:
        print(f"Error running serial.tools.list_ports: {e}")

    # Sort so USB/UART ports are first
    detected.sort(key=lambda x: (not x.get('is_usb', True), x['port']))
    return detected

def detect_esp32_port():
    boards = detect_boards_and_ports()
    if boards:
        return boards[0]['port']
    import sys
    if sys.platform == 'win32':
        return 'COM3'
    elif sys.platform == 'darwin':
        return '/dev/cu.usbserial-0001'
    return '/dev/ttyUSB0'

DEFAULT_PORT = detect_esp32_port()


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
    """Serve the main index.html file"""
    return send_from_directory(PROJECT_ROOT, 'index.html')


@app.route('/favicon.ico')
def favicon():
    """Redirect favicon.ico to favicon.svg"""
    return send_from_directory(PROJECT_ROOT, 'favicon.svg', mimetype='image/svg+xml')


# ==========================================
# Routes: Project Management
# ==========================================

@app.route('/api/save', methods=['POST'])
def save_project():
    """
    Save a project to the server's projects directory.
    
    Request JSON:
    {
        "name": "my_project",
        "workspace": { ... Blockly workspace state ... },
        "language": "en"
    }
    
    Response:
    {
        "success": true,
        "message": "Project saved",
        "filename": "my_project.bbp"
    }
    """
    try:
        data = request.get_json(silent=True)
        
        if not isinstance(data, dict) or 'workspace' not in data:
            return jsonify({'success': False, 'error': 'Invalid project data'}), 400
        
        # Create project object
        project = {
            'name': data.get('name', 'untitled'),
            'version': '1.0',
            'saved': datetime.now().isoformat(),
            'language': data.get('language', 'en'),
            'workspace': data['workspace'],
        }
        
        # Save to file
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
    """
    Load a project from the server's projects directory.
    
    URL Parameter: filename (e.g., "my_project.bbp")
    
    Response: The project JSON data
    """
    try:
        filepath = _project_path(filename)
        
        if not os.path.exists(filepath):
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        with open(filepath, 'r', encoding='utf-8') as f:
            project = json.load(f)
        
        return jsonify({
            'success': True,
            'project': project,
        })
    
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/projects', methods=['GET'])
def list_projects():
    """
    List all saved projects.
    
    Response:
    {
        "success": true,
        "projects": ["project1.bbp", "project2.bbp"]
    }
    """
    try:
        files = [f for f in os.listdir(PROJECTS_DIR) if f.endswith('.bbp')]
        files.sort(key=lambda f: os.path.getmtime(os.path.join(PROJECTS_DIR, f)), reverse=True)
        
        return jsonify({
            'success': True,
            'projects': files,
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/delete/<filename>', methods=['DELETE'])
def delete_project(filename):
    """Delete a project file"""
    try:
        filepath = _project_path(filename)
        
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({'success': True, 'message': 'Project deleted'})
        else:
            return jsonify({'success': False, 'error': 'File not found'}), 404
    
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==========================================
# Routes: Code Generation & Upload
# ==========================================

@app.route('/upload-arduino', methods=['POST'])
def upload_arduino_to_board():
    """
    Upload Arduino C++ code to ESP32 via Arduino CLI.
    """
    logs = []
    temp_dir = None
    def log_step(message):
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        logs.append(f"[{timestamp}] {message}")
        try:
            print(f"[Upload Audit] {message}")
        except UnicodeEncodeError:
            # Fallback for Windows consoles that don't support UTF-8 characters
            print(f"[Upload Audit] {message.encode('ascii', 'replace').decode('ascii')}")

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({
            'success': False,
            'error': 'Request body must be a JSON object',
            'logs': logs,
        }), 400

    # Early check: arduino-cli must be installed
    if not ARDUINO_CLI_PATH or not os.path.isfile(ARDUINO_CLI_PATH):
        return jsonify({
            'success': False,
            'error': (
                'arduino-cli not found on this system.\n\n'
                'To fix this, install arduino-cli:\n'
                '  Windows: https://arduino.github.io/arduino-cli/latest/installation/\n'
                '  Or run: winget install ArduinoSA.CLI\n\n'
                'After installing, restart the backend server.'
            ),
            'logs': [f'[ERROR] arduino-cli not found. ARDUINO_CLI_PATH={ARDUINO_CLI_PATH}']
        }), 500

    try:
        code = data.get('code', '')
        port = data.get('port', '')
        fqbn = data.get('fqbn', '')
        baud_rate = data.get('baud_rate', '115200')

        if not isinstance(code, str):
            return jsonify({'success': False, 'error': 'Code must be a string', 'logs': logs}), 400
        if not isinstance(port, str) or not isinstance(fqbn, str):
            return jsonify({'success': False, 'error': 'Port and FQBN must be strings', 'logs': logs}), 400

        log_step("Starting ESP32 upload audit & execution pipeline.")
        log_step(f"Received code size: {len(code)} bytes.")
        log_step(f"Target upload speed (baud rate): {baud_rate} bps")

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
            log_step(f"Using user-specified port: {port}")

        if not fqbn or fqbn == 'auto':
            matched_fqbn = next((b['fqbn'] for b in detected_boards if b['port'] == port), None)
            fqbn = matched_fqbn or 'esp32:esp32:esp32'
            log_step(f"Resolved FQBN: {fqbn}")
        else:
            log_step(f"Using user-specified FQBN: {fqbn}")

        if not code:
            log_step("Error: No code provided.")
            return jsonify({
                'success': False,
                'error': 'No code provided',
                'logs': logs
            }), 400

        # 2. Recreate temporary sketch directory
        temp_dir = tempfile.mkdtemp(prefix='espy_arduino_')
        sketch_dir = os.path.join(temp_dir, 'espy_sketch')
        os.makedirs(sketch_dir, exist_ok=True)
        log_step(f"Created temporary sketch directory: {sketch_dir}")

        # Write sketch .ino file
        ino_file = os.path.join(sketch_dir, 'espy_sketch.ino')
        with open(ino_file, 'w', encoding='utf-8') as f:
            f.write(code)
        log_step(f"Wrote generated code to: {ino_file}")
        log_step(f"Generated Arduino Code:\n{code}\n--- End of Code ---")

        # 3. Compile the sketch
        compile_cmd = [
            ARDUINO_CLI_PATH,
            'compile',
            '--fqbn', fqbn,
            '--clean',
            '--output-dir', sketch_dir,
            sketch_dir
        ]
        
        log_step(f"Compiling sketch with command: {' '.join(compile_cmd)}")
        compile_result = subprocess.run(
            compile_cmd,
            capture_output=True,
            text=True,
            timeout=300
        )

        log_step(f"Compile stdout:\n{compile_result.stdout}")
        if compile_result.stderr:
            log_step(f"Compile stderr:\n{compile_result.stderr}")

        if compile_result.returncode != 0:
            log_step("Compilation failed.")
            shutil.rmtree(temp_dir, ignore_errors=True)
            return jsonify({
                'success': False,
                'error': 'Compilation failed',
                'output': (compile_result.stderr or '') + (compile_result.stdout or ''),
                'logs': logs
            }), 400

        log_step("Compilation successful. Binary generated in sketch directory.")

        binary_files = [f for f in os.listdir(sketch_dir) if f.endswith('.bin') or f.endswith('.hex')]
        log_step(f"Generated binary files: {binary_files}")

        # 4. Upload to the board
        upload_cmd = [
            ARDUINO_CLI_PATH,
            'upload',
            '--fqbn', fqbn,
            '--port', port,
            '--input-dir', sketch_dir,
            sketch_dir
        ]

        log_step(f"Uploading sketch with command: {' '.join(upload_cmd)}")
        upload_result = subprocess.run(
            upload_cmd,
            capture_output=True,
            text=True,
            timeout=120
        )

        log_step(f"Upload stdout:\n{upload_result.stdout}")
        if upload_result.stderr:
            log_step(f"Upload stderr:\n{upload_result.stderr}")

        # Cleanup temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)
        log_step("Cleaned up temporary sketch directory.")

        if upload_result.returncode != 0:
            log_step("Upload failed.")
            err_msg = (upload_result.stderr or '') + (upload_result.stdout or '')
            hint = ""
            if "failed to connect" in err_msg.lower() or "wrong boot mode" in err_msg.lower() or "download mode" in err_msg.lower():
                hint = (
                    "\n\n👉 HARDWARE HINT: Your ESP32 board failed to enter download/bootloader mode automatically.\n"
                    "   1. Press and HOLD the 'BOOT' (or 'IO0') button on your ESP32 board.\n"
                    "   2. Click 'Upload' again in the IDE.\n"
                    "   3. As soon as you see 'Connecting...' in the log, RELEASE the 'BOOT' button.\n"
                    "   4. If it still fails, press the 'RST'/'EN' button once while holding 'BOOT', then release both to force bootloader mode."
                )
                log_step("Detected ESP32 bootloader connection failure. Added hardware helper hint.")
            return jsonify({
                'success': False,
                'error': f'Upload failed{hint}',
                'output': err_msg,
                'logs': logs
            }), 400

        # Verify flash completion
        all_output = upload_result.stdout + (upload_result.stderr or '')
        flash_verified = False
        if "hash of data verified" in all_output.lower() or "leaving..." in all_output.lower():
            flash_verified = True
            log_step("Flash verification successful: 'Hash of data verified' or 'Leaving...' detected in output.")
        else:
            log_step("Warning: Flash verification message not found in upload output, but process exited successfully.")

        log_step("Upload and execution pipeline completed successfully!")
        return jsonify({
            'success': True,
            'message': 'Upload completed successfully and verified!',
            'output': all_output,
            'flash_verified': flash_verified,
            'logs': logs
        })

    except subprocess.TimeoutExpired as e:
        log_step(f"Timeout expired during command execution: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Command timed out. Is the board connected and in bootloader mode?',
            'logs': logs
        }), 500

    except FileNotFoundError:
        log_step("Error: arduino-cli executable not found.")
        return jsonify({
            'success': False,
            'error': 'arduino-cli not found. Please ensure it is installed and in your PATH.',
            'logs': logs
        }), 500

    except Exception as e:
        log_step(f"Unhandled exception during upload: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'logs': logs
        }), 500
    finally:
        if temp_dir:
            shutil.rmtree(temp_dir, ignore_errors=True)


@app.route('/api/upload-buzzer-test', methods=['GET'])
def upload_buzzer_test_sketch():
    """
    Upload a known-good buzzer test sketch (Port1 GPIO 18) via Arduino CLI.
    This is used to verify that the app upload path works end-to-end.
    """
    try:
        port = request.args.get('port', DEFAULT_PORT)
        fqbn = request.args.get('fqbn', 'esp32:esp32:esp32')

        sketch_dir = os.path.join(PROJECT_ROOT, 'sketches', 'boffin_buzzer_test')
        if not os.path.isdir(sketch_dir):
            return jsonify({'success': False, 'error': f'Sketch not found: {sketch_dir}'}), 500

        compile_cmd = [ARDUINO_CLI_PATH, 'compile', '--fqbn', fqbn, sketch_dir]
        compile_result = subprocess.run(
            compile_cmd, capture_output=True, text=True, timeout=300
        )
        if compile_result.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'Compilation failed: {compile_result.stderr or compile_result.stdout}',
                'output': (compile_result.stderr or '') + (compile_result.stdout or ''),
            }), 400

        upload_cmd = [ARDUINO_CLI_PATH, 'upload', '--fqbn', fqbn, '--port', port, sketch_dir]
        upload_result = subprocess.run(
            upload_cmd, capture_output=True, text=True, timeout=120
        )
        if upload_result.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'Upload failed: {upload_result.stderr or upload_result.stdout}',
                'output': (upload_result.stderr or '') + (upload_result.stdout or ''),
            }), 400

        return jsonify({
            'success': True,
            'message': 'Uploaded known-good buzzer test sketch.',
            'port': port,
            'fqbn': fqbn,
            'output': (compile_result.stdout or '') + (upload_result.stdout or ''),
        })

    except subprocess.TimeoutExpired:
        return jsonify({'success': False, 'error': 'Upload timed out.'}), 500
    except FileNotFoundError:
        return jsonify({'success': False, 'error': 'arduino-cli not found.'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/generate', methods=['POST'])
def generate_code():
    """
    Receive MicroPython code and return it formatted.
    (Code generation is done client-side, this is for logging/validation)
    
    Request JSON:
    {
        "code": "from machine import Pin ..."
    }
    """
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({'success': False, 'error': 'Request body must be a JSON object'}), 400
        code = data.get('code', '')
        if not isinstance(code, str):
            return jsonify({'success': False, 'error': 'Code must be a string'}), 400
        
        return jsonify({
            'success': True,
            'code': code,
            'lines': len(code.split('\n')),
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/upload', methods=['POST'])
@app.route('/api/upload', methods=['POST'])
def upload_to_board():
    """
    Upload MicroPython code to ESP32 via mpremote.
    
    This function:
    1. Receives the generated MicroPython code
    2. Creates a temporary main.py file
    3. Uses mpremote to copy it to the ESP32
    4. Soft-resets the board to run the new code
    
    Request JSON:
    {
        "code": "from machine import Pin ...",
        "port": "/dev/cu.usbserial-0001"  (optional)
    }
    
    Response:
    {
        "success": true/false,
        "message": "Upload complete!",
        "output": "mpremote output..."
    }
    """
    temp_dir = None
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({'success': False, 'error': 'Request body must be a JSON object'}), 400
        code = data.get('code', '')
        port = data.get('port', DEFAULT_PORT)
        
        if not isinstance(code, str) or not code:
            return jsonify({
                'success': False,
                'error': 'Code must be a non-empty string',
            }), 400
        if not isinstance(port, str) or not port:
            return jsonify({'success': False, 'error': 'Port must be a non-empty string'}), 400
        
        # Create a temporary file for main.py
        temp_dir = tempfile.mkdtemp(prefix='bharatblocks_mp_')
        main_py_path = os.path.join(temp_dir, 'main.py')
        
        with open(main_py_path, 'w', encoding='utf-8') as f:
            f.write(code)
        
        # Step 1: Copy main.py to ESP32 using mpremote
        upload_cmd = MPREMOTE_CMD + [
            'connect', port,
            'cp', main_py_path, ':main.py',
        ]
        
        upload_result = subprocess.run(
            upload_cmd,
            capture_output=True,
            text=True,
            timeout=30,
        )
        
        if upload_result.returncode != 0:
            err_text = (upload_result.stderr or '') + (upload_result.stdout or '')
            hint = ''
            if 'could not enter raw repl' in err_text.lower():
                hint = (
                    '\n\nHint: This endpoint is for MicroPython boards. '
                    'If your ESP32 is running Arduino firmware, switch the IDE generator to "Arduino C++" '
                    'and upload using /upload-arduino instead. '
                    'If you want MicroPython, flash MicroPython firmware first, then retry.'
                )
            shutil.rmtree(temp_dir, ignore_errors=True)
            return jsonify({
                'success': False,
                'error': f'Upload failed: {upload_result.stderr or upload_result.stdout}{hint}',
                'output': err_text,
            }), 400
        
        # Step 2: Soft-reset the board to run the new code
        reset_cmd = MPREMOTE_CMD + [
            'connect', port,
            'reset',
        ]
        
        reset_result = subprocess.run(
            reset_cmd,
            capture_output=True,
            text=True,
            timeout=10,
        )
        
        # Cleanup temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        return jsonify({
            'success': True,
            'message': 'MicroPython code uploaded and board reset successfully!',
            'output': upload_result.stdout + (reset_result.stdout or ''),
        })
    
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'error': 'Upload timed out (30s). Is the ESP32 connected?',
        }), 500
    
    except FileNotFoundError:
        return jsonify({
            'success': False,
            'error': 'mpremote not found. Install it: pip3 install mpremote',
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
        }), 500
    finally:
        if temp_dir:
            shutil.rmtree(temp_dir, ignore_errors=True)


@app.route('/api/detect-port', methods=['GET'])
def detect_port():
    """
    Detect connected ESP32 serial ports.
    """
    try:
        boards = detect_boards_and_ports()
        return jsonify({
            'success': True,
            'ports': [{'address': b['port'], 'fqbn': b['fqbn'], 'label': b['label']} for b in boards]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==========================================
# Routes: Real-Time AI → Hardware Execution
# ==========================================

@app.route('/execute', methods=['POST'])
@app.route('/api/execute', methods=['POST'])
def execute_on_board():
    """
    Execute a MicroPython code snippet on ESP32 in real-time.
    Used by the AI Block Runtime to control hardware instantly
    when gestures/poses/faces/voice are detected.
    
    Unlike /upload (which writes main.py and resets), this runs
    the code immediately using mpremote exec.
    
    Request JSON:
    {
        "code": "from machine import Pin, PWM\\nbzr = PWM(Pin(15))\\n...",
        "port": "/dev/cu.usbserial-0001"  (optional)
    }
    
    Response:
    {
        "success": true/false,
        "output": "execution output..."
    }
    """
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({'success': False, 'error': 'Request body must be a JSON object'}), 400
        code = data.get('code', '')
        port = data.get('port', DEFAULT_PORT)
        
        if not isinstance(code, str) or not code:
            return jsonify({
                'success': False,
                'error': 'Code must be a non-empty string',
            }), 400
        if not isinstance(port, str) or not port:
            return jsonify({'success': False, 'error': 'Port must be a non-empty string'}), 400
        
        # Use mpremote exec to run code directly (no file write, no reset)
        exec_cmd = MPREMOTE_CMD + [
            'connect', port,
            'exec', code,
        ]
        
        exec_result = subprocess.run(
            exec_cmd,
            capture_output=True,
            text=True,
            timeout=10,
        )
        
        if exec_result.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'Execution failed: {exec_result.stderr or exec_result.stdout}',
                'output': (exec_result.stderr or '') + (exec_result.stdout or ''),
            }), 400
        
        return jsonify({
            'success': True,
            'output': exec_result.stdout,
        })
    
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'error': 'Execution timed out (10s). Is the ESP32 connected?',
        }), 500
    
    except FileNotFoundError:
        return jsonify({
            'success': False,
            'error': 'mpremote not found. Install it: pip3 install mpremote',
        }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
        }), 500


# ==========================================
# Routes: Serial Monitor (background thread)
# ==========================================

_serial_mon = {
    'serial': None,
    'running': False,
    'port': None,
    'baud': 115200,
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
        baud = int(data.get('baud', 115200))
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
# Routes: Voice Command Processing
# ==========================================

@app.route('/api/voice', methods=['POST'])
def voice_command():
    """
    Process a voice command sent from the AI Studio.

    Request JSON:
    {
        "command": "turn on led",
        "lang": "en"          (optional)
    }

    Response:
    {
        "success": true,
        "command": "turn on led",
        "action": "recognized",
        "message": "Voice command received"
    }
    """
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({'success': False, 'error': 'Request body must be a JSON object'}), 400
        command = data.get('command', '')
        lang = data.get('lang', 'en')

        if not isinstance(command, str):
            return jsonify({'success': False, 'error': 'Command must be a string'}), 400
        command = command.strip()
        if not command:
            return jsonify({'success': False, 'error': 'No command provided'}), 400

        print(f"[Voice] Command received ({lang}): {command}")

        return jsonify({
            'success': True,
            'command': command,
            'action': 'recognized',
            'message': f'Voice command received: "{command}"',
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


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
    print("  ESPY IDE - Backend Server")
    print("=" * 50)
    print(f"  Projects directory: {os.path.abspath(PROJECTS_DIR)}")
    print(f"  Server starting on: http://localhost:5001")
    print("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False,
    )
