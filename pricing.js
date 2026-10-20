export const euro = value => new Intl.NumberFormat('en-IE', {style:'currency', currency:'EUR', maximumFractionDigits:2}).format(value).replace('.00','');
export function scale(value, points) {
  for (let i=1;i<points.length;i++) {
    if (value<=points[i][0]) {
      const [x,y]=points[i-1], [nextX,nextY]=points[i];
      return Math.round((y+(value-x)/(nextX-x)*(nextY-y))*100)/100;
    }
  }
  return points.at(-1)[1];
}
export const sliders = [
  {id:'rp',name:'RP level',label:'RP level',min:120,max:8000,step:10,unit:'RP',points:[[120,3],[1000,5],[8000,10]]},
  {id:'crew',name:'Crew level',label:'Crew level',min:120,max:8000,step:10,unit:'crew level',points:[[120,3],[1000,5],[8000,10]]},
  {id:'cars',name:'Cars',label:'Number of cars',min:1,max:40,step:1,unit:'car',points:[[1,3],[5,6],[10,9],[20,14],[40,20]],rate:3},
  {id:'purchases',name:'In-game purchases',label:'Number of in-game purchases',min:1,max:20,step:1,unit:'purchase',points:[[1,3],[2,5],[10,15],[20,24]],rate:3}
];
export const singles=[
  {id:'cash',name:'Money only',detail:'GTA$15,000,000',price:5},
  {id:'unlock',name:'Unlock all',price:6},
  {id:'stats',name:'Max stats',price:3},
  {id:'run',name:'Modded run',price:4},
  {id:'heists',name:'Heists setup',price:5},
  {id:'businesses',name:'All businesses',price:8},
  {id:'hangar',name:'Hangar cargo',detail:'GTA$1B',price:18}
];
export const bundles=[
  {id:'star',name:'Star',symbol:'✦',price:19,original:29,stats:[['Cash','GTA$15M'],['RP','120'],['Crew','120']],features:['Unlock all','Max stats','5 cars','1 purchase']},
  {id:'galaxy',name:'Galaxy',symbol:'◉',price:28,original:47,stats:[['Cash','GTA$15M'],['RP','1,000'],['Crew','1,000']],features:['Unlock all','Max stats','Modded run','10 cars','Heists setup','2 purchases']},
  {id:'milky',name:'Milky Way',symbol:'⌁',price:48,original:74,stats:[['Cash','GTA$15M'],['RP / Crew','8,000'],['Hangar','GTA$1B']],features:['Unlock all','Max stats','All businesses','20 cars','Any crew']}
];
export function sliderQuote(config, value) {
  const price=scale(value,config.points);
  return {price,original:config.rate ? value*config.rate : price};
}
