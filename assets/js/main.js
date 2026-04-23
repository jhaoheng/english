// assets/js/main.js
(async function(){
  const md = window.markdownit({html:false});
  const outlineEl = document.getElementById('outline');
  const contentEl = document.getElementById('content');

  function filenameToTitle(name){
    // Remove extension and decode
    const base = name.replace(/\.md$/i, '');
    return decodeURIComponent(base).replace(/[-_]+/g,' ').trim();
  }

  async function loadIndex(){
    try{
      const res = await fetch('content/index.json');
      if(!res.ok) throw new Error('index.json not found');
      const list = await res.json();
      renderOutline(list);
    }catch(e){
      outlineEl.innerHTML = '<p>無法讀取 content/index.json，請確認檔案存在或產生 index.json。</p>';
    }
  }

  function renderOutline(list){
    const ul = document.createElement('ul');
    list.forEach(fname=>{
      const li = document.createElement('li');
      const a = document.createElement('a');
      const url = '?file=' + encodeURIComponent(fname);
      a.href = url;
      a.textContent = filenameToTitle(fname);
      li.appendChild(a);
      ul.appendChild(li);
    });
    outlineEl.innerHTML = '';
    outlineEl.appendChild(ul);
  }

  async function loadFileFromQuery(){
    const params = new URLSearchParams(location.search);
    const file = params.get('file');
    if(file){
      await loadAndRenderFile(file);
    } else {
      contentEl.innerHTML = '<p>請從左側選擇一篇文章。</p>';
    }
  }

  async function loadAndRenderFile(fname){
    try{
      const res = await fetch('content/' + encodeURIComponent(fname));
      if(!res.ok) throw new Error('not found');
      const text = await res.text();
      const html = md.render(text);
      contentEl.innerHTML = DOMPurify.sanitize(html);
    }catch(e){
      contentEl.innerHTML = '<p>無法載入檔案：' + fname + '</p>';
    }
  }

  // Init
  await loadIndex();
  await loadFileFromQuery();

  // Handle navigation clicks (so SPA doesn't reload)
  window.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href');
    if(href && href.startsWith('?file=')){
      e.preventDefault();
      history.pushState(null, '', href);
      const params = new URLSearchParams(href.replace('?',''));
      const f = params.get('file');
      loadAndRenderFile(f);
    }
  });

  window.addEventListener('popstate', loadFileFromQuery);
})();
