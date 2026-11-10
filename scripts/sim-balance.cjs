const fs=require('fs'),vm=require('vm');
const root=require('path').join(__dirname,'..','js')+'/';
const ctx={console,Intl,Math,Date,JSON};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['data','util','calendar','characters','economy','sim','midday', 'progress', 'farm','narrative']) vm.runInContext(fs.readFileSync(root+f+'.js','utf8'),ctx,{filename:f});
const KE=ctx.KE;
for (const mode of ['doner','kebap']) for (const dist of ['kadiceşme','kulealti']) {
  const G=KE.newGame({mode,district:dist,master:KE.MASTER_TEMPLATES[mode][0],owner:'T',shopName:'T'});
  const log=[];
  for(let d=0; d<62; d++){
    if(G.pendingEvent) KE.resolveEvent(G,0);
    if(d===30 && G.cash>900000){ const b=KE.openBranch(G,'besiktepe'); const add=(s)=>{s.branchId=b.id;G.staff.push(s)}; add(G.market[0]); add(KE.randomWorker(G,'kasiyer')); add(KE.randomWorker(G,'garson')); add(KE.randomWorker(G,'mudur')); }
    if(d===40 && G.cash>800000){ KE.buyFarm(G); }
    KE.startService(G);
    let g=0; while(!KE.allDone(G) && g++<1500) KE.tickAll(G);
    KE.finishService(G);
    const out=KE.finalizeDay(G);
    for (const [bid,e] of Object.entries(out.branches)) if(d<2||d%15===0||d===61) log.push(`  g${d+1} ${bid}: müş ${e.served}/${e.arrivals} kaçan ${e.lost} ciro ${Math.round(e.revenue)} sat ${Math.round(e.sat)} tip ${Math.round(e.tips)} paket ${e.paket} net ${Math.round(e.net)} | kasa ${Math.round(G.cash)} rep ${G.reputation.toFixed(1)}`);
    if(out.month) log.push(`  AY ${out.month.name}: ciro ${Math.round(out.month.revenue)} net ${Math.round(out.month.net)} pers ${Math.round(out.month.personnel)} farm ${Math.round(out.month.farm)}+${out.month.farmFixed}`);
    if (d===1) { const S=G.ledger.days.slice(-1)[0]; }
  }
  const s0=G.lastSummary.branches[G.branches[0].id].stats;
  console.log(mode,dist,'staff',G.staff.length,'goals',Object.keys(G.goals).join(','),'lost detail',JSON.stringify({w:s0.lostWait,p:s0.lostPrice,f:s0.lostFull,s:s0.lostStock,food:s0.lostFood,cold:s0.cold}), 'energy', G.staff.map(s=>Math.round(s.minEnergy)).join(','), 'farm', G.farm?JSON.stringify(G.farm.store).slice(0,120):'-');
  console.log(log.join('\n'));
}
