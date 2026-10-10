"""Contact integration checks with mocked fetch only; never sends real email."""
import argparse
import time
from browser_driver import BrowserDriver

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:4327/lift-go-mk/')
parser.add_argument('--port', type=int, default=2829)
parser.add_argument('--output', default='/tmp/liftgo-contact')
args = parser.parse_args()
driver = BrowserDriver(args.url, args.port, args.output)
js = driver.js
driver.command('WebDriver:NewSession', {'capabilities': {'alwaysMatch': {}}})

fill_script = """
 const f=document.querySelector('#quote-form');
 f.elements.city.value='Скопје';f.elements.name.value='Тест Корисник';
 f.elements.customerPhone.value='+389 71 234 567';
 f.elements.customerEmail.value='test@example.com';f.elements.details.value='Гардеробер';
 document.querySelector('[data-floor="10"]').click();
 f.querySelector('[name=items]').checked=true;
"""

def settle():
    for _ in range(60):
        if js("return !document.querySelector('#quote-form').hasAttribute('aria-busy');"):
            return
        time.sleep(.05)
    raise AssertionError('Submission did not settle')

def setup(route='cena/', width=390):
    driver.viewport(width, 900)
    driver.navigate(route)
    js("""
      window.requests=[]; window.mode='success';
      window.fetch=(url, options)=>{
        window.requests.push({url,method:options.method,body:JSON.parse(options.body)});
        if(window.mode==='network')return Promise.reject(new TypeError('offline'));
        if(window.mode==='timeout')return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError'))));
        if(window.mode==='pending')return new Promise(resolve=>window.finish=resolve);
        if(window.mode==='invalid')return Promise.resolve(new Response('not-json'));
        if(window.mode==='null')return Promise.resolve(new Response('null'));
        if(window.mode==='unexpected')return Promise.resolve(new Response(JSON.stringify({message:'unexpected'})));
        return Promise.resolve(new Response(JSON.stringify({success:window.mode==='success'}),{status:window.mode==='http'?429:200}));
      };
    """)
    js(fill_script)

def submit():
    js("document.querySelector('#quote-form').requestSubmit();")

def key(value):
    driver.command('WebDriver:PerformActions', {'actions': [{'type': 'key', 'id': 'keyboard', 'actions': [{'type': 'keyDown', 'value': value}, {'type': 'keyUp', 'value': value}]}]})

