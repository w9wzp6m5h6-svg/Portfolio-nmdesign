import{a as r,e as n,b as d}from"./escape-DgOtKD9r.js";import{i as m}from"./concept-DVoNkOUk.js";import{V as s,I as p,m as u}from"./experience-DGHX8EjW.js";import"./preload-helper-PPVm8Dsz.js";const o=document.querySelector("[data-can-root]"),y=document.querySelector('meta[name="theme-color"]'),l=document.querySelector("[data-elan-flavors]");l.innerHTML=s.map((e,t)=>`
  <li class="elan-flavor" data-flavor="${e.id}">
    <div class="elan-flavor__stage">
      <img src="${r(`media/works/elan/elan_can_${e.id}-800.webp`)}" srcset="${r(`media/works/elan/elan_can_${e.id}-800.webp`)} 800w, ${r(`media/works/elan/elan_can_${e.id}-1400.webp`)} 1400w"
        sizes="(max-width: 700px) 46vw, 24vw" width="800" height="1000" alt="Canette ÉLAN ${n(e.name)}" loading="lazy" decoding="async" />
    </div>
    <p class="elan-kicker">${String(t+1).padStart(2,"0")}</p>
    <h3 class="elan-flavor__name">${n(e.name)}</h3>
    <p class="elan-flavor__mood">${n(e.mood)}</p>
    <button type="button" class="elan-link" data-show="${e.id}">Voir en 3D <span aria-hidden="true">↑</span></button>
  </li>`).join("");l.querySelectorAll(".elan-flavor").forEach(e=>{const t=s.find(a=>a.id===e.dataset.flavor);e.style.setProperty("--flavor",t.body)});document.querySelector("[data-elan-ingredients]").innerHTML=p.map(([e,t],a)=>`
  <li class="elan-ingredient" data-c-reveal>
    <span class="elan-ingredient__num">${String(a+1).padStart(2,"0")}</span>
    <h3 class="elan-ingredient__name">${n(e)}</h3>
    <p class="elan-ingredient__text">${n(t)}</p>
  </li>`).join("");const c=e=>{document.body.style.setProperty("--page",e.page),document.body.style.setProperty("--can-body",e.body),document.body.style.setProperty("--can-accent",e.accent),document.body.toggleAttribute("data-dark-cta",!!e.dark),y?.setAttribute("content",e.page)},i=(e=!0)=>{o.scrollIntoView({behavior:d.reducedMotion?"auto":"smooth",block:"start"}),e&&setTimeout(()=>o.querySelector('[aria-pressed="true"]')?.focus({preventScroll:!0}),d.reducedMotion?0:650)};u(o,{onVariant:c}).then(e=>{c(s[0]),e.start(),l.addEventListener("click",t=>{const a=t.target.closest("[data-show]");a&&(e.setVariant(a.dataset.show),i(!1))})});o.querySelector("[data-can-canvas]")?.addEventListener("pointerdown",()=>o.classList.add("is-handled"),{once:!0});document.querySelectorAll("[data-pick]").forEach(e=>e.addEventListener("click",t=>{t.preventDefault(),i()}));m();
