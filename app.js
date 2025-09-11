(function(){
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // Theme toggle (persist)
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  $('#themeToggle').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  $('#themeToggle').addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', current);
    localStorage.setItem('theme', current);
    $('#themeToggle').textContent = current === 'dark' ? '🌙' : '☀️';
  });

  // Mobile nav
  $('#hamburger').addEventListener('click', () => {
    const nav = $('#nav');
    const open = nav.classList.toggle('open');
    $('#hamburger').setAttribute('aria-expanded', open);
  });

  // Smooth scroll
  $$('#nav a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'});
    $('#nav').classList.remove('open');
  }));

  // Universal slider controls
  $$('.slider').forEach(slider => {
    const track = slider.querySelector('.slides');
    const prev = slider.querySelector('[data-prev]');
    const next = slider.querySelector('[data-next]');
    prev && prev.addEventListener('click', () => track.scrollBy({left: -track.clientWidth * 0.9, behavior:'smooth'}));
    next && next.addEventListener('click', () => track.scrollBy({left: track.clientWidth * 0.9, behavior:'smooth'}));
  });

  // Countdown helper
  function startCountdown(targetISO){
    const el = $('#countdown');
    function tick(){
      const diff = new Date(targetISO) - new Date();
      if(diff <= 0){ el.textContent = 'Offer ended'; return; }
      const d = Math.floor(diff/86400000);
      const h = Math.floor(diff%86400000/3600000);
      const m = Math.floor(diff%3600000/60000);
      const s = Math.floor(diff%60000/1000);
      el.textContent = `${d}d ${h}h ${m}m ${s}s`;
      requestAnimationFrame(()=>setTimeout(tick, 1000));
    }
    el.hidden = false; tick();
  }

  // Before/after compare
  function mountCompare(container, before, after){
    const wrap = document.createElement('div');
    wrap.className = 'compare shadow';
    wrap.innerHTML = `
      <img src="${before}" alt="Before" />
      <div class="after"><img src="${after}" alt="After" /></div>
      <div class="handle" style="left:50%"></div>
    `;
    const afterEl = wrap.querySelector('.after');
    const handle = wrap.querySelector('.handle');
    function setX(px){
      const rect = wrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(px - rect.left, rect.width));
      const pct = x/rect.width*100;
      afterEl.style.clipPath = `inset(0 ${100-pct}% 0 0)`;
      handle.style.left = pct + '%';
    }
    function onMove(e){ setX((e.touches?e.touches[0].clientX:e.clientX)); }
    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('touchmove', onMove);
    container.appendChild(wrap);
  }

  // Simple Markdown-safe set (fallback)
  function setText(el, text){ el.textContent = text || ''; }
  function setHTML(el, html){ el.innerHTML = html || ''; }

  // -------------------------------
  // Content loader (tries JSON first, then MD fallback)
  // -------------------------------
  function loadContent(){
    return fetch('data/content.json')
      .then(r => {
        if (!r.ok) throw new Error('No JSON file');
        return r.json();
      })
      .catch(() => {
        return fetch('content.md')
          .then(r => r.text())
          .then(md => {
            const jsonMatch = md.match(/```json([\s\S]*?)```/);
            if(!jsonMatch) throw new Error('No JSON block found in content.md');
            return JSON.parse(jsonMatch[1]);
          });
      });
  }

  loadContent().then(data => {
    // ==================
    // Your rendering logic (unchanged)
    // ==================

    // Meta
    document.title = data.meta?.title || 'Gym Website';
    const metaDesc = document.getElementById('meta-description');
    if(metaDesc) metaDesc.setAttribute('content', data.meta?.description || 'Premium gym website');
    setText($('#site-logo'), data.meta?.brand || '[Gym Name]');
    $('#year').textContent = new Date().getFullYear();
    setText($('#footer-copy'), `© ${new Date().getFullYear()} ${data.meta?.brand || '[Gym Name]'} · All rights reserved.`);

    // Hero
    setText($('#hero-headline'), data.hero?.headline);
    setText($('#hero-subtext'), data.hero?.subtext);
    const c1 = $('#hero-cta1'); if(c1){ c1.textContent = data.hero?.cta1?.label || 'Start Free Trial'; c1.href = data.hero?.cta1?.href || '#pricing'; }
    const c2 = $('#hero-cta2'); if(c2){ c2.textContent = data.hero?.cta2?.label || 'Book a Session'; c2.href = data.hero?.cta2?.href || '#contact'; }
    const nmCta = $('#nav-cta'); if(nmCta){ nmCta.textContent = data.hero?.cta1?.label || 'Start Free Trial'; nmCta.href = data.hero?.cta1?.href || '#pricing'; }

    const hm = $('#hero-media');
    if(data.hero?.video){
      hm.innerHTML = `<video src="${data.hero.video}" autoplay muted playsinline loop></video>`;
    } else if(data.hero?.image){
      hm.innerHTML = `<img src="${data.hero.image}" alt="Hero image" />`;
    }

    // About
    setText($('#about-text'), data.about?.text);
    const aboutStats = $('#about-stats');
    (data.about?.stats || []).forEach(s => { const li=document.createElement('li'); li.textContent=s; aboutStats.appendChild(li); });
    const aboutImg = $('#about-image'); if(aboutImg && data.about?.image){ aboutImg.src = data.about.image; }

    // USPs
    const uspWrap = $('#usp-cards');
    (data.usps || []).forEach(u => {
      const card = document.createElement('div');
      card.innerHTML = `<h3>${u.title}</h3><p>${u.text}</p>`;
      uspWrap.appendChild(card);
    });

    // Facilities (slider)
    const facWrap = $('#facility-slides');
    (data.facilities || []).forEach(f => {
      const slide = document.createElement('div');
      slide.className = 'card rounded shadow';
      slide.innerHTML = `<img class="rounded" src="${f.image}" alt="${f.title}" style="width:100%;height:260px;object-fit:cover;"/>
                         <div style="padding:12px"><strong>${f.title}</strong><p style="margin:6px 0 0;color:var(--muted)">${f.text||''}</p></div>`;
      facWrap.appendChild(slide);
    });

    // Services
    const svcWrap = $('#service-cards');
    (data.services || []).forEach(s => {
      const card = document.createElement('div');
      card.innerHTML = `<h3>${s.title}</h3><p>${s.text||''}</p>`;
      svcWrap.appendChild(card);
    });

    // Transformations
    const trWrap = $('#transform-list');
    (data.transformations || []).forEach(t => {
      const holder = document.createElement('div');
      holder.innerHTML = `<h4 style="margin:0 0 10px">${t.name||''}</h4>`;
      mountCompare(holder, t.before, t.after);
      trWrap.appendChild(holder);
    });

    // Trainers
    const trainerWrap = $('#trainer-cards');
    (data.trainers || []).forEach(t => {
      const card = document.createElement('div');
      card.innerHTML = `
        <img src="${t.image}" alt="${t.name}" style="width:100%;height:220px;object-fit:cover;border-radius:14px"/>
        <h3 style="margin:10px 0 4px">${t.name}</h3>
        <p style="margin:0;color:var(--muted)">${t.role}</p>
        <p style="margin:8px 0 0">${t.bio||''}</p>
      `;
      trainerWrap.appendChild(card);
    });

    // Schedule (tabs)
    const tabsWrap = $('#schedule-tabs');
    const contentWrap = $('#schedule-content');
    const schedules = data.schedule || {};
    const keys = Object.keys(schedules);
    function renderSchedule(key){
      $$('#schedule-tabs button').forEach(b=>b.classList.remove('active'));
      const btn = $(`#schedule-tabs button[data-key="${key}"]`); if(btn) btn.classList.add('active');
      const items = schedules[key] || [];
      contentWrap.innerHTML = `<div class="grid two cards">${items.map(i=>`
        <div><strong>${i.time}</strong><p style="margin:6px 0 0;color:var(--muted)">${i.class}</p></div>
      `).join('')}</div>`;
    }
    keys.forEach((k,i)=>{
      const b = document.createElement('button'); b.textContent = k; b.dataset.key=k; if(i===0) b.classList.add('active');
      b.addEventListener('click', ()=>renderSchedule(k)); tabsWrap.appendChild(b);
    });
    if(keys[0]) renderSchedule(keys[0]);

    // Testimonials slider
    const tstWrap = $('#testimonial-slides');
    (data.testimonials || []).forEach(t => {
      const slide = document.createElement('div');
      slide.className = 'card rounded shadow';
      slide.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center;padding:12px">
          <img src="${t.image}" alt="${t.name}" style="width:54px;height:54px;border-radius:50%;object-fit:cover"/>
          <div>
            <strong>${t.name}</strong>
            <div>${'★'.repeat(t.stars||5)}</div>
          </div>
        </div>
        <p style="padding:0 12px 12px;color:var(--muted)">“${t.quote}”</p>
      `;
      tstWrap.appendChild(slide);
    });

    // Pricing
    const priceWrap = $('#pricing-cards');
    (data.pricing || []).forEach(p => {
      const card = document.createElement('div');
      card.innerHTML = `
        <h3>${p.title}</h3>
        <div style="font-size:28px;font-weight:800;margin:6px 0">₹${p.price}/month</div>
        <ul class="checklist">${(p.features||[]).map(f=>`<li>${f}</li>`).join('')}</ul>
        <a class="btn cta-outline" href="${p.cta?.href||'#contact'}">${p.cta?.label||'Choose Plan'}</a>
      `;
      if(p.popular){ card.style.borderColor = 'var(--accent)'; card.style.boxShadow = '0 10px 30px rgba(229,9,20,0.25)'; }
      priceWrap.appendChild(card);
    });

    // Offers
    setText($('#offer-text'), data.offers?.text || 'Join Now & Get 20% OFF Your First 3 Months!');
    const offerCta = $('#offer-cta'); if(offerCta){ offerCta.textContent = data.offers?.cta?.label || 'Claim Offer'; offerCta.href = data.offers?.cta?.href || '#contact'; }
    if(data.offers?.deadline){ startCountdown(data.offers.deadline); }

    // Benefits
    const benWrap = $('#benefit-list');
    (data.benefits || []).forEach(b => { const li=document.createElement('li'); li.textContent=b; benWrap.appendChild(li); });

    // Blog
    const blogWrap = $('#blog-cards');
    (data.blog || []).forEach(b => {
      const card = document.createElement('div');
      card.innerHTML = `
        <img src="${b.image}" alt="${b.title}" style="width:100%;height:180px;object-fit:cover;border-radius:12px"/>
        <h3 style="margin:10px 0 6px">${b.title}</h3>
        <p style="color:var(--muted)">${b.excerpt||''}</p>
        <a class="btn cta-small cta-outline" href="${b.href||'#'}">Read More</a>
      `;
      blogWrap.appendChild(card);
    });

    // FAQ
    const faqWrap = $('#faq-list');
    (data.faq || []).forEach(q => {
      const item = document.createElement('div');
      item.className='item';
      item.innerHTML = `<div class="q"><span>${q.q}</span><span>+</span></div><div class="a">${q.a}</div>`;
      item.querySelector('.q').addEventListener('click', ()=> item.classList.toggle('open'));
      faqWrap.appendChild(item);
    });

    // CTA footer
    setText($('#cta-headline'), data.cta?.headline);
    setText($('#cta-address'), `📍 Address: ${data.cta?.address||''}`);
    setText($('#cta-phone'), `📞 Phone: ${data.cta?.phone||''}`);
    setText($('#cta-email'), `📧 Email: ${data.cta?.email||''}`);
    const ctaBtn = $('#cta-button'); if(ctaBtn){ ctaBtn.textContent = data.cta?.button?.label || 'Book Your Free Trial'; ctaBtn.href = data.cta?.button?.href || '#'; }

  }).catch(err => {
    console.error(err);
    alert('Error loading site content (check content.md or data/content.json)');
  });

})();
