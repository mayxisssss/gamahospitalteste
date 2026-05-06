
(function () {
  "use strict";

  const STORAGE_KEY = "gamaCMSData";
  const TOTAL_RESET_KEY = "gamaCMSTotalReset";
  const body = document.body;
  const rootPath = body.dataset.root || (location.pathname.includes("/pages/") ? "../" : "./");
  const currentPage = body.dataset.page || "home";
  let data = loadData();

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function emptyData() {
    return {
      site: { name:"", tagline:"", logoFull:"assets/logo/logo-completa.png", logoSymbol:"assets/logo/logo-simbolo.png", favicon:"assets/logo/favicon.png", phone:"", whatsapp:"", email:"", address:"", schedule:"", googleMapsUrl:"", googleMapsEmbed:"", instagram:"", facebook:"", domain:"gamahospitaldia.com", website:"https://gamahospitaldia.com", launchTitle:"", launchText:"" },
      home: { heroKicker:"", heroTitle:"", heroLead:"", heroImage:"", heroImageTitle:"", heroImageText:"", badges:[], stats:[], sectionTitle:"", sectionText:"", modelTitle:"", modelText:"", modelBullets:[], ctaTitle:"", ctaText:"" },
      about: { title:"", subtitle:"", whoTitle:"", paragraphs:[], image:"", timeline:[], mission:"", vision:"", values:"" },
      doctors: [], specialties: [], exams: [], ophthalmology: { title:"", subtitle:"", introTitle:"", introText:"", image:"", services:[] }, convenios: [], gallery: [], events: []
    };
  }
  function loadData() {
    try {
      if (localStorage.getItem(TOTAL_RESET_KEY) === "1") return emptyData();
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return mergeDeep(clone(window.DEFAULT_CMS_DATA), JSON.parse(saved));
    } catch (error) { console.warn("Não foi possível carregar dados salvos.", error); }
    return clone(window.DEFAULT_CMS_DATA);
  }
  function mergeDeep(target, source) {
    if (!source || typeof source !== "object") return target;
    Object.keys(source).forEach((key) => {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        target[key] = mergeDeep(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    });
    return target;
  }

  const esc = (str = "") => String(str).replace(/[&<>"']/g, (m) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[m]));
  const nl2p = (arr) => (arr || []).map(p => `<p style="margin-top: 18px;">${esc(p)}</p>`).join("");
  const asset = (path = "") => path.startsWith("http") || path.startsWith("data:") || path.startsWith("/") ? path : `${rootPath}${path}`;
  const image = (src, alt = "") => src ? `<img src="${asset(src)}" alt="${esc(alt)}" onerror="this.style.display='none'; this.parentElement.classList.add('avatar-placeholder'); this.parentElement.innerHTML='${esc(data.site.name)}';">` : `<div class="avatar-placeholder">${esc(data.site.name)}</div>`;
  const whatsappMessage = encodeURIComponent("Olá! Vim pelo site do Gama Hospital Dia e gostaria de agendar.");
  function getWhatsappUrl(){ return `https://wa.me/${data.site.whatsapp}?text=${whatsappMessage}`; }

  const isValidLink = (url) => url && url !== "#";
  function svgIcon(kind) {
    const icons = {
      whatsapp: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.04 3.2A12.7 12.7 0 0 0 5.1 22.3L3.8 29l6.86-1.79A12.7 12.7 0 1 0 16.04 3.2Zm0 22.94c-1.96 0-3.78-.56-5.33-1.53l-.38-.23-4.07 1.06 1.08-3.96-.25-.4a10.24 10.24 0 1 1 8.95 5.06Zm5.84-7.66c-.32-.16-1.9-.94-2.2-1.05-.3-.1-.52-.16-.74.16-.22.32-.85 1.05-1.04 1.27-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.59-.95-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.5.14-.66.15-.15.32-.38.49-.57.16-.19.22-.32.32-.54.1-.22.05-.4-.03-.57-.08-.16-.74-1.79-1.02-2.45-.27-.65-.54-.56-.74-.57h-.63c-.22 0-.57.08-.87.4-.3.32-1.14 1.11-1.14 2.71 0 1.6 1.17 3.15 1.33 3.36.16.22 2.3 3.5 5.57 4.91.78.34 1.39.54 1.86.69.78.25 1.5.21 2.06.13.63-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.14-.3-.22-.62-.38Z"/></svg>`,
      instagram: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10.2 3.7h11.6a6.5 6.5 0 0 1 6.5 6.5v11.6a6.5 6.5 0 0 1-6.5 6.5H10.2a6.5 6.5 0 0 1-6.5-6.5V10.2a6.5 6.5 0 0 1 6.5-6.5Zm0 2.4a4.1 4.1 0 0 0-4.1 4.1v11.6a4.1 4.1 0 0 0 4.1 4.1h11.6a4.1 4.1 0 0 0 4.1-4.1V10.2a4.1 4.1 0 0 0-4.1-4.1H10.2Zm5.8 5.1a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2.4a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Zm6.1-3.4a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z"/></svg>`,
      facebook: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M18.3 29V17.9h3.7l.56-4.33H18.3v-2.76c0-1.25.35-2.1 2.15-2.1h2.3V4.84c-.4-.05-1.77-.17-3.36-.17-3.32 0-5.6 2.03-5.6 5.76v3.15h-3.76v4.33h3.76V29h4.5Z"/></svg>`
    };
    return icons[kind] || "";
  }
  function socialIcon(kind, imageSrc = "", alt = "") {
    if (imageSrc) return `<img src="${asset(imageSrc)}" alt="${esc(alt)}">`;
    return svgIcon(kind);
  }
  function cardIconHTML(icon = "+", imageSrc = "", alt = "") {
    return `<div class="card-icon">${imageSrc ? `<img src="${asset(imageSrc)}" alt="${esc(alt)}">` : esc(icon || "+")}</div>`;
  }
  function socialHTML(place = "footer") {
    const items = [
      ["instagram", "Instagram", data.site.instagram, data.site.instagramIcon],
      ["facebook", "Facebook", data.site.facebook, data.site.facebookIcon]
    ].filter(([, , url]) => isValidLink(url));
    if (!items.length) return "";
    return `<div class="social-links social-${place}">${items.map(([kind,label,url,img]) => `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${label}"><span class="social-icon">${socialIcon(kind, img, label)}</span><span class="social-label">${label}</span></a>`).join("")}</div>`;
  }
  function floatingSocialHTML() {
    const socials = [
      ["instagram", "Instagram", data.site.instagram, data.site.instagramIcon],
      ["facebook", "Facebook", data.site.facebook, data.site.facebookIcon]
    ].filter(([, , url]) => isValidLink(url));
    return `<div class="floating-socials">
      ${socials.map(([kind,label,url,img]) => `<a class="fab-button fab-${kind}" href="${esc(url)}" target="_blank" rel="noopener" aria-label="${label}"><span class="fab-icon">${socialIcon(kind, img, label)}</span></a>`).join("")}
      <a class="fab-button fab-whatsapp" href="${getWhatsappUrl()}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp"><span class="fab-icon">${socialIcon("whatsapp", data.site.whatsappIcon, "WhatsApp")}</span></a>
    </div>`;
  }

  const NAV_ITEMS = [
    ["Início", "index.html", "home"],
    ["Sobre", "pages/sobre.html", "sobre"],
    ["Corpo Clínico", "pages/corpo-clinico.html", "corpo-clinico"],
    ["Especialidades", "pages/especialidades.html", "especialidades"],
    ["Exames", "pages/exames.html", "exames"],
    ["Oftalmologia", "pages/nucleo-oftalmologia.html", "nucleo-oftalmologia"],
    ["Convênios", "pages/convenios.html", "convenios"],
    ["Galeria", "pages/galeria.html", "galeria"],
    ["Eventos", "pages/eventos.html", "eventos"],
    ["Contato", "pages/contato.html", "contato"]
  ];

  function hrefFor(href, page) {
    if (page === "home") return rootPath === "../" ? "../index.html" : "index.html";
    return rootPath === "../" ? href.replace("pages/", "") : href;
  }

  function setMeta() {
    const favicon = document.querySelector("link[rel='icon']") || document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/png";
    favicon.href = asset(data.site.favicon);
    document.head.appendChild(favicon);
    let canonical = document.querySelector("link[rel='canonical']") || document.createElement("link");
    canonical.rel = "canonical";
    const path = location.pathname.includes("/pages/") ? `/${location.pathname.split("/pages/")[1]}` : "/";
    canonical.href = `${(data.site.website || "https://gamahospitaldia.com").replace(/\/$/, "")}${path}`;
    document.head.appendChild(canonical);
    const titleMap = {
      home: "Página Principal",
      sobre: "Sobre",
      "corpo-clinico": "Corpo Clínico",
      especialidades: "Especialidades",
      exames: "Exames",
      "nucleo-oftalmologia": "Núcleo de Oftalmologia",
      convenios: "Convênios",
      galeria: "Galeria",
      eventos: "Eventos",
      contato: "Contato"
    };
    document.title = `${titleMap[currentPage] || "Site"} | ${data.site.name}`;
  }

  function renderHeader() {
    const mount = document.querySelector("[data-site-header]");
    if (!mount) return;
    const links = NAV_ITEMS.map(([label, href, page]) => `<a class="nav-link ${currentPage === page ? "is-active" : ""}" href="${hrefFor(href, page)}">${label}</a>`).join("");
    mount.innerHTML = `
      <header class="site-header" data-header>
        <div class="container header-inner">
          <a class="brand" href="${rootPath === "../" ? "../index.html" : "index.html"}" aria-label="Página inicial ${esc(data.site.name)}">
            <span class="brand-mark"><img src="${asset(data.site.logoSymbol)}" alt="${esc(data.site.name)}"></span>
            <span class="brand-text"><strong>${esc(data.site.name)}</strong><small>Hospital Dia · Bocaiúva/MG</small></span>
          </a>
          <button class="menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" data-menu-toggle><span></span><span></span><span></span></button>
          <nav class="main-nav" aria-label="Menu principal" data-main-nav>${links}</nav>
          <a class="btn btn-primary header-cta" href="${getWhatsappUrl()}" target="_blank" rel="noopener">Agendar</a>
        </div>
      </header>`;
  }

  function renderFooter() {
    const mount = document.querySelector("[data-site-footer]");
    if (!mount) return;
    const links = NAV_ITEMS.map(([label, href, page]) => `<a href="${hrefFor(href, page)}">${label}</a>`).join("");
    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div class="footer-brand">
            <div class="footer-brand-row">
              <img src="${asset(data.site.logoSymbol)}" alt="${esc(data.site.name)}">
              <div><strong>${esc(data.site.name)}</strong><p>${esc(data.site.tagline)}</p>${socialHTML("footer")}</div>
            </div>
          </div>
          <div><h3>Mapa do site</h3><div class="footer-links">${links}<a class="footer-admin" href="${rootPath}admin/index.html">Área administrativa</a></div></div>
          <div><h3>Contato</h3><ul class="footer-contact">
            <li><strong>Telefone:</strong> ${esc(data.site.phone)}</li>
            <li><strong>WhatsApp:</strong> <a href="${getWhatsappUrl()}" target="_blank" rel="noopener">${esc(data.site.phone)}</a></li>
            <li><strong>Atendimento:</strong> ${esc(data.site.schedule)}</li>
            <li><strong>Endereço:</strong> ${esc(data.site.address)}</li><li>${socialHTML("contact")}</li>
          </ul></div>
        </div>
        <div class="container footer-bottom"><span>© <span data-current-year></span> ${esc(data.site.name)}. Todos os direitos reservados.</span><a href="${getWhatsappUrl()}" target="_blank" rel="noopener">Falar no WhatsApp</a></div>
      </footer>
      ${floatingSocialHTML()}`;
  }

  function pageHero(title, subtitle, kicker = "Institucional") {
    return `<section class="page-hero"><div class="container page-hero-content reveal"><div class="breadcrumb"><a href="${rootPath === "../" ? "../index.html" : "index.html"}">Início</a><span>/</span><span>${esc(title)}</span></div><span class="kicker">${esc(kicker)}</span><h1>${esc(title)}</h1><p class="lead" style="margin-top:18px;">${esc(subtitle)}</p></div></section>`;
  }

  function renderHome(mount) {
    const h = data.home;
    const areaCards = (data.homeCards && data.homeCards.length ? data.homeCards : [
      {icon:"S", iconImage:"", title:"Sobre o Hospital", description:"Conheça o propósito, o formato hospital dia, a história, a missão, a visão e os valores.", href:"pages/sobre.html", label:"Conhecer"},
      {icon:"C", iconImage:"", title:"Corpo Clínico", description:"Veja profissionais, especialidades, CRM, RQE e informações do corpo clínico.", href:"pages/corpo-clinico.html", label:"Ver profissionais"},
      {icon:"E", iconImage:"", title:"Especialidades", description:"Lista objetiva das especialidades médicas atendidas pelo hospital.", href:"pages/especialidades.html", label:"Ver especialidades"},
      {icon:"X", iconImage:"", title:"Exames", description:"Ultrassonografias, ECG, ecocardiograma, MAPA, Holter e outros exames.", href:"pages/exames.html", label:"Ver exames"},
      {icon:"O", iconImage:"", title:"Núcleo de Oftalmologia", description:"Serviço especializado para saúde ocular, exames, lentes, cirurgias e equipamentos.", href:"pages/nucleo-oftalmologia.html", label:"Acessar núcleo"},
      {icon:"+", iconImage:"", title:"Convênios e contato", description:"Confira os planos atendidos e acesse rapidamente os canais de agendamento.", href:"pages/convenios.html", label:"Ver convênios"}
    ]);
    mount.innerHTML = `
      <section class="hero"><div class="container hero-grid">
        <div class="hero-content reveal">
          ${data.site.showLaunchBadge ? `<div class="launch-pill"><strong>${esc(data.site.launchTitle || "")}</strong><span>${esc(data.site.domain || "")}</span></div>` : ""}
          <span class="kicker">${esc(h.heroKicker)}</span><h1>${esc(h.heroTitle)}</h1><p class="lead" style="margin-top:22px;">${esc(h.heroLead)}</p>
          <div class="hero-actions"><a class="btn btn-primary" href="${getWhatsappUrl()}" target="_blank" rel="noopener">Agendar pelo WhatsApp</a><a class="btn btn-outline" href="pages/especialidades.html">Ver especialidades</a></div>
          <div class="hero-note">${(h.badges || []).map(b => `<span>${esc(b)}</span>`).join("")}</div>${socialHTML("hero")}
        </div>
        <div class="hero-photo-card reveal">${image(h.heroImage, h.heroImageTitle)}<div class="hero-photo-overlay"><h3>${esc(h.heroImageTitle)}</h3><p>${esc(h.heroImageText)}</p></div></div>
      </div></section>
      <section class="section compact"><div class="container stats-grid reveal">${(h.stats || []).map(s => `<div class="stat-card"><strong>${esc(s.number)}</strong><span>${esc(s.label)}</span></div>`).join("")}</div></section>
      <section class="section"><div class="container"><div class="center reveal" style="max-width:760px;margin-bottom:36px;"><span class="kicker">Áreas do site</span><h2>${esc(h.sectionTitle)}</h2><p class="lead" style="margin-top:16px;">${esc(h.sectionText)}</p></div><div class="grid-3 reveal">${areaCards.map(c => `<article class="card">${cardIconHTML(c.icon, c.iconImage, c.title)}<h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><a class="card-link" href="${esc(c.href)}">${esc(c.label || "Acessar")}</a></article>`).join("")}</div></div></section>
      <section class="section" style="background:var(--surface-2);"><div class="container split"><div class="reveal"><span class="kicker">Modelo hospital dia</span><h2>${esc(h.modelTitle)}</h2><p class="lead" style="margin-top:16px;">${esc(h.modelText)}</p><ul class="check-list">${(h.modelBullets || []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></div><div class="panel reveal"><h3>Missão</h3><p style="margin-top:12px;">${esc(data.about.mission)}</p><h3 style="margin-top:24px;">Visão</h3><p style="margin-top:12px;">${esc(data.about.vision)}</p><h3 style="margin-top:24px;">Valores</h3><p style="margin-top:12px;">${esc(data.about.values)}</p></div></div></section>
      <section class="section compact"><div class="container cta-band reveal"><div><h2>${esc(h.ctaTitle)}</h2><p>${esc(h.ctaText)}</p></div><a class="btn btn-secondary" href="${getWhatsappUrl()}" target="_blank" rel="noopener">Agendar agora</a></div></section>`;
  }

  function renderAbout(mount) {
    const a = data.about;
    mount.innerHTML = pageHero(a.title, a.subtitle, "Institucional") + `
      <section class="section"><div class="container split"><div class="reveal"><span class="kicker">Quem somos</span><h2>${esc(a.whoTitle)}</h2>${nl2p(a.paragraphs)}</div><div class="visual-photo-card reveal">${image(a.image, a.title)}<div class="hero-photo-overlay"><h3>Cuidado planejado</h3><p>Consultas, exames, tratamentos e cirurgias em um único fluxo de atendimento.</p></div></div></div></section>
      <section class="section" style="background:var(--surface-2);"><div class="container"><div class="reveal" style="margin-bottom:36px;"><span class="kicker">Nossa história</span><h2>A revolução da saúde em Bocaiúva.</h2></div><div class="timeline reveal">${(a.timeline || []).map(item => `<article class="timeline-item"><div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div></article>`).join("")}</div></div></section>
      <section class="section"><div class="container grid-3 reveal"><article class="info-card"><h3>Missão</h3><p>${esc(a.mission)}</p></article><article class="info-card"><h3>Visão</h3><p>${esc(a.vision)}</p></article><article class="info-card"><h3>Valores</h3><p>${esc(a.values)}</p></article></div></section>`;
  }

  function doctorCard(d) {
    const initials = d.name ? d.name.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("") : "Dr";
    const photo = d.photo ? `<div class="doctor-photo-wrap">${image(d.photo, d.name)}</div>` : `<div class="avatar-placeholder">${esc(initials)}</div>`;
    const tags = String(d.tags || d.specialty || "").split(",").map(t => t.trim()).filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join("");
    return `<article class="doctor-card" data-search="${esc(`${d.name} ${d.specialty} ${d.crm} ${d.rqe}`.toLowerCase())}">${photo}<div class="doctor-content"><h3>${esc(d.name)}</h3><p><strong>${esc(d.specialty)}</strong></p><p style="margin-top:8px;">${esc([d.crm, d.rqe].filter(Boolean).join(" · "))}</p><p style="margin-top:12px;">${esc(d.description)}</p><div class="doctor-meta">${tags}</div></div></article>`;
  }

  function renderDoctors(mount) {
    mount.innerHTML = pageHero("Corpo Clínico", "Conheça os profissionais que integram o atendimento do Gama Hospital Dia.", "Equipe") + `
      <section class="section"><div class="container"><div class="filter-bar"><input class="search-input" placeholder="Buscar médico ou especialidade..." data-search-cards></div><div class="grid-3 reveal" data-card-list>${(data.doctors || []).map(doctorCard).join("")}</div></div></section>`;
  }

  function serviceCard(item) {
    return `<article class="card service-card">${item.image ? `<div class="service-image-wrap">${image(item.image, item.title)}</div>` : cardIconHTML(item.icon || item.title?.[0] || "+", item.iconImage || "", item.title)}<div class="service-content"><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div></article>`;
  }

  function renderSpecialties(mount) {
    mount.innerHTML = pageHero("Especialidades", "Especialidades médicas disponíveis para atendimento no Gama Hospital Dia.", "Atendimento") + `
      <section class="section"><div class="container grid-3 reveal">${(data.specialties || []).map(s => `<article class="card">${cardIconHTML(s.icon || s.title?.[0] || "+", s.iconImage || "", s.title)}<h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></article>`).join("")}</div></section>
      <section class="section compact"><div class="container cta-band reveal"><div><h2>Encontre a especialidade certa.</h2><p>Agende pelo WhatsApp ou entre em contato diretamente com o hospital.</p></div><a class="btn btn-secondary" href="${getWhatsappUrl()}" target="_blank" rel="noopener">Agendar consulta</a></div></section>`;
  }

  function renderExams(mount) {
    mount.innerHTML = pageHero("Exames", "Exames e procedimentos realizados com foco em segurança, diagnóstico e praticidade.", "Diagnóstico") + `<section class="section"><div class="container grid-3 reveal">${(data.exams || []).map(serviceCard).join("")}</div></section>`;
  }

  function renderOphthalmology(mount) {
    const o = data.ophthalmology;
    mount.innerHTML = pageHero(o.title, o.subtitle, "Oftalmologia") + `<section class="section"><div class="container split"><div class="reveal"><span class="kicker">Cuidado ocular</span><h2>${esc(o.title)}</h2><p class="lead" style="margin-top:16px;">${esc(o.subtitle)}</p><div class="hero-actions"><a class="btn btn-primary" href="${getWhatsappUrl()}" target="_blank" rel="noopener">Agendar pelo WhatsApp</a></div></div><div class="visual-photo-card reveal">${image(o.image, o.title)}<div class="hero-photo-overlay"><h3>Sua visão é prioridade</h3><p>Agende uma consulta e cuide dos seus olhos com acompanhamento especializado.</p></div></div></div></section><section class="section" style="background:var(--surface-2);"><div class="container grid-3 reveal">${(o.services || []).map(serviceCard).join("")}</div></section>`;
  }

  function renderConvenios(mount) {
    mount.innerHTML = pageHero("Convênios", "Confira alguns convênios e formas de atendimento. Confirme a cobertura pelo WhatsApp antes de agendar.", "Planos") + `<section class="section"><div class="container insurance-grid reveal">${(data.convenios || []).map(c => `<div class="insurance-card">${esc(c.name)}</div>`).join("")}</div></section><section class="section compact"><div class="container cta-band reveal"><div><h2>Confirme seu convênio</h2><p>Entre em contato e confirme disponibilidade, cobertura e horários.</p></div><a class="btn btn-secondary" href="${getWhatsappUrl()}" target="_blank" rel="noopener">Falar no WhatsApp</a></div></section>`;
  }

  function renderGallery(mount) {
    mount.innerHTML = pageHero("Galeria", "Fotos institucionais, estrutura e registros do Gama Hospital Dia.", "Imagens") + `<section class="section"><div class="container grid-3 reveal">${(data.gallery || []).map(g => `<article class="gallery-card">${g.image ? image(g.image, g.title) : `<div class="avatar-placeholder">Galeria</div>`}<div class="gallery-caption"><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p></div></article>`).join("")}</div></section>`;
  }

  function renderEvents(mount) {
    mount.innerHTML = pageHero("Eventos", "Espaço para divulgar eventos, campanhas, ações de saúde e novidades do hospital.", "Eventos") + `<section class="section"><div class="container grid-3 reveal">${(data.events || []).map(e => `<article class="event-card">${e.image ? image(e.image, e.title) : `<div class="avatar-placeholder">Evento</div>`}<div class="event-body"><div class="event-date">${esc(e.date)}</div><h3>${esc(e.title)}</h3><p style="margin-top:12px;">${esc(e.description)}</p></div></article>`).join("")}</div></section>`;
  }

  function renderContact(mount) {
    mount.innerHTML = pageHero("Contato", "Entre em contato para informações sobre consultas, exames, cirurgias e agendamento.", "Contato") + `<section class="section"><div class="container contact-grid"><div class="contact-list reveal"><div class="contact-item"><div class="contact-icon">T</div><div><strong>Telefone</strong><p>${esc(data.site.phone)}</p></div></div><div class="contact-item"><div class="contact-icon">W</div><div><strong>Agendamento pelo WhatsApp</strong><p><a class="card-link" href="${getWhatsappUrl()}" target="_blank" rel="noopener">Abrir WhatsApp</a></p></div></div><div class="contact-item"><div class="contact-icon">L</div><div><strong>Endereço</strong><p>${esc(data.site.address)}</p></div></div><div class="contact-item"><div class="contact-icon">R</div><div><strong>Redes sociais</strong>${socialHTML("contact-page") || "<p>Configure Instagram e Facebook na área administrativa.</p>"}</div></div><div class="map-shell"><div class="map-embed"><iframe src="${esc(data.site.googleMapsEmbed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Mapa do Gama Hospital Dia"></iframe><a class="map-link-cover" href="${esc(data.site.googleMapsUrl)}" target="_blank" rel="noopener" aria-label="Abrir localização no Google Maps"></a></div><a class="btn btn-outline" style="margin-top:14px;" href="${esc(data.site.googleMapsUrl)}" target="_blank" rel="noopener">Como chegar pelo Google Maps</a></div></div><form class="contact-form reveal" data-contact-form><h2>Enviar mensagem</h2><p style="margin-top:10px;">O formulário abre uma mensagem no WhatsApp configurado na área administrativa.</p><div class="form-grid" style="margin-top:24px;"><div class="form-field"><label for="nome">Nome</label><input class="form-control" id="nome" name="nome" required></div><div class="form-field"><label for="telefone">Telefone</label><input class="form-control" id="telefone" name="telefone" required></div><div class="form-field full"><label for="assunto">Assunto</label><input class="form-control" id="assunto" name="assunto" placeholder="Consulta, exame, cirurgia, convênio..."></div><div class="form-field full"><label for="mensagem">Mensagem</label><textarea class="form-control" id="mensagem" name="mensagem"></textarea></div></div><button class="btn btn-primary" style="margin-top:20px;" type="submit">Enviar pelo WhatsApp</button></form></div></section>`;
  }


  async function loadRemoteData() {
    try {
      const res = await fetch('/.netlify/functions/public-data', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.data) {
        data = mergeDeep(clone(window.DEFAULT_CMS_DATA), json.data);
      }
    } catch (err) {
      console.warn('Usando dados locais porque o banco ainda não respondeu.', err);
    }
  }

  function getVisitorId() {
    try {
      const key = "gamaVisitorId";
      let id = localStorage.getItem(key);
      if (!id) {
        id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(key, id);
      }
      return id;
    } catch(e) {
      return "";
    }
  }

  function trackEvent(type, details = {}) {
    try {
      const payload = {
        type,
        page: currentPage,
        path: location.pathname,
        referrer: document.referrer || '',
        device: window.innerWidth < 760 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop'),
        details: {
          ...details,
          visitorId: getVisitorId(),
          lang: navigator.language || '',
          screen: `${screen.width || 0}x${screen.height || 0}`,
          title: document.title || ''
        }
      };
      navigator.sendBeacon?.('/.netlify/functions/track', new Blob([JSON.stringify(payload)], { type: 'application/json' })) ||
        fetch('/.netlify/functions/track', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), keepalive:true }).catch(()=>{});
    } catch(e) {}
  }

  function initAnalyticsClicks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (href.includes('wa.me')) trackEvent('click_whatsapp', { href });
      else if (href.includes('instagram.com')) trackEvent('click_instagram', { href });
      else if (href.includes('facebook.com')) trackEvent('click_facebook', { href });
      else if (href.includes('google.com/maps')) trackEvent('click_maps', { href });
      else trackEvent('click_link', { href, text: link.textContent.trim().slice(0, 80) });
    });
  }

  function renderPage() {
    const mount = document.querySelector("[data-page-content]");
    if (!mount) return;
    const renderers = {
      home: renderHome, sobre: renderAbout, "corpo-clinico": renderDoctors, especialidades: renderSpecialties, exames: renderExams,
      "nucleo-oftalmologia": renderOphthalmology, convenios: renderConvenios, galeria: renderGallery, eventos: renderEvents, contato: renderContact
    };
    (renderers[currentPage] || renderHome)(mount);
  }

  function initMenu() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const nav = document.querySelector("[data-main-nav]");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const msg = encodeURIComponent(["Olá! Vim pelo site do Gama Hospital Dia.", `Nome: ${fd.get("nome") || ""}`, `Telefone: ${fd.get("telefone") || ""}`, `Assunto: ${fd.get("assunto") || ""}`, `Mensagem: ${fd.get("mensagem") || ""}`].join("\n"));
      window.open(`https://wa.me/${data.site.whatsapp}?text=${msg}`, "_blank", "noopener");
    });
  }

  function initSearch() {
    const search = document.querySelector("[data-search-cards]");
    const list = document.querySelector("[data-card-list]");
    if (!search || !list) return;
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      list.querySelectorAll("[data-search]").forEach(card => {
        card.style.display = card.dataset.search.includes(q) ? "" : "none";
      });
    });
  }

  function initScroll() {
    const header = document.querySelector("[data-header]");
    const back = document.querySelector("[data-back-top]");
    const onScroll = () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 8);
      back?.classList.toggle("is-visible", window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive:true });
    back?.addEventListener("click", () => window.scrollTo({ top:0, behavior:"smooth" }));
    onScroll();
  }

  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) return els.forEach(e => e.classList.add("is-visible"));
    const obs = new IntersectionObserver((entries) => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); obs.unobserve(entry.target); }
    }), { threshold:.14 });
    els.forEach(e => obs.observe(e));
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await loadRemoteData();
    setMeta();
    trackEvent('page_view');
    renderHeader();
    renderPage();
    renderFooter();
    initMenu();
    initContactForm();
    initSearch();
    initScroll();
    initReveal();
    initAnalyticsClicks();
    document.querySelectorAll("[data-current-year]").forEach(el => el.textContent = new Date().getFullYear());
  });
})();
