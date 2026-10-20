// Static-site adaptation of the Tear Ticket interaction: reactbits.dev/micro/tear-ticket.
export function replaceBundle(items,bundle,key){
  return [...items.filter(item=>item.kind!=='bundle'),{key,kind:'bundle',bundleId:bundle.id,name:bundle.name+' bundle',detail:bundle.features.join(' · '),price:bundle.price,original:bundle.original}];
}

export function mountTickets(root,onTear,onRemove){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const controllers=[];
  for(const ticket of root.querySelectorAll('[data-ticket]')){
    const stub=ticket.querySelector('.ticket-stub'),svg=ticket.querySelector('.ticket-fibres');
    const restore=ticket.querySelector('.ticket-remove');
    const id=ticket.dataset.ticket;
    let torn=false,drag=null,progress=0,skipClick=false,animation;
    const paths=Array.from({length:19},()=>{const path=document.createElementNS('http://www.w3.org/2000/svg','path');svg.append(path);return path});
    function fibres(amount,dx,dy){
      const width=ticket.clientWidth;
      svg.setAttribute('viewBox',`0 0 ${width} 200`);
      paths.forEach((p,i)=>{const x=10+(width-20)*i/(paths.length-1),breakAt=.3+.65*Math.abs(i/(paths.length-1)-(drag?.across??.5));const live=amount>.015&&amount<breakAt;p.style.opacity=live?'1':'0';p.setAttribute('d',`M ${x} 1 Q ${x+dx*.25} ${Math.max(2,dy*.6)} ${x+dx*.45} ${dy+2}`)});
    }
    function reset(){drag=null;progress=0;stub.style.transform='';stub.style.opacity='';ticket.classList.remove('ticket-dragging');fibres(0,0,0)}
    function setTorn(value){torn=value;animation?.cancel();reset();ticket.classList.toggle('ticket-torn',value);stub.disabled=value;stub.setAttribute('aria-hidden',String(value));restore.hidden=!value;ticket.querySelector('.ticket-selected').hidden=!value;}
    function tear(){
      if(torn)return;
      if(!reduced.matches){
        const ghost=stub.cloneNode(true);ghost.removeAttribute('data-bundle');ghost.removeAttribute('id');ghost.disabled=true;ghost.setAttribute('aria-hidden','true');ghost.classList.add('ticket-falling');ghost.style.transform=stub.style.transform;ticket.append(ghost);
        const fall=ghost.animate([{transform:stub.style.transform||'translateY(0) rotate(0deg)',opacity:1},{transform:'translate(18px, 125px) rotate(12deg)',opacity:.8,offset:.55},{transform:'translate(38px, 240px) rotate(24deg)',opacity:0}],{duration:520,easing:'cubic-bezier(.3,0,.8,.45)',fill:'forwards'});fall.finished.then(()=>ghost.remove()).catch(()=>ghost.remove());
      }
      reset();onTear(id);
    }
    stub.addEventListener('pointerdown',e=>{
      if(torn||e.button!==0)return;animation?.cancel();const rect=stub.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,across:(e.clientX-rect.left)/rect.width};progress=0;skipClick=false;stub.setPointerCapture(e.pointerId);ticket.classList.add('ticket-dragging');
    });
    stub.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=Math.max(0,e.clientY-drag.y);progress=Math.min(1,Math.hypot(dx*.45,dy)/78);if(progress>.08)skipClick=true;
      if(!reduced.matches){stub.style.transform=`translate(${dx*.25}px,${dy*.52}px) rotate(${(drag.across-.5)*progress*17+dx*.035}deg)`;fibres(progress,dx,dy*.52)}
    });
    function end(e){
      if(!drag||e.pointerId!==drag.id)return;const commit=e.type==='pointerup'&&progress>=.65;const from=stub.style.transform;drag=null;ticket.classList.remove('ticket-dragging');if(commit){skipClick=true;tear()}else{reset();if(from&&!reduced.matches)animation=stub.animate([{transform:from},{transform:'translate(0,0) rotate(0deg)'}],{duration:360,easing:'cubic-bezier(.18,.9,.25,1.2)'})}
    }
    stub.addEventListener('pointerup',end);stub.addEventListener('pointercancel',end);stub.addEventListener('lostpointercapture',end);
    stub.addEventListener('click',e=>{e.preventDefault();if(skipClick){skipClick=false;return}tear()});
    restore.addEventListener('click',()=>onRemove(id));
    controllers.push({id,setTorn});setTorn(false);
  }
  return selected=>controllers.forEach(c=>c.setTorn(c.id===selected));
}
