// Branched navigation inspired by reactbits.dev/micro/branched-menu.
(()=>{
  const menu=document.querySelector('.branched-menu');if(!menu)return;
  const toggle=menu.querySelector('.branch-head'),fold=menu.querySelector('.branch-fold'),links=[...menu.querySelectorAll('.branch-link')];
  const mobile=matchMedia('(max-width:760px)');
  function setOpen(open){menu.toggleAttribute('data-open',open);toggle.setAttribute('aria-expanded',String(open));fold.inert=!open;}
  function trace(){for(const path of menu.querySelectorAll('.branch-reach')){const link=links.find(a=>a.hash==='#'+path.dataset.section);path.toggleAttribute('data-active',!!link?.classList.contains('active'))}}
  toggle.addEventListener('click',()=>setOpen(!menu.hasAttribute('data-open')));
  menu.addEventListener('keydown',e=>{if(e.key==='Escape'){setOpen(false);toggle.focus()}if(e.key==='ArrowDown'&&e.target===toggle){e.preventDefault();setOpen(true);links[0].focus()}});
  links.forEach((a,i)=>{a.addEventListener('click',()=>{if(mobile.matches)setOpen(false)});a.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();links[(i+(e.key==='ArrowDown'?1:links.length-1))%links.length].focus()}})});
  document.addEventListener('pointerdown',e=>{if(mobile.matches&&!menu.contains(e.target))setOpen(false)},{passive:true});
  new MutationObserver(trace).observe(menu,{subtree:true,attributes:true,attributeFilter:['class']});mobile.addEventListener('change',()=>setOpen(!mobile.matches));setOpen(!mobile.matches);trace();
})();
