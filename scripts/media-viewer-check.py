"""Cinematic viewer checks. Requires the Firefox setup in docs/responsive-design.md."""
import argparse
import time
from browser_driver import BrowserDriver
parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:4323/lift-go-mk/')
parser.add_argument('--port', type=int, default=2829)
parser.add_argument('--output', default='/tmp/liftgo-cinematic')
args = parser.parse_args()
driver = BrowserDriver(args.url, args.port, args.output)
command, js = (driver.command, driver.js)
viewport, navigate, screenshot = (driver.viewport, driver.navigate, driver.screenshot)
output = driver.output
screenshot = lambda name: driver.screenshot(name, full=False)
command('WebDriver:NewSession', {'capabilities': {'alwaysMatch': {'acceptInsecureCerts': True}}})

def key(value):
    command('WebDriver:PerformActions', {'actions': [{'type': 'key', 'id': 'keyboard', 'actions': [{'type': 'keyDown', 'value': value}, {'type': 'keyUp', 'value': value}]}]})

def click(selector):
    element = command('WebDriver:FindElement', {'using': 'css selector', 'value': selector})['value']
    command('WebDriver:PerformActions', {'actions': [{'type': 'pointer', 'id': 'mouse', 'parameters': {'pointerType': 'mouse'}, 'actions': [{'type': 'pointerMove', 'duration': 0, 'origin': element, 'x': 0, 'y': 0}, {'type': 'pointerDown', 'button': 0}, {'type': 'pointerUp', 'button': 0}]}]})

def wait_for(script):
    for _ in range(50):
        if js(script):
            return
        time.sleep(0.1)
    raise AssertionError(script)
