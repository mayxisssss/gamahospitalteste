
(function(){
  'use strict';
  const TOKEN_KEY='gamaAdminTokenV5';
  const $ = (s)=>document.querySelector(s);
  const content=$('[data-admin-content]'), title=$('[data-module-title]'), desc=$('[data-module-desc]'), addBtn=$('[data-add-btn]'), toast=$('[data-toast]');
  let token=sessionStorage.getItem(TOKEN_KEY)||'';
  let currentUser=null, data=structuredClone(window.DEFAULT_CMS_DATA), users=[], logs=[], stats=null, active='dashboard', editingIndex=null;
  const MODULES=[
    {key:'dashboard',title:'Dashboard',desc:'Novidades, estatísticas e atalhos.'},
    {key:'announcements',title:'Novidades do Painel',desc:'Mensagem exibida para todos os usuários do painel.'},
    {key:'site',title:'Dados gerais',desc:'Telefone, WhatsApp, endereço, domínio, redes sociais e logos.',type:'object',path:'site',fields:[['name','Nome do site'],['tagline','Frase do rodapé','textarea'],['domain','Domínio'],['website','URL oficial'],['phone','Telefone'],['whatsapp','WhatsApp com DDI/DDD'],['email','E-mail'],['address','Endereço','textarea'],['schedule','Horário/atendimento'],['googleMapsUrl','Link do Google Maps','textarea'],['googleMapsEmbed','Link embed do Google Maps','textarea'],['instagram','Link do Instagram'],['facebook','Link do Facebook'],['instagramIcon','Imagem personalizada do ícone Instagram','image'],['facebookIcon','Imagem personalizada do ícone Facebook','image'],['whatsappIcon','Imagem personalizada do ícone WhatsApp','image'],['showLaunchBadge','Mostrar etiqueta de lançamento? sim/não'],['launchTitle','Texto da etiqueta de lançamento'],['launchText','Texto secundário/domínio'],['logoSymbol','Logo pequena'],['logoFull','Logo completa'],['favicon','Favicon']]},
    {key:'home',title:'Página inicial',desc:'Banner, textos principais, números e CTA.',type:'object',path:'home',special:'home'},
    {key:'homeCards',title:'Cards da Inicial',desc:'Atalhos da página inicial.',type:'array',path:'homeCards',fields:[['icon','Letra/ícone'],['iconImage','Imagem no lugar do ícone','image'],['title','Título'],['description','Descrição','textarea'],['href','Link'],['label','Texto do botão']]},
    {key:'about',title:'Sobre',desc:'História, missão, visão e valores.',type:'object',path:'about',special:'about'},
    {key:'doctors',title:'Corpo Clínico',desc:'Adicionar, editar e remover médicos.',type:'array',path:'doctors',fields:[['name','Nome'],['specialty','Especialidade'],['crm','CRM'],['rqe','RQE'],['description','Descrição','textarea'],['photo','Foto','image'],['tags','Tags separadas por vírgula']]},
    {key:'specialties',title:'Especialidades',desc:'Adicionar, editar e remover especialidades.',type:'array',path:'specialties',fields:[['title','Nome'],['description','Descrição','textarea'],['icon','Letra/ícone'],['iconImage','Imagem no lugar do ícone','image']]},
    {key:'exams',title:'Exames',desc:'Adicionar, editar e remover exames.',type:'array',path:'exams',fields:[['title','Nome'],['description','Descrição','textarea'],['image','Imagem','image'],['iconImage','Imagem pequena/ícone','image']]},
    {key:'ophthalmology',title:'Núcleo de Oftalmologia',desc:'Textos principais e serviços do núcleo.',type:'object',path:'ophthalmology',special:'ophthalmology'},
    {key:'convenios',title:'Convênios',desc:'Adicionar e remover convênios.',type:'array',path:'convenios',fields:[['name','Nome do convênio']]},
    {key:'gallery',title:'Galeria',desc:'Adicionar, editar e remover fotos.',type:'array',path:'gallery',fields:[['title','Título'],['description','Descrição','textarea'],['image','Imagem','image']]},
    {key:'events',title:'Eventos',desc:'Adicionar, editar e remover eventos.',type:'array',path:'events',fields:[['date','Data/etiqueta'],['title','Título'],['description','Descrição','textarea'],['image','Imagem','image']]},
    {key:'users',title:'Usuários',desc:'Gerencie acessos do painel.'},
    {key:'logs',title:'Logs',desc:'Auditoria de ações e desfazer.'}
  ];
  const PERMS=MODULES.filter(m=>!['dashboard','users','logs'].includes(m.key)).map(m=>[m.key,m.title]).concat([['backup','Backup'],['reset','Resetar dados'],['logs','Logs']]);
  const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const clone=o=>JSON.parse(JSON.stringify(o));
  const show=m=>{toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2800)};
  async function api(path,{method='GET',body}={}){const r=await fetch('/.netlify/functions/'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Erro na solicitação');return j;}
  function can(k){if(!currentUser)return false;if(currentUser.manager||currentUser.fullAccess)return true;if(k==='dashboard')return true;return (currentUser.permissions||[]).includes(k)}
  function isMain(){return currentUser?.username==='MayconAdmin'}
  function canManage(u){if(!currentUser?.manager)return false;if(isMain())return true;if(!u)return true;if(u.protected||u.manager)return false;if(u.id===currentUser.id)return false;return true}
  function get(path){return path.split('.').reduce((o,k)=>o?.[k],data)}
  function set(path,value){const p=path.split('.');let o=data;while(p.length>1){const k=p.shift();o[k]=o[k]||{};o=o[k]}o[p[0]]=value}
  async function loadAll(){const d=await api('data'); data=Object.assign(clone(window.DEFAULT_CMS_DATA), d.data||{}); try{if(currentUser?.manager){users=(await api('users')).users||[]}}catch{} try{logs=(await api('logs')).logs||[]}catch{} try{stats=await api('stats?period=30')}catch{} }
  async function init(){
    $('[data-login-form]').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);try{const r=await api('auth-login',{method:'POST',body:{usuario:fd.get('usuario'),senha:fd.get('senha')}});token=r.token;currentUser=r.user;sessionStorage.setItem(TOKEN_KEY,token);$('[data-login-screen]').classList.add('hidden');$('[data-admin-app]').classList.remove('hidden');await loadAll();render()}catch(err){show(err.message)}};
    $('[data-logout]').onclick=()=>{sessionStorage.removeItem(TOKEN_KEY);location.reload()};
    if(token){try{currentUser=(await api('me')).user;$('[data-login-screen]').classList.add('hidden');$('[data-admin-app]').classList.remove('hidden');await loadAll();render()}catch{sessionStorage.removeItem(TOKEN_KEY)}}
  }
  function nav(){const visible=MODULES.filter(m=>m.key==='dashboard'||(m.key==='users'?currentUser?.manager:(m.key==='logs'?can('logs'):can(m.key))));if(!visible.some(m=>m.key===active))active='dashboard';$('[data-admin-nav]').innerHTML=visible.map(m=>`<button type="button" class="${m.key===active?'is-active':''}" data-nav="${m.key}">${m.title}</button>`).join('');document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{active=b.dataset.nav;editingIndex=null;render()})}
  function render(){nav();const m=MODULES.find(x=>x.key===active)||MODULES[0];title.textContent=m.title;desc.textContent=m.desc;addBtn.classList.toggle('hidden',m.type!=='array'||!can(m.key));addBtn.onclick=()=>{editingIndex=-1;renderArrayForm(m)}; if(m.key==='dashboard')dashboard();else if(m.key==='announcements')announcements();else if(m.key==='users')renderUsers();else if(m.key==='logs')renderLogs();else if(m.type==='array')renderArray(m);else renderObject(m)}
  function periodOptionsHTML(){
    return `<div class="stats-filter">
      <label>Período
        <select class="input" data-stats-period>
          <option value="today">Hoje</option>
          <option value="yesterday">Ontem</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30" selected>Últimos 30 dias</option>
          <option value="month">Este mês</option>
          <option value="all">Tudo</option>
          <option value="custom">Personalizado</option>
        </select>
      </label>
      <label>Início <input class="input" type="date" data-stats-start></label>
      <label>Fim <input class="input" type="date" data-stats-end></label>
      <button class="btn btn-primary" type="button" data-stats-apply>Filtrar</button>
      <button class="btn btn-outline" type="button" data-stats-export>Exportar CSV</button>
      <button class="btn btn-danger" type="button" data-stats-clear>Limpar período</button>
    </div>`;
  }

  function queryStatsString(){
    const period = document.querySelector('[data-stats-period]')?.value || '30';
    const params = new URLSearchParams({ period });
    if(period === 'custom'){
      const start = document.querySelector('[data-stats-start]')?.value || '';
      const end = document.querySelector('[data-stats-end]')?.value || '';
      if(start) params.set('start', start);
      if(end) params.set('end', end);
    }
    return params.toString();
  }

  async function refreshStats(){
    try{
      stats = await api('stats?' + queryStatsString());
      renderStatsPanel();
      show('Estatísticas atualizadas');
    }catch(err){ show(err.message); }
  }

  function statCard(label, value, hint=''){
    return `<div class="stat-box"><strong>${esc(value ?? 0)}</strong><span>${esc(label)}</span>${hint?`<small>${esc(hint)}</small>`:''}</div>`;
  }

  function barList(title, rows=[], empty='Sem dados no período.'){
    const max = Math.max(1, ...rows.map(r=>Number(r.value||0)));
    return `<section class="panel mini-panel"><h3>${esc(title)}</h3><div class="bar-list">${rows.length ? rows.map(r=>`<div class="bar-row"><div class="bar-head"><span>${esc(r.label)}</span><strong>${esc(r.value)}</strong></div><div class="bar-track"><i style="width:${Math.max(3,(Number(r.value||0)/max)*100)}%"></i></div></div>`).join('') : `<p class="muted">${empty}</p>`}</div></section>`;
  }

  function dailyChart(rows=[]){
    const max = Math.max(1, ...rows.map(r=>Number(r.pageViews||0)));
    return `<section class="panel mini-panel full"><h3>Acessos por dia</h3><div class="daily-chart">${rows.length ? rows.map(r=>`<div class="day-col" title="${esc(r.label)}: ${esc(r.pageViews)} visualizações"><span style="height:${Math.max(8,(Number(r.pageViews||0)/max)*120)}px"></span><small>${esc(r.label.slice(5))}</small></div>`).join('') : '<p class="muted">Sem dados no período.</p>'}</div></section>`;
  }

  function hourlyChart(rows=[]){
    const max = Math.max(1, ...rows.map(r=>Number(r.value||0)));
    return `<section class="panel mini-panel full"><h3>Horários com mais acessos</h3><div class="hour-chart">${rows.map(r=>`<div class="hour-col" title="${esc(r.label)}h: ${esc(r.value)} visualizações"><span style="height:${Math.max(4,(Number(r.value||0)/max)*90)}px"></span><small>${esc(r.label)}</small></div>`).join('')}</div></section>`;
  }

  function recentEvents(rows=[]){
    return `<section class="panel mini-panel full"><h3>Últimos eventos</h3><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Tipo</th><th>Página</th><th>Dispositivo</th><th>Origem</th></tr></thead><tbody>${rows.length ? rows.map(r=>`<tr><td>${new Date(r.created_at).toLocaleString('pt-BR')}</td><td>${esc(r.type)}</td><td>${esc(r.page||r.path||'')}</td><td>${esc(r.device||'')}</td><td>${esc(r.referrer||'Direto')}</td></tr>`).join('') : '<tr><td colspan="5">Sem eventos no período.</td></tr>'}</tbody></table></div></section>`;
  }

  function renderStatsPanel(){
    const mount = document.querySelector('[data-stats-panel]');
    if(!mount) return;
    const s = stats?.summary || {};
    mount.innerHTML = `
      <div class="stats-cards advanced">
        ${statCard('Visualizações', s.pageViews || 0)}
        ${statCard('Visitantes aprox.', s.visitors || 0)}
        ${statCard('Cliques WhatsApp', s.whatsapp || 0, `${s.conversionRate || 0}% conversão`)}
        ${statCard('Google Maps', s.maps || 0)}
        ${statCard('Instagram', s.instagram || 0)}
        ${statCard('Facebook', s.facebook || 0)}
        ${statCard('Outros links', s.links || 0)}
        ${statCard('Eventos totais', s.events || 0)}
      </div>
      <div class="stats-grid">
        ${dailyChart(stats?.daily || [])}
        ${hourlyChart(stats?.hourly || [])}
        ${barList('Páginas mais acessadas', stats?.byPage || [])}
        ${barList('Dispositivos', stats?.byDevice || [])}
        ${barList('Origem dos acessos', stats?.byReferrer || [])}
        ${barList('Tipos de evento', stats?.byType || [])}
        ${barList('Links mais clicados', stats?.topLinks || [])}
        ${barList('WhatsApp por página', stats?.topWhatsAppPages || [])}
        ${recentEvents(stats?.recent || [])}
      </div>`;
  }

  function dashboard(){
    const n=data.adminNotice||{};
    content.innerHTML=`<section class="panel notice-panel"><div class="notice-label">Novidades</div><h2>${esc(n.title||'Bem-vindo ao painel')}</h2><p class="muted" style="margin-top:10px;">${esc(n.message||'Nenhuma novidade cadastrada.')}</p></section>
      <section class="panel"><div class="dashboard-title-row"><div><h2>Estatísticas do site</h2><p class="muted">Acompanhe acessos, páginas, cliques e origens usando dados salvos no Supabase.</p></div></div>${periodOptionsHTML()}<div data-stats-panel></div></section>
      <section class="panel"><h2>Atalhos</h2><div class="toolbar" style="margin-top:18px;">${can('backup')?'<button class="btn btn-outline" data-export>Exportar conteúdo</button>':''}${can('reset')?'<button class="btn btn-danger" data-reset-total>Resetar tudo</button>':''}</div></section>`;
    renderStatsPanel();
    const ex=$('[data-export]'); if(ex)ex.onclick=()=>download('gama-conteudo.json',JSON.stringify(data,null,2));
    const rt=$('[data-reset-total]'); if(rt)rt.onclick=resetTotal;
    const apply=$('[data-stats-apply]'); if(apply)apply.onclick=refreshStats;
    const period=$('[data-stats-period]');
    if(period) period.onchange=()=>{ document.body.classList.toggle('custom-stats-period', period.value==='custom'); if(period.value!=='custom') refreshStats(); };
    const exportBtn=$('[data-stats-export]');
    if(exportBtn) exportBtn.onclick=()=>{ window.open('/.netlify/functions/stats?' + queryStatsString() + '&format=csv', '_blank'); };
    const clearBtn=$('[data-stats-clear]');
    if(clearBtn) clearBtn.onclick=async()=>{ if(confirm('Apagar estatísticas deste período? Essa ação remove os eventos do banco.')){ try{ await api('stats?' + queryStatsString(), {method:'DELETE'}); stats=await api('stats?' + queryStatsString()); renderStatsPanel(); show('Estatísticas apagadas no período.'); }catch(err){ show(err.message); } } };
  }

  function announcements(){const n=data.adminNotice||{};content.innerHTML=`<form class="panel" data-form><h2>Novidades do painel</h2><div class="grid-2">${input('title','Título','',n.title)}${input('message','Mensagem','textarea',n.message)}</div><button class="btn btn-primary" style="margin-top:20px;">Salvar</button></form>`;$('[data-form]').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);data.adminNotice={title:f.get('title'),message:f.get('message'),updatedAt:new Date().toLocaleString('pt-BR')};await saveData('Atualizou novidades do painel');active='dashboard';render()}}
  function input(n,l,t='',v=''){if(t==='textarea')return`<div class="form-row full"><label>${l}</label><textarea name="${n}">${esc(v)}</textarea></div>`;if(t==='image')return`<div class="form-row full"><label>${l}</label><input class="input" name="${n}" value="${esc(v)}" placeholder="URL ou upload"><input class="input" data-file="${n}" type="file" accept="image/*" style="margin-top:8px"></div>`;return`<div class="form-row"><label>${l}</label><input class="input" name="${n}" value="${esc(v)}"></div>`}
  function bindFiles(form){form.querySelectorAll('[data-file]').forEach(inp=>inp.onchange=()=>{const file=inp.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{form.elements[inp.dataset.file].value=r.result;show('Imagem carregada')};r.readAsDataURL(file)})}
  function read(form,fields){const fd=new FormData(form);const o={};fields.forEach(([n])=>{o[n]=n==='showLaunchBadge'?String(fd.get(n)||'').toLowerCase().startsWith('s')||fd.get(n)==='true'||fd.get(n)==='1':fd.get(n)||''});return o}
  function renderObject(m){if(m.special==='home')return homeForm();if(m.special==='about')return aboutForm();if(m.special==='ophthalmology')return ophForm();const o=get(m.path)||{};content.innerHTML=`<form class="panel" data-form><div class="grid-2">${m.fields.map(f=>input(f[0],f[1],f[2],o[f[0]])).join('')}</div><button class="btn btn-primary" style="margin-top:20px;">Salvar</button></form>`;const form=$('[data-form]');bindFiles(form);form.onsubmit=async e=>{e.preventDefault();set(m.path,read(form,m.fields));await saveData('Editou '+m.title)}}
  function homeForm(){const h=data.home||{};content.innerHTML=`<form class="panel" data-form><div class="grid-2">${input('heroKicker','Chamada pequena','',h.heroKicker)}${input('heroTitle','Título principal','textarea',h.heroTitle)}${input('heroLead','Texto principal','textarea',h.heroLead)}${input('heroImage','Imagem principal','image',h.heroImage)}${input('badgesText','Selos - um por linha','textarea',(h.badges||[]).join('\n'))}${input('statsText','Números - número | texto','textarea',(h.stats||[]).map(s=>`${s.number} | ${s.label}`).join('\n'))}${input('ctaTitle','Título CTA','',h.ctaTitle)}${input('ctaText','Texto CTA','textarea',h.ctaText)}</div><button class="btn btn-primary" style="margin-top:20px;">Salvar</button></form>`;const form=$('[data-form]');bindFiles(form);form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form);Object.assign(data.home,{heroKicker:fd.get('heroKicker'),heroTitle:fd.get('heroTitle'),heroLead:fd.get('heroLead'),heroImage:fd.get('heroImage'),badges:String(fd.get('badgesText')||'').split('\n').filter(Boolean),stats:String(fd.get('statsText')||'').split('\n').map(x=>{const [number,...r]=x.split('|');return{number:(number||'').trim(),label:r.join('|').trim()}}).filter(s=>s.number||s.label),ctaTitle:fd.get('ctaTitle'),ctaText:fd.get('ctaText')});await saveData('Editou página inicial')}}
  function aboutForm(){const a=data.about||{};content.innerHTML=`<form class="panel" data-form><div class="grid-2">${input('title','Título','',a.title)}${input('subtitle','Subtítulo','textarea',a.subtitle)}${input('whoTitle','Título quem somos','textarea',a.whoTitle)}${input('paragraphsText','Parágrafos - um por linha','textarea',(a.paragraphs||[]).join('\n'))}${input('image','Imagem','image',a.image)}${input('mission','Missão','textarea',a.mission)}${input('vision','Visão','textarea',a.vision)}${input('values','Valores','textarea',a.values)}</div><button class="btn btn-primary" style="margin-top:20px;">Salvar</button></form>`;const form=$('[data-form]');bindFiles(form);form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form);Object.assign(data.about,{title:fd.get('title'),subtitle:fd.get('subtitle'),whoTitle:fd.get('whoTitle'),paragraphs:String(fd.get('paragraphsText')||'').split('\n').filter(Boolean),image:fd.get('image'),mission:fd.get('mission'),vision:fd.get('vision'),values:fd.get('values')});await saveData('Editou Sobre')}}
  function ophForm(){const o=data.ophthalmology||{};content.innerHTML=`<form class="panel" data-form><div class="grid-2">${input('title','Título','',o.title)}${input('subtitle','Subtítulo','textarea',o.subtitle)}${input('introText','Texto','textarea',o.introText)}${input('image','Imagem','image',o.image)}</div><button class="btn btn-primary" style="margin-top:20px;">Salvar</button></form>`;const form=$('[data-form]');bindFiles(form);form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form);Object.assign(data.ophthalmology,{title:fd.get('title'),subtitle:fd.get('subtitle'),introText:fd.get('introText'),image:fd.get('image')});await saveData('Editou Oftalmologia')}}
  function renderArray(m){const arr=get(m.path)||[];content.innerHTML=`<section class="panel"><div class="table-wrap"><table class="table"><thead><tr>${m.fields.slice(0,4).map(f=>`<th>${f[1]}</th>`).join('')}<th>Ações</th></tr></thead><tbody>${arr.map((it,i)=>`<tr>${m.fields.slice(0,4).map(f=>`<td>${f[2]==='image'&&it[f[0]]?'<img class="preview-img" src="'+esc(it[f[0]])+'">':esc(it[f[0]]||'')}</td>`).join('')}<td><button class="btn btn-outline btn-small" data-edit="${i}">Editar</button> <button class="btn btn-danger btn-small" data-remove="${i}">Remover</button></td></tr>`).join('')}</tbody></table></div></section><div data-array-form></div>`;document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{editingIndex=+b.dataset.edit;renderArrayForm(m)});document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=async()=>{if(confirm('Remover este item?')){arr.splice(+b.dataset.remove,1);set(m.path,arr);await saveData('Removeu item em '+m.title);renderArray(m)}})}
  function renderArrayForm(m){const arr=get(m.path)||[], it=editingIndex>=0?arr[editingIndex]:{};const target=document.querySelector('[data-array-form]')||content;target.innerHTML=`<form class="panel" data-item><h2>${editingIndex>=0?'Editar':'Adicionar'} ${m.title}</h2><div class="grid-2">${m.fields.map(f=>input(f[0],f[1],f[2],it[f[0]])).join('')}</div><div class="toolbar" style="margin-top:20px"><button class="btn btn-primary">Salvar</button><button type="button" class="btn btn-outline" data-cancel>Cancelar</button></div></form>`;const form=$('[data-item]');bindFiles(form);$('[data-cancel]').onclick=()=>renderArray(m);form.onsubmit=async e=>{e.preventDefault();const obj=read(form,m.fields);if(editingIndex>=0)arr[editingIndex]=obj;else arr.push(obj);set(m.path,arr);await saveData((editingIndex>=0?'Editou':'Adicionou')+' item em '+m.title);editingIndex=null;renderArray(m)};target.scrollIntoView({behavior:'smooth'})}
  async function saveData(action){await api('data',{method:'PUT',body:{data,action,area:active}});show('Salvo no banco de dados');await loadAll()}
  function renderUsers(){if(!currentUser?.manager)return dashboard();content.innerHTML=`<section class="panel"><button class="btn btn-primary" data-new>Novo usuário</button><div class="table-wrap" style="margin-top:16px"><table class="table"><thead><tr><th>Usuário</th><th>Nome</th><th>Tipo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${users.map((u,i)=>`<tr><td>${esc(u.username)}</td><td>${esc(u.name||'')}</td><td>${u.manager?'Gerenciador':'Usuário'}</td><td>${u.active?'Ativo':'Bloqueado'}</td><td>${canManage(u)?`<button class="btn btn-outline btn-small" data-uedit="${i}">Editar</button> ${!u.protected?`<button class="btn btn-danger btn-small" data-udel="${i}">Remover</button>`:''}`:''}</td></tr>`).join('')}</tbody></table></div></section><div data-user-form></div>`;$('[data-new]').onclick=()=>userForm(-1);document.querySelectorAll('[data-uedit]').forEach(b=>b.onclick=()=>userForm(+b.dataset.uedit));document.querySelectorAll('[data-udel]').forEach(b=>b.onclick=async()=>{const u=users[+b.dataset.udel];if(confirm('Remover usuário?')){await api('users?id='+encodeURIComponent(u.id),{method:'DELETE'});await loadAll();renderUsers()}})}
  function userForm(i){const u=i>=0?users[i]:{username:'',name:'',active:true,permissions:[]};const principal=u.username==='MayconAdmin';if(i>=0&&!canManage(u))return show('Você não pode alterar este usuário.');const permBlock=principal?'':`<div class="form-row full"><label class="check"><input type="checkbox" name="manager" ${u.manager?'checked':''} ${!isMain()?'disabled':''}> Gerenciador</label></div><div class="form-row full"><label class="check"><input type="checkbox" name="fullAccess" ${u.fullAccess?'checked':''}> Acesso total</label></div><div class="form-row full"><label>Permissões específicas</label><div class="permission-grid">${PERMS.map(([k,l])=>`<label class="check"><input type="checkbox" name="perm" value="${k}" ${(u.permissions||[]).includes(k)?'checked':''}> ${l}</label>`).join('')}</div></div>`;document.querySelector('[data-user-form]').innerHTML=`<form class="panel" data-user><h2>${i>=0?'Editar':'Criar'} usuário</h2><div class="grid-2"><div class="form-row"><label>Usuário</label><input class="input" name="username" value="${esc(u.username)}" ${i>=0?'readonly':''} required></div><div class="form-row"><label>Nome</label><input class="input" name="name" value="${esc(u.name||'')}"></div><div class="form-row"><label>Senha ${i>=0?'(em branco mantém)':''}</label><input class="input" name="password" type="password" ${i<0?'required':''}></div><div class="form-row"><label>Status</label><select name="active"><option value="1" ${u.active!==false?'selected':''}>Ativo</option><option value="0" ${u.active===false?'selected':''}>Bloqueado</option></select></div>${permBlock}</div><button class="btn btn-primary" style="margin-top:20px">Salvar usuário</button></form>`;const form=$('[data-user]');form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form);const body={id:u.id,username:fd.get('username'),name:fd.get('name'),password:fd.get('password'),active:fd.get('active')==='1'};if(!principal){body.manager=fd.get('manager')==='on';body.fullAccess=fd.get('fullAccess')==='on';body.permissions=Array.from(form.querySelectorAll('input[name=perm]:checked')).map(x=>x.value)}await api('users',{method:i>=0?'PUT':'POST',body});await loadAll();renderUsers()}}
  function renderLogs(){content.innerHTML=`<section class="panel"><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Usuário</th><th>Ação</th><th>Área</th><th></th></tr></thead><tbody>${logs.map(l=>`<tr><td>${new Date(l.created_at).toLocaleString('pt-BR')}</td><td>${esc(l.username||'')}</td><td>${esc(l.action||'')}</td><td>${esc(l.area||'')}</td><td>${l.before_data?`<button class="btn btn-outline btn-small" data-undo="${l.id}">Desfazer</button>`:''}</td></tr>`).join('')}</tbody></table></div></section>`;document.querySelectorAll('[data-undo]').forEach(b=>b.onclick=async()=>{if(confirm('Desfazer ação?')){await api('logs',{method:'POST',body:{action:'undo',id:b.dataset.undo}});await loadAll();renderLogs()}})}
  async function resetTotal(){if(confirm('Resetar tudo literalmente no banco?')){await api('data',{method:'POST',body:{action:'reset-total',emptyData:{}}});await loadAll();render()}}
  function download(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
  init();
})();
