"""Exercise the real wizard in a PTY. Uses only the Python standard library."""
import fcntl
import json
import os
from pathlib import Path
import pty
import select
import shutil
import signal
import struct
import sys
import tempfile
import termios
import time

root = Path(__file__).resolve().parent.parent
cli = root / 'packages/create-mavis/src/cli.mjs'
node = shutil.which('node')
output = root / 'artifacts/creator/terminal'
output.mkdir(parents=True, exist_ok=True)


def scenario(name, steps, expected, columns=90, args=None, isolated_path=False, example='welcome', targets=('web', 'native')):
    with tempfile.TemporaryDirectory(prefix='mavis-terminal-') as cwd:
        pid, fd = pty.fork()
        if pid == 0:
            os.chdir(cwd)
            env = {**os.environ, 'TERM': 'xterm-256color', 'CI': '', 'NO_COLOR': '1'}
            env.pop('FORCE_COLOR', None)
            if isolated_path:
                env['PATH'] = cwd
            os.execve(node, [node, str(cli), *(args if args is not None else ['--no-install'])], env)
        fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH', 32, columns, 0, 0))
        transcript = b''
        offset = 0
        finished = False
        try:
            for prompt, response in steps:
                deadline = time.monotonic() + 10
                while prompt.encode() not in transcript[offset:]:
                    if time.monotonic() > deadline:
                        raise AssertionError(f'{name}: missing prompt {prompt}\n{transcript.decode(errors="replace")}')
                    if select.select([fd], [], [], 0.1)[0]:
                        transcript += os.read(fd, 65536)
                offset = len(transcript)
                os.write(fd, response)
            deadline = time.monotonic() + 10
            while time.monotonic() < deadline:
                if select.select([fd], [], [], 0.1)[0]:
                    try:
                        data = os.read(fd, 65536)
                        if data:
                            transcript += data
                    except OSError:
                        pass
                result, status = os.waitpid(pid, os.WNOHANG)
                if result:
                    finished = True
                    assert os.waitstatus_to_exitcode(status) == expected, transcript.decode(errors='replace')
                    break
            assert finished, f'{name}: process did not exit'
            text = transcript.decode(errors='replace')
            assert '\x1b[?25h' in text, 'Cursor must be restored'
            if expected == 0:
                config = json.loads((Path(cwd) / 'hello-mavis/mavis.config.json').read_text())
                assert config['schemaVersion'] == 2
                assert config['targets'] == list(targets)
                assert config['packageManager'] == 'pnpm'
                assert config['example'] == example
                if 'macos' in targets:
                    assert config['web'] == 'vite'
                    entry = 'Tasks' if example == 'tasks' else 'Welcome'
                    assert f'Make it yours: shared/{entry}.lite.tsx' in text
                    assert 'Shared TSX (shared/*.lite.tsx), compiled for each target' in text
                else:
                    assert config['web'] == 'nuxt'
                    entry = 'Directory.vue' if example == 'directory' else 'Welcome.vue'
                    assert f'Make it yours: shared/{entry}' in text
                assert 'pnpm run install:apps' in text
                assert 'Next steps' in text
            else:
                assert not list(Path(cwd).iterdir()), 'Cancellation must not create files'
            (output / f'{name}.txt').write_text(text)
            print(f'Terminal: {name} passed')
        finally:
            if not finished:
                os.kill(pid, signal.SIGKILL)
                os.waitpid(pid, 0)
            os.close(fd)


scenario('shared-pnpm', [
    ('What is your project called?', b'BAD NAME\r'),
    ('Use a project name', b'\x15hello-mavis\r'),
    # Web is preselected: move to Native, select it, continue.
    ('Where will it run?', b'\x1b[B \r'),
    ('Choose your web setup', b'\x1b[B\r'),
    ('How should Nuxt serve your pages?', b'\r'),
    ('Choose a starting example', b'\x1b[B\r'),
    ('Pick a starting theme', b'\x1b[B\r'),
    ('Which package manager?', b'\x1b[B\r'),
    ('Ready to create?', b'\r'),
], 0, example='directory')
scenario('all-targets', [
    ('What is your project called?', b'hello-mavis\r'),
    ('Where will it run?', b'\x1b[B \x1b[B \r'),
    ('Choose your web setup', b'\r'),
    # Mac now offers Directory as well: Tasks is the third example.
    ('Choose a starting example', b'\x1b[B\x1b[B\r'),
    ('Pick a starting theme', b'\r'),
    ('Which package manager?', b'\x1b[B\r'),
    ('Ready to create?', b'\r'),
], 0, example='tasks', targets=('web', 'native', 'macos'))
scenario('cancel', [('What is your project called?', b'\x03')], 130)
scenario('escape-narrow', [('What is your project called?', b'\x1b')], 130, columns=42)

recovery_args = ['hello-mavis', '--target', 'both', '--web', 'nuxt', '--rendering', 'ssr', '--theme', 'midnight', '--example', 'welcome', '--package-manager', 'pnpm', '--install']
scenario('missing-manager-skip', [
    ('How would you like to continue?', b'\x1b[B\r'),
    ('Ready to create?', b'\r'),
], 0, args=recovery_args, isolated_path=True)
scenario('missing-manager-cancel', [
    ('How would you like to continue?', b'\x03'),
], 130, args=recovery_args, isolated_path=True)
