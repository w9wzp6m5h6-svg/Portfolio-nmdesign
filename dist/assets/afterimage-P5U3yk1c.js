import{W as p,O as b,P as g,a as c,H as x,V as u,S as v,c as o,b as l,M as d}from"./three.module-oW_4oTHL.js";import{e as w}from"./index-DeRXCbU3.js";const m=[{id:"ember",name:"A — Braise",ramp:["#040303","#7a1f08","#ffc98a"],alt:"#ff5a1f",feedback:.82,bands:0,speed:1},{id:"tide",name:"B — Marée",ramp:["#02040b","#0d2a72","#a9dcff"],alt:"#2b4bff",feedback:.86,bands:0,speed:.8},{id:"ghost",name:"C — Fantôme",ramp:["#000000","#3a3a40","#ecebf2"],alt:"#ecebf2",feedback:.78,bands:1,speed:.6}],f="varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",y=`
  precision highp float;
  uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uPush;
  uniform sampler2D uPrev; uniform float uFeedback; uniform float uBands;
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uAlt;
  varying vec2 vUv;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
    return v;
  }

  void main(){
    float aspect = uRes.x / uRes.y;
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 2.2;
    vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0) * 2.2;
    vec2 dm = p - m;
    float d = length(dm);
    p += dm * exp(-d * d * 3.5) * 0.9 * uPush;   // the cursor pushes the field (smooth, no singularity)

    float t = uTime * 0.06;
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + 3.6 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p + 3.6 * q + vec2(8.3, 2.8) - t));
    float f = fbm(p + 3.8 * r);

    float v = smoothstep(0.2, 1.0, f * f * 1.7 + length(r) * 0.18);
    vec3 body = mix(uC1, uAlt, smoothstep(0.55, 1.1, length(q)) * 0.6);
    vec3 col = mix(mix(uC0, body, smoothstep(0.0, 0.6, v)), uC2, smoothstep(0.62, 1.0, v));
    float light = v;
    if (uBands > 0.5) {
      float b = abs(fract(f * 9.0) - 0.5);
      col = vec3(smoothstep(0.06, 0.0, b)) * (0.35 + light);
    }
    col += uC2 * exp(-d * d * 18.0) * 0.12 * uPush;  // faint glow under the finger

    // feedback: drift the previous frame slightly toward the centre
    vec2 fuv = (vUv - 0.5) * 0.9985 + 0.5 + vec2(0.0, 0.0004);
    vec3 prev = texture2D(uPrev, fuv).rgb;
    col = mix(col, max(col, prev * uFeedback), 0.55);
    col = mix(col, prev, 0.3 * uFeedback);
    gl_FragColor = vec4(col, 1.0);
  }
`,S=`
  precision highp float;
  uniform sampler2D uTex; uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec3 c = texture2D(uTex, vUv).rgb;
    float v = smoothstep(1.25, 0.35, length(vUv - 0.5) * 1.6);
    c *= mix(0.55, 1.0, v);
    c += (hash(vUv * 900.0 + uTime) - 0.5) * 0.035;
    gl_FragColor = vec4(c, 1.0);
  }
`;class M{constructor(t,{scale:e=w.lite?.5:.75}={}){this.canvas=t,this.scale=e,this.renderer=new p({canvas:t,antialias:!1,preserveDrawingBuffer:!1}),this.renderer.setPixelRatio(1),this.camera=new b(-1,1,1,-1,0,1);const s=new g(2,2),i={type:x,depthBuffer:!1};this.a=new c(2,2,i),this.b=new c(2,2,i),this.mouse=new u(.5,.5),this.mouseGoal=new u(.5,.5),this.push=0,this.pushGoal=0,this.field=new v({vertexShader:f,fragmentShader:y,uniforms:{uTime:{value:0},uRes:{value:new u(1,1)},uMouse:{value:this.mouse},uPush:{value:0},uPrev:{value:null},uFeedback:{value:.85},uBands:{value:0},uC0:{value:new o},uC1:{value:new o},uC2:{value:new o},uAlt:{value:new o}}}),this.out=new v({vertexShader:f,fragmentShader:S,uniforms:{uTex:{value:null},uTime:{value:0}}}),this.fieldScene=new l,this.fieldScene.add(new d(s,this.field)),this.outScene=new l,this.outScene.add(new d(s,this.out)),this.time=0,this.speed=1,this.setStudy(0),this.onMove=r=>{const a=t.getBoundingClientRect();this.mouseGoal.set((r.clientX-a.left)/a.width,1-(r.clientY-a.top)/a.height),this.pushGoal=1},this.onLeave=()=>{this.pushGoal=0},t.addEventListener("pointermove",this.onMove,{passive:!0}),t.addEventListener("pointerdown",this.onMove,{passive:!0}),t.addEventListener("pointerleave",this.onLeave),t.addEventListener("pointercancel",this.onLeave),this.resize()}setStudy(t){const e=m[t],s=this.field.uniforms;[s.uC0,s.uC1,s.uC2].forEach((i,r)=>i.value.set(e.ramp[r])),s.uAlt.value.set(e.alt),s.uFeedback.value=e.feedback,s.uBands.value=e.bands,this.speed=e.speed}resize(){const t=Math.max(2,this.canvas.clientWidth),e=Math.max(2,this.canvas.clientHeight);this.renderer.setSize(t,e,!1);const s=Math.round(t*this.scale),i=Math.round(e*this.scale);this.a.setSize(s,i),this.b.setSize(s,i),this.field.uniforms.uRes.value.set(s,i)}frame(t){this.time+=t*this.speed,this.mouse.lerp(this.mouseGoal,.08),this.push+=(this.pushGoal-this.push)*.05,this.pushGoal===0&&this.mouseGoal.set(.5+Math.sin(this.time*.21)*.3,.5+Math.cos(this.time*.17)*.22);const e=this.field.uniforms;e.uTime.value=this.time,e.uPush.value=Math.max(this.push,.35),e.uPrev.value=this.a.texture,this.renderer.setRenderTarget(this.b),this.renderer.render(this.fieldScene,this.camera),this.renderer.setRenderTarget(null),[this.a,this.b]=[this.b,this.a],this.out.uniforms.uTex.value=this.a.texture,this.out.uniforms.uTime.value=this.time,this.renderer.render(this.outScene,this.camera)}start(){if(this.running)return;this.running=!0;let t=performance.now();this.renderer.setAnimationLoop(e=>{this.frame(Math.min((e-t)/1e3,.05)),t=e})}stop(){this.running=!1,this.renderer.setAnimationLoop(null)}destroy(){this.stop(),this.canvas.removeEventListener("pointermove",this.onMove),this.canvas.removeEventListener("pointerdown",this.onMove),this.canvas.removeEventListener("pointerleave",this.onLeave),this.canvas.removeEventListener("pointercancel",this.onLeave),this.a.dispose(),this.b.dispose(),this.field.dispose(),this.out.dispose(),this.renderer.dispose(),this.renderer.forceContextLoss()}}function T(n){const t=n.querySelector("canvas"),e=n.querySelector("[data-live-controls]"),s=new M(t);e.innerHTML=m.map((r,a)=>`<button type="button" class="chip" data-study="${a}" aria-pressed="${a===0}">${r.name}</button>`).join(""),e.addEventListener("click",r=>{const a=r.target.closest("[data-study]");a&&(e.querySelectorAll("[data-study]").forEach(h=>h.setAttribute("aria-pressed",String(h===a))),s.setStudy(+a.dataset.study))});const i=new ResizeObserver(()=>s.resize());return i.observe(t),{start:()=>s.start(),stop:()=>s.stop(),destroy:()=>{i.disconnect(),s.destroy()}}}export{M as Afterimage,m as STUDIES,T as mountAfterimage};
