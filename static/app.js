(() => {
  const mode = document.body.dataset.mode;
  const secure = mode !== 'vulnerable';
  const $ = (id) => document.getElementById(id);
  let toastTimer;

  const show = (id, value) => {
    const element = $(id);
    if (element) element.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  };

  const toast = (message, kind = 'success') => {
    const region = $('toast-region');
    const item = document.createElement('div');
    item.className = `toast toast-${kind}`;
    item.setAttribute('role', 'status');
    item.textContent = message;
    region.replaceChildren(item);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      item.classList.add('toast-leaving');
      setTimeout(() => item.remove(), 220);
    }, 3200);
  };

  const dbOpen = () => new Promise((resolve, reject) => {
    const req = indexedDB.open('StorageSecurityDemo', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('notes');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  async function idb(operation, value) {
    const db = await dbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', operation);
      const store = tx.objectStore('notes');
      const req = operation === 'readwrite' ? store.put(value, 'sample') : store.get('sample');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function clearIdb() {
    const db = await dbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      tx.objectStore('notes').clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('IndexedDB clear was cancelled.'));
    });
  }

  $('login').onclick = async () => {
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: $('username').value, password: $('password').value })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Sign-in failed.');
      if (!secure) localStorage.setItem('demo_session_id', 'fake-session-for-classroom');
      if (data.csrf_token) document.body.dataset.csrf = data.csrf_token;
      show('login-result', `Signed in as ${data.username}`);
      toast('Signed in with the demo account.');
    } catch (error) {
      show('login-result', error.message);
      toast(error.message || 'Sign-in failed.', 'error');
    }
  };

  $('save-storage').onclick = async () => {
    try {
      const note = $('note').value;
      localStorage.setItem('demo_note', note);
      sessionStorage.setItem('demo_note', note);
      await idb('readwrite', note);
      show('storage-result', 'Saved fictional note to localStorage, sessionStorage, and IndexedDB.');
      toast('Note saved to all three browser stores.');
    } catch (error) {
      show('storage-result', `Could not save all values: ${error.message}`);
      toast('Could not save to every browser store.', 'error');
    }
  };

  const renderNoteButton = $('render-note');
  if (renderNoteButton) {
    renderNoteButton.onclick = () => {
      const preview = $('note-preview');
      if (!preview) return;
      if (secure) preview.textContent = $('note').value;
      else preview.innerHTML = $('note').value;
      toast(secure ? 'Note preview rendered safely.' : 'Note preview rendered in vulnerable mode.', secure ? 'success' : 'warning');
    };
  }

  $('read-storage').onclick = async () => {
    try {
      show('storage-result', {
        localStorage: localStorage.getItem('demo_note'),
        sessionStorage: sessionStorage.getItem('demo_note'),
        indexedDB: await idb('readonly'),
        demoSession: localStorage.getItem('demo_session_id')
      });
      toast('Stored values loaded below.');
    } catch (error) {
      show('storage-result', `Could not read storage: ${error.message}`);
      toast('Could not read browser storage.', 'error');
    }
  };

  $('clear-storage').onclick = async () => {
    const csrfToken = document.body.dataset.csrf;
    localStorage.removeItem('demo_note');
    localStorage.removeItem('demo_session_id');
    localStorage.removeItem('encrypted_demo_note');
    sessionStorage.removeItem('demo_note');
    let indexedDbCleared = false;
    try {
      await clearIdb();
      indexedDbCleared = true;
    } catch (error) {
      show('storage-result', `Browser values were removed, but IndexedDB could not be cleared: ${error.message}`);
    }

    try {
      const headers = {};
      if (secure) headers['X-CSRF-Token'] = csrfToken || '';
      const response = await fetch(`/logout?mode=${mode}`, { method: 'POST', headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Sign-out request failed.');
      document.body.dataset.csrf = '';
      $('login-result').textContent = 'Not signed in';
      const message = indexedDbCleared
        ? 'Cleared demo storage and signed out.'
        : 'Cleared browser values and signed out; IndexedDB needs attention.';
      show('storage-result', message);
      toast(message);
    } catch (error) {
      const message = indexedDbCleared
        ? 'Browser storage cleared. Restart the updated app to clear the sign-in session.'
        : 'Browser values cleared, but IndexedDB or sign-out could not be confirmed.';
      show('storage-result', `${message} (${error.message})`);
      toast(message, 'warning');
    }
  };

  $('xss-demo').onclick = () => {
    const payload = $('xss-payload').value || $('xss-payload').placeholder;
    if (secure) {
      $('xss-preview').textContent = payload;
      show('xss-result', 'Secured mode: the payload is shown as text; it did not run.');
      toast('Secured mode blocked the test payload.', 'success');
    } else {
      $('xss-result').textContent = 'If the demonstration runs, the localStorage note will appear here.';
      $('xss-preview').innerHTML = payload;
      toast('Payload placed in the local preview.', 'warning');
    }
  };

  async function cryptoKey(passphrase, salt) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  $('encrypt').onclick = async () => {
    try {
      if (!$('passphrase').value) throw new Error('Enter a demo passphrase first.');
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await cryptoKey($('passphrase').value, salt);
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode($('note').value));
      const b64 = (array) => btoa(String.fromCharCode(...array));
      localStorage.setItem('encrypted_demo_note', JSON.stringify({ salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(ciphertext)) }));
      show('crypto-result', 'Ciphertext saved in localStorage. Re-enter the same passphrase and decrypt.');
      toast('Note encrypted and saved.');
    } catch (error) {
      show('crypto-result', `Encryption failed: ${error.message}`);
      toast(error.message || 'Encryption failed.', 'error');
    }
  };

  $('decrypt').onclick = async () => {
    try {
      const item = JSON.parse(localStorage.getItem('encrypted_demo_note'));
      if (!item) throw new Error('Encrypt a note first.');
      const bytes = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
      const clear = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: bytes(item.iv) },
        await cryptoKey($('passphrase').value, bytes(item.salt)),
        bytes(item.data)
      );
      const plaintext = new TextDecoder().decode(clear);
      show('crypto-result', plaintext);
      toast('Note decrypted.');
    } catch (error) {
      show('crypto-result', `Decryption failed: ${error.message}`);
      toast('Could not decrypt. Check the passphrase.', 'error');
    }
  };

  async function submitDemoAction(includeToken) {
    try {
      const headers = {};
      if (includeToken && secure) headers['X-CSRF-Token'] = document.body.dataset.csrf;
      const response = await fetch(`/demo-action?mode=${mode}`, { method: 'POST', headers });
      const data = await response.json();
      show('action-result', { status: response.status, ...data });
      toast(data.message, response.ok ? 'success' : 'error');
    } catch (error) {
      show('action-result', `Request failed: ${error.message}`);
      toast('Could not send the demo request.', 'error');
    }
  }

  $('demo-action').onclick = () => submitDemoAction(true);
  $('demo-action-no-token').onclick = () => submitDemoAction(false);
})();