try:
    navigate('galerija/')
    for width, height in ((320, 740), (390, 844), (768, 1024), (1440, 900), (3840, 1200), (844, 390)):
        viewport(width, height)
        js("document.querySelector('.media-trigger').click();")
        wait_for("return document.querySelector('dialog video').readyState >= 1;")
        result = js("const d=document.querySelector('dialog'),v=d.querySelector('video'),stage=d.querySelector('.viewer-stage');const r=stage.getBoundingClientRect();return {width:innerWidth,height:innerHeight,dialog:{w:d.clientWidth,h:d.clientHeight,scroll:d.scrollHeight},stage:{w:r.width,h:r.height,top:r.top,bottom:r.bottom},video:{w:v.videoWidth,h:v.videoHeight,controls:v.controls,muted:v.muted,mask:getComputedStyle(v).clipPath},cards:d.querySelectorAll('.media-card-frame,.project-frame-svg').length};")
        assert result['dialog']['scroll'] <= result['dialog']['h'] + 1, result
        assert result['stage']['h'] > 60 and result['stage']['bottom'] <= result['height'], result
        assert result['video']['controls'] == False and result['video']['muted'] and (result['video']['mask'] == 'none') and (result['cards'] == 0), result
        print('Viewer fit:', width, height, result, flush=True)
        screenshot(f'viewer-video-{width}-{height}')
        js("document.querySelector('.viewer-next').click();")
        assert js("return document.querySelector('.viewer-index').textContent==='02 / 03';")
        js("document.querySelector('.viewer-next').click();")
        wait_for("return document.querySelector('dialog img')?.complete;")
        assert js("return document.querySelector('.viewer-controls').hidden && document.querySelector('.viewer-index').textContent==='03 / 03';")
        screenshot(f'viewer-photo-{width}-{height}')
        js("document.querySelector('.media-close').click();")
        assert js("return !document.querySelector('dialog').open && !document.querySelector('.media-dialog-content').children.length && document.activeElement.classList.contains('media-trigger');")
    viewport(1440, 900)
    js("window.scrollTo(0,400); window.savedScroll=scrollY; document.querySelector('.media-trigger').click();")
    wait_for("return document.querySelector('video').readyState>=2;")
    js("document.querySelector('.cinematic-viewer').focus(); document.querySelector('video').dispatchEvent(new Event('playing'));")
    time.sleep(2.9)
    assert js("return document.querySelector('.cinematic-viewer').classList.contains('controls-idle');")
    js("document.querySelector('.viewer-toggle').focus();")
    assert js("return !document.querySelector('.cinematic-viewer').classList.contains('controls-idle');")
    js("document.querySelector('video').dispatchEvent(new Event('waiting'));")
    assert js("return document.querySelector('.viewer-stage').getAttribute('aria-busy')==='true';")
    js("document.querySelector('video').dispatchEvent(new Event('playing'));")
    assert js("return document.querySelector('.viewer-stage').getAttribute('aria-busy')==='false';")
    js("document.querySelector('video').pause(); document.querySelector('.cinematic-viewer').focus();")
    key(' ')
    wait_for("return !document.querySelector('video').paused;")
    key(' ')
    assert js("return document.querySelector('video').paused;")
    key('m')
    assert js("return !document.querySelector('video').muted && document.querySelector('.viewer-mute').getAttribute('aria-pressed')==='false';")
    js("const x=document.querySelector('.viewer-volume');x.value='.3';x.dispatchEvent(new Event('input',{bubbles:true}));")
    assert js("return Math.abs(document.querySelector('video').volume-.3)<.01;")
    js("const s=document.querySelector('.viewer-seek');s.value='50';s.dispatchEvent(new Event('input',{bubbles:true}));")
    assert js("const v=document.querySelector('video');return Math.abs(v.currentTime-v.duration/2)<1;")
    js("window.previousVideo=document.querySelector('video'); document.querySelector('.cinematic-viewer').focus();")
    key('\ue014')
    assert js("return previousVideo.paused && !previousVideo.hasAttribute('src') && document.querySelector('.viewer-index').textContent==='02 / 03' && document.querySelector('video').muted;")
    key('\ue012')
    assert js("return document.querySelector('.viewer-index').textContent==='01 / 03';")
    click('.viewer-fullscreen')
    time.sleep(0.2)
    print('Fullscreen:', js("return {active:document.fullscreenElement===document.querySelector('.cinematic-viewer'),status:document.querySelector('.viewer-status').textContent};"), flush=True)
    assert js("return document.querySelector('.viewer-fullscreen').getAttribute('aria-pressed')==='true';")
    if js('return !!document.fullscreenElement;'):
        click('.viewer-fullscreen')
        wait_for('return !document.fullscreenElement;')
    js("document.querySelector('.cinematic-viewer').focus();")
    key('f')
    wait_for('return !!document.fullscreenElement;')
    key('\ue00c')
    wait_for("return !document.querySelector('dialog').open;")
    assert js('return Math.abs(scrollY-savedScroll)<2 && document.activeElement.classList.contains("media-trigger") && document.body.style.overflow!=="hidden";')
    js("document.querySelector('[data-filter=Фотографии]').click(); document.querySelector('[data-kind=image]').click();")
    assert js("return document.querySelector('.viewer-index').textContent==='01 / 01' && document.querySelector('.viewer-next').disabled;")
    js("const img=document.querySelector('dialog img'); img.dispatchEvent(new Event('error'));")
    assert js("return !document.querySelector('.viewer-retry').hidden && !document.querySelector('.viewer-status').hidden;")
    js("document.querySelector('.viewer-retry').click();")
    wait_for("return document.querySelector('dialog img')?.complete;")
    assert js("return document.querySelector('.viewer-retry').hidden && document.querySelector('.viewer-status').hidden;")
    js("document.querySelector('.media-close').click();")
    js("document.querySelector('[data-filter=Сите]').click(); document.querySelector('[data-kind=image]').click();")
    js("const stage=document.querySelector('.viewer-stage'); const down=new Event('touchstart'); Object.defineProperty(down,'touches',{value:[{clientX:260,clientY:150}]}); stage.dispatchEvent(down); const up=new Event('touchend'); Object.defineProperty(up,'changedTouches',{value:[{clientX:80,clientY:155}]}); stage.dispatchEvent(up);")
    assert js("return document.querySelector('.viewer-index').textContent==='01 / 03' && !!document.querySelector('dialog video');")
    js("document.querySelector('.media-close').click();")
    print('PASS: custom playback, seek, volume, keyboard navigation, fullscreen, filtered index, cleanup, scroll and focus restoration.', flush=True)
finally:
    command('WebDriver:DeleteSession')
    driver.close()
