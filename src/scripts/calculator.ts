import { pricing } from '../config/pricing';
import { contact } from '../config/contact';

const form = document.querySelector<HTMLFormElement>('#quote-form');

if (form) {
  const field = (name: string) =>
    form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  const floor = field('floor') as HTMLInputElement;
  const floorButtons = [...form.querySelectorAll<HTMLButtonElement>('.floor-choice')];
  const platform = form.querySelector<HTMLElement>('#lift-platform')!;
  const updateLiftPosition = () => {
    const destination =
      floorButtons.find((button) => button.dataset.floor === floor.value) ??
      form.querySelector<HTMLElement>('.floor-display');
    const rail = form.querySelector<HTMLElement>('.lift-illustration');
    if (!destination || !rail) return;
    const target = destination.getBoundingClientRect();
    platform.style.bottom = `${Math.max(0, rail.getBoundingClientRect().bottom - target.top - target.height / 2 - platform.offsetHeight / 2)}px`;
  };
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(updateLiftPosition).observe(form.querySelector('.floor-picker')!);
  } else {
    window.addEventListener('resize', updateLiftPosition);
  }
  // Older webviews lack :has(); keep the mobile bar out of the form/keyboard area.
  form.addEventListener('focusin', () => document.body.classList.add('form-field-focused'));
  form.addEventListener('focusout', () => {
    window.setTimeout(() => {
      document.body.classList.toggle('form-field-focused', form.contains(document.activeElement));
    }, 0);
  });
  const selectedItems = () =>
    [...form.querySelectorAll<HTMLInputElement>('input[name="items"]:checked')].map(
      (input) => input.value,
    );
  const status = form.querySelector<HTMLElement>('#quote-status')!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const label = submit.querySelector<HTMLElement>('[data-submit-label]')!;
  let sending = false;
  let lastSentSummary = '';
  const requiredFields: Record<string, string> = {
    city: 'Внеси град или населба.',
    name: 'Внеси име и презиме.',
    customerEmail: 'Внеси е-пошта за одговор.',
    customerPhone: 'Внеси телефон за контакт.',
    details: 'Опиши што треба да кренеме.',
  };
  const setStatus = (text: string, state: 'pending' | 'success' | 'error') => {
    status.textContent = text;
    status.dataset.state = state;
  };
  const clearFeedback = () => {
    if (sending) return;
    status.textContent = '';
    delete status.dataset.state;
  };
  const validateField = (name: string) => {
    const input = field(name);
    input.setCustomValidity('');
    let message = input.value.trim() ? '' : requiredFields[name];
    if (!message && name === 'customerPhone') {
      const phone = input.value.trim();
      const digits = phone.replace(/\D/g, '');
      if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
        message = 'Внеси важечки телефон со 7–15 цифри, на пр. +389 71 234 567.';
      }
    }
    if (!message && name === 'customerEmail' && !input.validity.valid) {
      message = 'Внеси важечка е-пошта, на пр. ime@example.com.';
    }
    if (!message && !input.validity.valid) message = 'Провери ја внесената вредност.';
    input.setCustomValidity(message);
    const error = form.querySelector<HTMLElement>(`#${name}-error`)!;
    error.textContent = message;
    error.hidden = !message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return !message;
  };

  const requestSummary = () => {
    const values = new FormData(form);
    return [
      'Побарувачка за LiftGoMK',
      `Име: ${values.get('name') || '—'}`,
      `Телефон: ${values.get('customerPhone') || '—'}`,
      `Е-пошта за одговор: ${values.get('customerEmail') || '—'}`,
      `Локација: ${values.get('city') || '—'}${values.get('address') ? `, ${values.get('address')}` : ''}`,
      `Пристап: ${values.get('access') || '—'}`,
      `Кат: ${floor.value ? `${floor.value}. кат` : '—'}`,
      `Товар: ${selectedItems().join(', ') || '—'}`,
      `Детали: ${values.get('details') || '—'}`,
      `Насока: ${values.get('direction') || '—'}`,
      `Времетраење: ${values.get('duration') ? `${values.get('duration')} ч.` : '—'}`,
      `Посакуван датум: ${values.get('date') || '—'}`,
      `Забелешки: ${values.get('notes') || '—'}`,
    ].join('\n');
  };

  const renderSummary = () => {
    const values = new FormData(form);
    const total =
      pricing.baseFee !== undefined && pricing.perFloor !== undefined
        ? pricing.baseFee +
          Number(floor.value || 0) * pricing.perFloor +
          (Object.entries(pricing.locationSurcharge ?? {}).find(([name]) =>
            String(values.get('city') || '')
              .toLocaleLowerCase()
              .includes(name.toLocaleLowerCase()),
          )?.[1] ?? 0) +
          Number(values.get('duration') || 0) * (pricing.perHour ?? 0) +
          (selectedItems().length > 1 ? (pricing.handlingFee ?? 0) : 0)
        : undefined;
    const lines = [
      `Локација: ${values.get('city') || '—'}`,
      `Кат: ${floor.value ? `${floor.value}. кат` : '—'}`,
      `Товар: ${selectedItems().join(', ') || '—'}`,
      `Насока: ${values.get('direction') || '—'}`,
      total === undefined ? 'Понуда: индивидуална' : `Проценка: од ${total} ден.`,
    ];
    const summary = document.querySelector<HTMLElement>('#quote-live-summary');
    if (summary) summary.textContent = lines.join('\n');
  };

  const setFloor = (button: HTMLButtonElement) => {
    if (sending) return;
    clearFeedback();
    const error = document.querySelector<HTMLElement>('#floor-error');
    if (error) error.hidden = true;
    floorButtons.forEach((item) => item.removeAttribute('aria-invalid'));
    floorButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    floor.value = button.dataset.floor ?? '';
    document.querySelector<HTMLElement>('#floor-note')!.textContent =
      `Избрано: ${floor.value}. кат`;
    updateLiftPosition();
    renderSummary();
  };

  floorButtons.forEach((button) => button.addEventListener('click', () => setFloor(button)));
  form.addEventListener('input', renderSummary);
  form.addEventListener('change', renderSummary);
  form.addEventListener('input', (event) => {
    clearFeedback();
    const input = event.target;
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      if (input.name in requiredFields && input.hasAttribute('aria-invalid')) {
        validateField(input.name);
      }
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    // Preserve confirmation if a second click arrives just after a successful reset.
    if (
      status.dataset.state === 'success' &&
      Object.keys(requiredFields).every((name) => !field(name).value.trim())
    )
      return;
    let valid = true;
    Object.keys(requiredFields).forEach((name) => {
      field(name).value = field(name).value.trim();
      if (!validateField(name)) valid = false;
    });
    if (!valid) {
      setStatus('Провери ги означените полиња пред испраќање.', 'error');
      form.reportValidity();
      return;
    }
    if (
      !Number.isInteger(Number(floor.value)) ||
      Number(floor.value) < 1 ||
      Number(floor.value) > 10
    ) {
      setStatus('Избери кат пред да ја испратиш побарувачката.', 'error');
      const error = document.querySelector<HTMLElement>('#floor-error');
      if (error) {
        error.hidden = false;
        error.textContent = status.textContent;
      }
      floorButtons.forEach((button) => button.setAttribute('aria-invalid', 'true'));
      floorButtons[0]?.focus();
      return;
    }

    if ((field('botcheck') as HTMLInputElement).checked) return;
    const message = requestSummary();
    if (message === lastSentSummary) {
      setStatus('Ова барање веќе е испратено. За ново барање, измени ги деталите.', 'error');
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    const email = field('customerEmail').value.trim();
    const payload = {
      access_key: contact.accessKey,
      subject: 'Барање за понуда — LiftGoMK',
      from_name: 'LiftGoMK · Барање од веб-страницата',
      name: field('name').value.trim(),
      email,
      phone: field('customerPhone').value.trim(),
      service: selectedItems().join(', ') || 'Не е наведено',
      message,
      botcheck: false,
    };
    const fieldsets = [...form.querySelectorAll<HTMLFieldSetElement>('fieldset')];
    const disabledStates = fieldsets.map((fieldset) => fieldset.disabled);
    sending = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    label.textContent = 'Се испраќа…';
    fieldsets.forEach((fieldset) => {
      fieldset.disabled = true;
    });
    setStatus('Се испраќа твоето барање. Почекај момент.', 'pending');
    try {
      const response = await fetch(contact.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setStatus(
          response.status === 429
            ? 'Има премногу барања. Почекај малку и обиди се повторно, или јави се. Деталите остануваат во формата.'
            : 'Барањето не е испратено. Обиди се повторно или јави се. Деталите остануваат во формата.',
          'error',
        );
        return;
      }
      const result: unknown = await response.json();
      if (
        typeof result !== 'object' ||
        result === null ||
        !('success' in result) ||
        typeof result.success !== 'boolean'
      ) {
        // An unexpected response cannot confirm whether delivery occurred.
        throw new Error('Unexpected Web3Forms response');
      }
      if (!result.success) {
        setStatus(
          'Барањето не е испратено. Обиди се повторно или јави се. Деталите остануваат во формата.',
          'error',
        );
        return;
      }
      lastSentSummary = message;
      form.reset();
      // Hidden input values reflect their attribute, so reset() alone retains the selection.
      floor.value = '';
      floorButtons.forEach((button) => {
        button.classList.remove('selected');
        button.setAttribute('aria-pressed', 'false');
        button.removeAttribute('aria-invalid');
      });
      form.querySelector<HTMLElement>('#floor-error')!.hidden = true;
      form.querySelector<HTMLElement>('#floor-note')!.textContent = 'Избери кат од 1 до 10';
      updateLiftPosition();
      setStatus('Барањето е успешно испратено. Ќе те контактираме за понудата.', 'success');
    } catch {
      setStatus(
        'Не добивме потврда за испраќањето. Провери ја врската или јави се пред повторно да испратиш. Деталите остануваат во формата.',
        'error',
      );
    } finally {
      window.clearTimeout(timeout);
      sending = false;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
      fieldsets.forEach((fieldset, index) => {
        fieldset.disabled = disabledStates[index];
      });
      label.textContent = 'Испрати барање';
      renderSummary();
      status.focus({ preventScroll: true });
    }
  });

  renderSummary();
  // Enable only once the asynchronous handler is installed; no-JS users use direct links.
  submit.disabled = false;
}
