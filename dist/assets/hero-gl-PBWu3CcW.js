import{V as c,W as A,P,O as R,a as p,L as u,H as b,S as m,b as x,M as w,C as D,c as g}from"./three.module-oW_4oTHL.js";import{e as l}from"./index-DeRXCbU3.js";const y=`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`,U=`
  precision highp float;
  uniform sampler2D uPrev;
  uniform vec2 uMouse;
  uniform vec2 uVelocity;
  uniform float uAspect;
  uniform float uFalloff;
  uniform float uDissipation;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(uPrev, vUv) * uDissipation;
    vec2 cursor = vUv - uMouse;
    cursor.x *= uAspect;
    vec3 stamp = vec3(uVelocity, 1.0 - pow(1.0 - min(1.0, length(uVelocity)), 3.0));
    float falloff = smoothstep(uFalloff, 0.0, length(cursor));
    color.rgb = mix(color.rgb, stamp, vec3(falloff));
    gl_FragColor = vec4(color.rgb, 1.0);
  }
`,L=`
  precision highp float;
  uniform sampler2D uText;
  uniform sampler2D uFlow;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uStrength;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vec3 flow = texture2D(uFlow, vUv).rgb;
    vec2 disp = flow.xy * uStrength;
    vec2 uv = vUv - disp;
    // a hint of dispersion, only where the flow is strong
    float spread = length(disp) * 0.35;
    float a  = texture2D(uText, uv).a;
    float aR = texture2D(uText, uv + vec2(spread, 0.0)).a;
    float aB = texture2D(uText, uv - vec2(spread, 0.0)).a;
    float glow = smoothstep(0.05, 0.6, flow.z);
    vec3 col = uColor;
    col = mix(col, uAccent, glow * 0.55 * (aR - aB + 0.5) * step(0.001, spread));
    float alpha = max(a, max(aR, aB) * glow);
    // fine film grain so the flat type feels printed, not rendered
    float g = (hash(vUv * 1000.0 + uTime) - 0.5) * 0.06;
    gl_FragColor = vec4((col + g) * alpha, alpha);
  }
`;class H{constructor(t,s,i){this.canvas=t,this.hero=s,this.words=i,this.running=!1,this.mouse=new c(.5,.5),this.lastMouse=new c(.5,.5),this.velocity=new c,this.lastMove=0,this.idleT=0,this.renderer=new A({canvas:t,alpha:!0,antialias:!1,premultipliedAlpha:!0,powerPreference:"high-performance"}),this.renderer.setClearColor(0,0),this.renderer.setPixelRatio(l.dpr);const e=new P(2,2);this.camera=new R(-1,1,1,-1,0,1);const o=l.lite?96:160,n={type:b,depthBuffer:!1,minFilter:u,magFilter:u};this.flowA=new p(o,o,n),this.flowB=new p(o,o,n),this.flowMat=new m({vertexShader:y,fragmentShader:U,uniforms:{uPrev:{value:this.flowA.texture},uMouse:{value:this.mouse},uVelocity:{value:this.velocity},uAspect:{value:1},uFalloff:{value:.22},uDissipation:{value:.955}}}),this.flowScene=new x,this.flowScene.add(new w(e,this.flowMat)),this.textCanvas=document.createElement("canvas"),this.textTex=new D(this.textCanvas),this.textTex.minFilter=u,this.textTex.generateMipmaps=!1,this.textMat=new m({vertexShader:y,fragmentShader:L,transparent:!0,uniforms:{uText:{value:this.textTex},uFlow:{value:this.flowB.texture},uColor:{value:new g("#edebe5")},uAccent:{value:new g("#ff4f2b")},uStrength:{value:.045},uTime:{value:0}}}),this.scene=new x,this.scene.add(new w(e,this.textMat)),this.onPointer=this.onPointer.bind(this),window.addEventListener("pointermove",this.onPointer,{passive:!0}),this.resize()}drawText(){const t=this.hero.getBoundingClientRect(),s=l.dpr,i=this.textCanvas;i.width=Math.round(t.width*s),i.height=Math.round(t.height*s);const e=i.getContext("2d");e.clearRect(0,0,i.width,i.height),e.fillStyle="#fff",e.textBaseline="alphabetic";for(const o of this.words){const n=getComputedStyle(o),h=parseFloat(n.fontSize)*s;e.font=`800 expanded ${h}px ${n.fontFamily}`,"fontStretch"in e&&(e.fontStretch="expanded"),"letterSpacing"in e&&(e.letterSpacing=n.letterSpacing==="normal"?"0px":`${parseFloat(n.letterSpacing)*s}px`);const f=o.textContent.toUpperCase(),r=o.getBoundingClientRect(),a=e.measureText(f),T=r.width*s,v=a.width>0?T/a.width:1,M=(r.left-t.left)*s,S=(r.top-t.top)*s,d=a.fontBoundingBoxAscent??h*.9,C=a.fontBoundingBoxDescent??h*.25,B=d+C,F=S+(r.height*s-B)/2+d;e.save(),e.translate(M,F),e.scale(Math.abs(v-1)<.15?v:1,1),e.fillText(f,0,0),e.restore()}this.textTex.needsUpdate=!0}resize(){const t=this.hero.getBoundingClientRect();this.renderer.setPixelRatio(l.dpr),this.renderer.setSize(t.width,t.height,!1),this.flowMat.uniforms.uAspect.value=t.width/t.height,this.drawText()}onPointer(t){if(!this.running)return;const s=this.canvas.getBoundingClientRect(),i=(t.clientX-s.left)/s.width,e=1-(t.clientY-s.top)/s.height;i<0||i>1||e<0||e>1||(this.mouse.set(i,e),this.lastMove=performance.now(),this.onMove?.(i,1-e))}start(){this.running||(this.running=!0,this.renderer.setAnimationLoop(t=>this.tick(t)))}stop(){this.running=!1,this.renderer.setAnimationLoop(null)}tick(t){const s=t/1e3;t-this.lastMove>2800&&(this.idleT+=.0045,this.mouse.set(.5+Math.sin(this.idleT*1.3)*.42,.18+Math.sin(this.idleT*2.1)*.1));const i=(this.mouse.x-this.lastMouse.x)*9,e=(this.mouse.y-this.lastMouse.y)*9;this.velocity.x+=(i-this.velocity.x)*.25,this.velocity.y+=(e-this.velocity.y)*.25,this.lastMouse.copy(this.mouse),this.flowMat.uniforms.uPrev.value=this.flowA.texture,this.renderer.setRenderTarget(this.flowB),this.renderer.render(this.flowScene,this.camera),this.renderer.setRenderTarget(null),[this.flowA,this.flowB]=[this.flowB,this.flowA],this.textMat.uniforms.uFlow.value=this.flowA.texture,this.textMat.uniforms.uTime.value=s,this.renderer.render(this.scene,this.camera)}dispose(){this.stop(),window.removeEventListener("pointermove",this.onPointer),this.flowA.dispose(),this.flowB.dispose(),this.textTex.dispose(),this.renderer.dispose()}}export{H as HeroGL};