try:
    setup()
    js("document.querySelector('[name=name]').focus();")
    key('\ue004')
    assert js("return document.activeElement.name==='customerPhone';")
    key('\ue004')
    assert js("return document.activeElement.name==='customerEmail';")
    key('\ue004')
    assert js("return document.activeElement.type==='submit';")
    for field in ('city', 'name', 'customerEmail', 'customerPhone', 'details'):
        setup()
        js(f"document.querySelector('[name={field}]').value='   ';")
        submit()
        assert js(f"return requests.length===0 && !document.querySelector('#{field}-error').hidden && document.querySelector('[name={field}]').getAttribute('aria-invalid')==='true' && document.activeElement.name==='{field}';")
        assert js(f"return document.activeElement.getAttribute('aria-describedby').includes('{field}-error');")
    for value in ('invalid', 'a@@example.com'):
        setup()
        js(f"document.querySelector('[name=customerEmail]').value='{value}';")
        submit()
        assert js("return requests.length===0 && !document.querySelector('#customerEmail-error').hidden;")
    for value in ('abcdefghi', '123', '1234567890123456', '++38971234567'):
        setup()
        js(f"document.querySelector('[name=customerPhone]').value='{value}';")
        submit()
        assert js("return requests.length===0 && !document.querySelector('#customerPhone-error').hidden;")
    for value in ('071234567', '(071) 234-567'):
        setup()
        js(f"document.querySelector('[name=customerPhone]').value='{value}';")
        submit()
        settle()
        assert js("return requests.length===1 && document.querySelector('#quote-status').dataset.state==='success';")
    setup()
    js("document.querySelector('[name=floor]').value='';")
    submit()
    assert js("return requests.length===0 && !document.querySelector('#floor-error').hidden;")
    setup()
    js("window.mode='pending';document.querySelector('button[type=submit]').focus();")
    key('\ue007')  # Real keyboard Enter activates submit.
    assert js("return requests.length===1 && document.querySelector('button[type=submit]').disabled && [...document.querySelectorAll('fieldset')].every(f=>f.disabled);")
    assert js("return getComputedStyle(document.querySelector('.submit-spinner')).display!=='none' && document.querySelector('#quote-status').dataset.state==='pending';")
    submit()
    assert js("return requests.length===1;")
    js("finish(new Response(JSON.stringify({success:true}))); ")
    settle()
    payload = js("return requests[0];")
    assert payload['url'] == 'https://api.web3forms.com/submit' and payload['method'] == 'POST'
    assert payload['body']['email']=='test@example.com' and payload['body']['phone']=='+389 71 234 567'
    assert payload['body']['service']=='Мебел' and payload['body']['botcheck'] is False
    assert '10. кат' in payload['body']['message'] and 'Гардеробер' in payload['body']['message']
    assert js("return document.querySelector('#quote-status').dataset.state==='success' && document.activeElement.id==='quote-status' && !document.querySelector('button[type=submit]').disabled && [...document.querySelectorAll('fieldset')].every(f=>!f.disabled);")
    assert js("return ['city','name','customerEmail','customerPhone','details','floor'].every(n=>document.querySelector('[name='+n+']').value==='') && !document.querySelector('[aria-pressed=true]') && !document.querySelector('input[name=items]:checked') && document.querySelector('#quote-live-summary').textContent.includes('Кат: —');")
    submit()
    assert js("return requests.length===1 && document.querySelector('#quote-status').dataset.state==='success';")
    js(fill_script)
    submit()
    assert js("return requests.length===1 && document.querySelector('#quote-status').textContent.includes('веќе');")
    js("document.querySelector('[name=details]').value='Друг товар';window.mode='success';")
    submit()
    settle()
    assert js("return requests.length===2 && document.querySelector('#quote-status').dataset.state==='success';")
    for width in (320, 768, 1440, 3840):
        driver.viewport(width, 900)
        js("document.querySelector('.quote-submit').scrollIntoView({block:'center',behavior:'instant'});")
        assert js("return document.documentElement.scrollWidth<=innerWidth+1 && document.querySelector('#quote-status').getAttribute('aria-live')==='polite' && document.querySelector('#quote-status').getAttribute('aria-atomic')==='true';")
        driver.screenshot(f'contact-success-{width}', full=False)
    for mode in ('http', 'rejection', 'network', 'invalid', 'null', 'unexpected', 'timeout'):
        setup()
        js(f"window.mode='{mode}';")
        if mode == 'timeout':
            js("const original=window.setTimeout; window.setTimeout=(fn,delay,...args)=>original(fn,delay===20000?10:delay,...args);")
        submit()
        settle()
        assert js("return document.querySelector('#quote-status').dataset.state==='error' && document.querySelector('[name=details]').value==='Гардеробер' && document.querySelector('[name=floor]').value==='10' && !document.querySelector('button[type=submit]').disabled;")
        js("window.mode='success';")
        submit()
        settle()
        assert js("return document.querySelector('#quote-status').dataset.state==='success' && document.querySelector('[name=details]').value==='';")
        print('Failure and retry:', mode, flush=True)
    setup('kontakt/')
    js("document.querySelector('[name=botcheck]').checked=true;")
    submit()
    assert js("return requests.length===0;")
    js("document.querySelector('[name=botcheck]').checked=false;")
    driver.command('Marionette:SetContext', {'value':'chrome'})
    js("window.liftgoContactMotionBackup={had:Services.prefs.prefHasUserValue('ui.prefersReducedMotion'),value:Services.prefs.getIntPref('ui.prefersReducedMotion',0)};Services.prefs.setIntPref('ui.prefersReducedMotion',1);")
    driver.command('Marionette:SetContext', {'value':'content'})
    for _ in range(30):
        if js("return matchMedia('(prefers-reduced-motion: reduce)').matches;"): break
        time.sleep(.05)
    js("window.mode='pending';")
    submit()
    assert js("return matchMedia('(prefers-reduced-motion: reduce)').matches && getComputedStyle(document.querySelector('.submit-spinner')).animationName==='none';")
    js("finish(new Response(JSON.stringify({success:true}))); ")
    settle()
    assert js("return document.querySelector('button[type=submit]').getBoundingClientRect().height>=44;")
    print('PASS: required fields, email/phone validation, keyboard submit, payload, spinner, locked inputs, duplicate protection, success reset, errors/retries, timeout, honeypot, accessible error/status markup and responsive layouts. No live email sent.', flush=True)
finally:
    driver.command('Marionette:SetContext', {'value':'chrome'})
    js("const backup=window.liftgoContactMotionBackup;if(backup){if(backup.had)Services.prefs.setIntPref('ui.prefersReducedMotion',backup.value);else Services.prefs.clearUserPref('ui.prefersReducedMotion');delete window.liftgoContactMotionBackup;}")
    driver.command('Marionette:SetContext', {'value':'content'})
    driver.command('WebDriver:DeleteSession')
    driver.close()
