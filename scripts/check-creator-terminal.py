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


def scenario(name, steps, expected, columns=90):
    with tempfile.TemporaryDirectory(prefix='mavis-terminal-') as cwd:
        pid, fd = pty.fork()
        if pid == 0:
            os.chdir(cwd)
            env = {**os.environ, 'TERM': 'xterm-256color', 'CI': '', 'NO_COLOR': '1'}
            env.pop('FORCE_COLOR', None)
            os.execve(node, [node, str(cli), '--no-install'], env)
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
                assert config['target'] == 'both'
                assert config['web'] == 'nuxt'
                assert config['packageManager'] == 'pnpm'
                assert 'pnpm run install:apps' in text
                assert 'Next steps' in text
            else:
                assert not list(Path(cwd).iterdir()), 'Cancellation must not create files'
            (output / f'{name}.txt').write_text(text)
            print(f'Terminal: {name} passed')
        finally:
            if not finished:
                os.kill(pid, signal.SIGTERM)
                os.waitpid(pid, 0)
            os.close(fd)


scenario('shared-pnpm', [
    ('What is your project called?', b'BAD NAME\r'),
    ('Use a project name', b'\x15hello-mavis\r'),
    ('Where will it run?', b'\x1b[B\x1b[B\r'),
    ('Choose your web setup', b'\x1b[B\r'),
    ('How should Nuxt serve your pages?', b'\r'),
    ('Pick a starting theme', b'\x1b[B\r'),
    ('Which package manager?', b'\x1b[B\r'),
    ('Ready to create?', b'\r'),
], 0)
scenario('cancel', [('What is your project called?', b'\x03')], 130)
scenario('escape-narrow', [('What is your project called?', b'\x1b')], 130, columns=42)
