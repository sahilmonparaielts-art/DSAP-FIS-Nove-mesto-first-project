(() => {
  const mode = document.body.dataset.mode;
  const secure = mode !== 'vulnerable';
  const $ = (id) => document.getElementById(id);
  const show = (id, value) => { $(id).textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); };
  const dbOpen = () => new Promise((resolve, reject) => {
    const req = indexedDB.open('StorageSecurityDemo', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('notes');
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
  });
  async function idb(mode, value) {
    const db = await dbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', mode), store = tx.objectStore('notes');
      const req = mode === 'readwrite' ? store.put(value, 'sample') : store.get('sample');
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
  }
  $('login').onclick = async () => {
    const r = await fetch('/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('username').value,password:$('password').value})});
    const data = await r.json();
    if (data.ok && !secure) localStorage.setItem('demo_session_id', 'fake-session-for-classroom');
    if (data.csrf_token) document.body.dataset.csrf = data.csrf_token;
    show('login-result', data.message || `Signed in as ${data.username}`);
  };
  $('save-storage').onclick = async () => {
    const note = $('note').value;
    localStorage.setItem('demo_note', note); sessionStorage.setItem('demo_note', note); await idb('readwrite', note);
    show('storage-result', 'Saved fictional note to localStorage, sessionStorage, and IndexedDB.');
  };
  $('render-note').onclick = () => {
    if (secure) $('note-preview').textContent = $('note').value;
    else $('note-preview').innerHTML = $('note').value;
  };
  $('read-storage').onclick = async () => show('storage-result', {
    localStorage: localStorage.getItem('demo_note'), sessionStorage: sessionStorage.getItem('demo_note'),
    indexedDB: await idb('readonly'), demoSession: localStorage.getItem('demo_session_id')
  });
  $('clear-storage').onclick = async () => {
    localStorage.removeItem('demo_note'); localStorage.removeItem('demo_session_id'); sessionStorage.removeItem('demo_note');
    const db = await dbOpen(); await new Promise((resolve) => { const tx=db.transaction('notes','readwrite'); tx.objectStore('notes').clear(); tx.oncomplete=resolve; });
    show('storage-result', 'Cleared the lab values.');
  };
  $('xss-demo').onclick = () => {
    const payload = $('xss-payload').value || $('xss-payload').placeholder;
    if (secure) {
      $('xss-preview').textContent = payload;
      show('xss-result', 'Secured mode: the payload is shown as text; it did not run.');
    } else {
      $('xss-result').textContent = 'If the demonstration runs, the localStorage note will appear here.';
      $('xss-preview').innerHTML = payload;
    }
  };
  async function cryptoKey(passphrase, salt) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'}, material, {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
  }
  $('encrypt').onclick = async () => {
    try {
      const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
      const key=await cryptoKey($('passphrase').value, salt);
      const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode($('note').value));
      const b64=(a)=>btoa(String.fromCharCode(...a));
      localStorage.setItem('encrypted_demo_note', JSON.stringify({salt:b64(salt),iv:b64(iv),data:b64(new Uint8Array(ciphertext))}));
      show('crypto-result', 'Ciphertext saved in localStorage. Re-enter the same passphrase and decrypt.');
    } catch(e) { show('crypto-result', `Encryption failed: ${e.message}`); }
  };
  $('decrypt').onclick = async () => {
    try {
      const item=JSON.parse(localStorage.getItem('encrypted_demo_note'));
      if(!item) throw new Error('Encrypt a note first.');
      const bytes=(s)=>Uint8Array.from(atob(s), c=>c.charCodeAt(0));
      const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(item.iv)},await cryptoKey($('passphrase').value,bytes(item.salt)),bytes(item.data));
      show('crypto-result', new TextDecoder().decode(clear));
    } catch(e) { show('crypto-result', `Decryption failed: ${e.message}`); }
  };
  $('demo-action').onclick = async () => {
    const headers={}; if(secure) headers['X-CSRF-Token']=document.body.dataset.csrf;
    const r=await fetch(`/demo-action?mode=${mode}`,{method:'POST',headers}); show('action-result', await r.json());
  };
  $('demo-action-no-token').onclick = async () => {
    const r=await fetch(`/demo-action?mode=${mode}`,{method:'POST'}); show('action-result', await r.json());
  };
})();
