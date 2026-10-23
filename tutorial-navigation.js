(()=>{
 const links=[...document.querySelectorAll('.tutorial-menu .branch-link')];
 const sections=links.map(a=>document.getElementById(a.hash.slice(1)));
 let queued=false;
 function update(){
  queued=false;let current=sections[0];
  for(const section of sections)if(section.getBoundingClientRect().top<=Math.max(160,innerHeight*.3))current=section;
  if(innerHeight+scrollY>=document.documentElement.scrollHeight-3)current=sections[sections.length-1];
  for(const a of links){const active=a.hash==='#'+current.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
})();
