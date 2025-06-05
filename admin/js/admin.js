(function(){
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loginBtn = document.getElementById('loginBtn');
const navButtons = document.querySelectorAll('nav button');
const sections = document.querySelectorAll('.section');

function showSection(id){
  sections.forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  localStorage.setItem('section', id);
}

loginBtn.onclick = function(){
  const l = document.getElementById('login').value;
  const p = document.getElementById('pass').value;
  if(l==='admin' && p==='password'){
    localStorage.setItem('logged', '1');
    loginScreen.style.display='none';
    app.style.display='block';
    showSection(localStorage.getItem('section')||'faq');
  }else alert('wrong');
};

if(localStorage.getItem('logged')){
  loginScreen.style.display='none';
  app.style.display='block';
  showSection(localStorage.getItem('section')||'faq');
}

navButtons.forEach(b=>b.onclick=()=>showSection(b.dataset.sec));

// TSV work
const faqTable = document.getElementById('faqTable');
function parseTSV(txt){
  return txt.trim().split(/\n+/).map(line=>line.split('\t'));
}
function renderTable(rows){
  faqTable.innerHTML = '';
  const header = ['ключевики','минус-слова','категория','ответ'];
  const thead = document.createElement('tr');
  header.forEach(h=>{const th=document.createElement('th');th.textContent=h;thead.appendChild(th);});
  faqTable.appendChild(thead);
  rows.forEach((r,i)=>{
    const tr=document.createElement('tr');
    r.forEach((cell,j)=>{
      const td=document.createElement('td');td.contentEditable=true;td.textContent=cell;tr.appendChild(td);});
    const del=document.createElement('td');del.textContent='✖';del.style.cursor='pointer';
    del.onclick=()=>{rows.splice(i,1);renderTable(rows);};
    tr.appendChild(del);
    faqTable.appendChild(tr);
  });
}
let currentRows=[];
document.getElementById('loadTsv').onclick=()=>{
  const url=document.getElementById('tsvUrl').value;
  if(url){fetch(url).then(r=>r.text()).then(txt=>{currentRows=parseTSV(txt);renderTable(currentRows);});}
};
document.getElementById('tsvFile').onchange=e=>{
  const file=e.target.files[0];
  if(!file)return;
  const fr=new FileReader();
  fr.onload=()=>{currentRows=parseTSV(fr.result);renderTable(currentRows);};
  fr.readAsText(file);
};
document.getElementById('addRow').onclick=()=>{currentRows.push(['','','','']);renderTable(currentRows);};
document.getElementById('saveTsv').onclick=()=>{
  const lines=[...faqTable.querySelectorAll('tr')].slice(1).map(tr=>[...tr.children].slice(0,4).map(td=>td.textContent.trim()).join('\t'));
  const data=lines.join('\n');
  const blob=new Blob([data],{type:'text/tab-separated-values'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='faq.tsv';a.click();
};

// Settings
const cfgFields={colorPick:'color',greeting:'greeting',autoReply:'autoReply',sound:'sound',anim:'animation'};
function loadCfg(){fetch('/chat-config.json').then(r=>r.json()).then(cfg=>{for(const k in cfgFields){const el=document.getElementById(k);if(!el)continue;if(el.type==='checkbox')el.checked=cfg[cfgFields[k]];else el.value=cfg[cfgFields[k]];}});}
loadCfg();
document.getElementById('saveCfg').onclick=()=>{
  const cfg={};
  for(const k in cfgFields){const el=document.getElementById(k);cfg[cfgFields[k]]=el.type==='checkbox'?el.checked:el.value;}
  fetch('/chat-config',{method:'POST',body:JSON.stringify(cfg)});
};

// Analytics demo
function loadAnalytics(){
  Promise.all([fetch('/user-queries.json').then(r=>r.json()).catch(()=>[]),fetch('/user-ratings.json').then(r=>r.json()).catch(()=>[])]).then(([q,r])=>{
    const ctx=document.getElementById('chart');
    new Chart(ctx,{type:'bar',data:{labels:['Всего сообщений'],datasets:[{label:'count',data:[q.length]}]}});
  });
}
loadAnalytics();
})();
