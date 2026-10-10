"""Small dependency-free client for Firefox's built-in Marionette protocol."""
import base64
import json
import socket
import time
from pathlib import Path


class BrowserDriver:
    def __init__(self, url, port=2829, output='/tmp/liftgo-responsive'):
        self.url = url.rstrip('/') + '/'
        self.output = Path(output)
        self.output.mkdir(parents=True, exist_ok=True)
        self.sock = socket.create_connection(('127.0.0.1', port), timeout=30)
        self.stream = self.sock.makefile('rb')
        self.sequence = 0
        self.receive()

    def receive(self):
        size = b''
        while True:
            byte = self.stream.read(1)
            if byte == b':':
                break
            if not byte:
                raise RuntimeError('Browser closed the connection')
            size += byte
        return json.loads(self.stream.read(int(size)))

    def command(self, name, arguments=None):
        self.sequence += 1
        payload = json.dumps([0, self.sequence, name, arguments or {}]).encode()
        self.sock.sendall(str(len(payload)).encode() + b':' + payload)
        result = self.receive()
        if result[2]:
            raise RuntimeError(result[2])
        return result[3]

    def js(self, script):
        return self.command('WebDriver:ExecuteScript', {
            'script': script, 'args': [], 'newSandbox': False,
        })['value']

    def viewport(self, width, height=900, text_zoom=1, full_zoom=1):
        self.command('WebDriver:SetWindowRect', {'width': max(width, 600), 'height': height})
        self.command('Marionette:SetContext', {'value': 'chrome'})
        self.js(f"""const browser = window.gBrowser.selectedBrowser;
            browser.style.cssText = 'min-width:{width}px!important;max-width:{width}px!important;width:{width}px!important;flex:none!important';
            browser.fullZoom = {full_zoom}; browser.textZoom = {text_zoom};""")
        self.command('Marionette:SetContext', {'value': 'content'})
        time.sleep(.12)

    def navigate(self, route):
        self.command('WebDriver:Navigate', {'url': self.url + route})
        time.sleep(.2)
        self.js("document.querySelector('astro-dev-toolbar')?.remove();")

    def screenshot(self, name, full=True):
        data = self.command('WebDriver:TakeScreenshot', {'full': full})['value']
        (self.output / f'{name}.png').write_bytes(base64.b64decode(data))

    def close(self):
        self.stream.close()
        self.sock.close()
