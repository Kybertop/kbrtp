(()=>{
 const games=document.getElementById('game-count'),hours=document.getElementById('hours-per-game');
 const total=document.getElementById('total-hours'),formula=document.getElementById('hours-formula');
 const format=new Intl.NumberFormat('en-US',{maximumFractionDigits:6});
 function renderBadge(key,value,valid){
  const tiers=window.SPOOFER_BADGE_TIERS[key],item=document.querySelector(`[data-badge="${key}"]`);
  const tier=valid?[...tiers].reverse().find(t=>value>=t.threshold):null;
  const next=valid?tiers.find(t=>t.threshold>value):null;
  const category=key==='time'?'Game Time':'Game Variety',unit=key==='time'?'hours':'distinct games';
  const image=document.getElementById(key+'-badge-image');image.src=(tier||tiers[0]).image;
  image.alt=tier?`${category} badge: ${tier.name}`:`${category} badge, locked`;
  item.classList.toggle('locked',!tier);
  document.getElementById(key+'-badge-name').textContent=tier?tier.name:valid?'Not unlocked':'—';
  document.getElementById(key+'-badge-tier').textContent=tier?`Level ${tiers.indexOf(tier)+1} / ${tiers.length}`:valid?`Starts at ${tiers[0].threshold} ${unit}`:'Enter valid values';
  document.getElementById(key+'-badge-count').textContent=valid?`${format.format(value)} ${unit}`:'Enter valid calculator values';
  document.getElementById(key+'-badge-progress').textContent=valid?(next?`${format.format(next.threshold-value)} ${unit} to ${next.name}`:'Highest catalogued tier'):'Preview unavailable';
  item.querySelector('button').setAttribute('aria-label',`${category}: ${tier?tier.name:valid?'not unlocked':'preview unavailable'}. ${valid?format.format(value)+' '+unit:''}`);
 }
 function update(){
  const g=games.valueAsNumber,h=hours.valueAsNumber;
  const validGames=Number.isSafeInteger(g)&&g>=0,validHours=Number.isFinite(h)&&h>=0;
  games.setAttribute('aria-invalid',String(games.value!==''&&!validGames));hours.setAttribute('aria-invalid',String(hours.value!==''&&!validHours));
  const valid=validGames&&validHours&&Number.isFinite(g*h);
  renderBadge('time',g*h,valid);renderBadge('variety',g,valid);
  if(!valid){total.textContent='—';formula.textContent='Enter a whole number of games and non-negative hours.';return;}
  total.textContent=format.format(g*h);
  formula.textContent=`${format.format(g)} ${g===1?'game':'games'} × ${format.format(h)} ${h===1?'hour':'hours'} per game`;
 }
 games.addEventListener('input',update);hours.addEventListener('input',update);
 document.querySelectorAll('[data-calc-preset]').forEach(button=>button.addEventListener('click',()=>{const [g,h]=button.dataset.calcPreset.split(',');games.value=g;hours.value=h;update();}));update();
})();
(()=>{const toggle=document.querySelector('.scam-popup-toggle'),content=document.getElementById('scam-popup-content');toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));content.hidden=!open;toggle.querySelector('.scam-popup-indicator').textContent=open?'−':'+';});})();
(()=>{
 document.querySelectorAll('.badge-preview-item').forEach(item=>{
  const button=item.querySelector('button');
  function close(){item.classList.remove('tooltip-open');button.setAttribute('aria-expanded','false');}
  button.addEventListener('click',()=>{const open=!item.classList.contains('tooltip-open');document.querySelectorAll('.badge-preview-item').forEach(other=>{other.classList.remove('tooltip-open');other.querySelector('button').setAttribute('aria-expanded','false');});item.classList.toggle('tooltip-open',open);item.classList.toggle('tooltip-suppressed',!open);button.setAttribute('aria-expanded',String(open));});
  item.addEventListener('keydown',event=>{if(event.key==='Escape'){close();item.classList.add('tooltip-suppressed');}});
  item.addEventListener('mouseleave',()=>{item.classList.remove('tooltip-suppressed');close();});button.addEventListener('blur',()=>{item.classList.remove('tooltip-suppressed');close();});
 });
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('.badge-preview-item'))document.querySelectorAll('.badge-preview-item').forEach(item=>{item.classList.remove('tooltip-open');item.querySelector('button').setAttribute('aria-expanded','false');});});
 const toggle=document.querySelector('.update-bubble-toggle'),content=document.getElementById('update-bubble-content');
 toggle.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(expanded));content.hidden=!expanded;toggle.querySelector('.bubble-indicator').textContent=expanded?'−':'+';});
})();
