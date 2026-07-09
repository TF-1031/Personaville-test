
let selectedPersona = null;

function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==="class") node.className=v;
    else if(k==="html") node.innerHTML=v;
    else if(k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k,v);
  });
  [].concat(children).forEach(ch=>{
    if(ch===null || ch===undefined) return;
    node.appendChild(typeof ch==="string" ? document.createTextNode(ch) : ch);
  });
  return node;
}
function renderAll(){
  renderKpis();
  fillFilters();
  renderTiles();
  renderModifiers();
  renderHealth();
  fillExportPicker();
  document.getElementById("dbStatus").textContent = "Database loaded";
  document.getElementById("dbStatus").className = "pill gray";
}
function renderKpis(){
  const kpis = [
    ["Market Personas", DB.personas.length],
    ["Customer Price Variants", DB.speedOptions.length],
    ["Pricing Schedule Rows", DB.schedules.length],
    ["Reusable Modifiers", DB.modifiers.length]
  ];
  const box = document.getElementById("kpis");
  box.innerHTML="";
  kpis.forEach(([label,num]) => box.appendChild(el("div",{class:"kpi"},[
    el("div",{class:"num"},[String(num)]),
    el("div",{class:"label"},[label])
  ])));
}
function fillFilters(){
  const pf = document.getElementById("pricingFilter");
  const ff = document.getElementById("familyFilter");
  const curP=pf.value, curF=ff.value;
  pf.innerHTML='<option value="">All Pricing Sets</option>';
  ff.innerHTML='<option value="">All Family Groups</option>';
  getUnique(DB.personas,"PricingSet").forEach(v=>pf.appendChild(el("option",{value:v},[v])));
  getUnique(DB.personas,"FamilyGroup").forEach(v=>ff.appendChild(el("option",{value:v},[v])));
  pf.value=curP; ff.value=curF;
}
function renderTiles(){
  const query = document.getElementById("globalSearch")?.value || "";
  const family = document.getElementById("familyFilter")?.value || "";
  const pricing = document.getElementById("pricingFilter")?.value || "";
  const personas = searchPersonas(query, family, pricing);
  const d1 = document.getElementById("dashboardTiles");
  const d2 = document.getElementById("personaTiles");
  [d1,d2].forEach(box => {
    if(!box) return;
    box.innerHTML="";
    personas.forEach(p => box.appendChild(personaTile(p)));
  });
}
function personaTile(p){
  const chips=[];
  if(truthy(p.EquipInc)) chips.push(el("span",{class:"chip feature"},["✓ Equip Inc"]));
  if(truthy(p.SymSpeed)) chips.push(el("span",{class:"chip feature"},["✓ Sym Speed"]));
  (p.modifiers||[]).forEach(m => chips.push(el("span",{class:"chip mod"},[m.ModifierName])));
  const rows = (p.speeds||[]).map(s => el("tr",{},[
    el("td",{class:"so"},[s.SpeedOption || ""]),
    el("td",{},[s.DisplaySpeed || ""]),
    el("td",{class:"price"},[firstPriceNode(s)]),
    el("td",{},[money(s.RegularRate)])
  ]));
  return el("article",{class:"tile", onclick:()=>selectPersona(p)},[
    el("div",{class:"tile-head"},[
      el("div",{},[
        el("h3",{},[p.PersonaName || "Untitled"]),
        el("div",{class:"meta"},[`Family Group: ${p.FamilyGroup || "—"} • ${p.PricingSet || ""}`])
      ]),
      el("div",{class:"icon-slot"},["1:1"])
    ]),
    el("div",{class:"chips"},chips.length?chips:[el("span",{class:"chip gray"},["No modifiers"])]),
    el("table",{class:"speed-table"},[
      el("thead",{},[el("tr",{},[el("th",{},["Option"]),el("th",{},["Speed"]),el("th",{},["First Price"]),el("th",{},["Reg. Rate"])])]),
      el("tbody",{},rows)
    ])
  ]);
}
function firstPriceNode(s){
  const free = (s.schedules||[]).find(x => truthy(x.DisplayAsFree));
  if(free) return el("span",{},[
    el("span",{class:"free"},["FREE"]),
    " ",
    el("span",{class:"strike"},[money(free.StrikeThroughPrice || s.FirstPaidPrice)])
  ]);
  return money(s.FirstPaidPrice);
}
function selectPersona(p){
  selectedPersona = p;
  renderDetail(p);
  document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));
  document.querySelector('.nav[data-view="personas"]').classList.add("active");
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById("personas").classList.add("active");
}
function renderDetail(p){
  const panel = document.getElementById("detailPanel");
  panel.className="detail";
  const mods = (p.modifiers||[]).map(m=>m.ModifierName).join(" | ") || "None";
  panel.innerHTML="";
  panel.appendChild(el("h3",{},[p.PersonaName]));
  panel.appendChild(el("div",{class:"meta"},[`Persona ID: ${p.PersonaID} • Family Group: ${p.FamilyGroup}`]));
  const chips = el("div",{class:"chips"},[]);
  if(truthy(p.EquipInc)) chips.appendChild(el("span",{class:"chip feature"},["✓ Equip Inc"]));
  if(truthy(p.SymSpeed)) chips.appendChild(el("span",{class:"chip feature"},["✓ Sym Speed"]));
  (p.modifiers||[]).forEach(m=>chips.appendChild(el("span",{class:"chip mod"},[m.ModifierName])));
  panel.appendChild(chips);
  panel.appendChild(el("div",{class:"detail-section"},[
    el("strong",{},["Ratecard modifiers: "]), mods
  ]));
  (p.speeds||[]).forEach(s => panel.appendChild(speedDetail(s)));
  panel.appendChild(el("div",{class:"detail-section"},[
    el("strong",{},["Notes"]),
    el("p",{class:"muted"},[p.Notes || "No additional notes."])
  ]));
  panel.appendChild(el("div",{class:"detail-section disclaimer"},[
    p.disclaimer?.DisclaimerText || "No disclaimer attached."
  ]));
}
function speedDetail(s){
  const cards = (s.schedules||[]).map(sc => {
    let amount;
    if(truthy(sc.DisplayAsFree)){
      amount = `<span class="free">FREE</span> <span class="strike">${money(sc.StrikeThroughPrice || s.FirstPaidPrice)}</span>`;
    } else {
      amount = money(sc.Price);
    }
    return el("div",{class:"schedule-card", html:`<div class="label">${sc.DisplayLabel || monthLabel(sc)}</div><div class="amount">${amount}</div>`});
  });
  return el("div",{class:"detail-section"},[
    el("h4",{},[`${s.SpeedOption} ${s.DisplaySpeed}`]),
    el("div",{class:"meta"},[`Reference ID: ${s.ReferenceID} • Up: ${s.UploadSpeed || s.UploadMbps || "—"} • Reg. Rate: ${money(s.RegularRate)}`]),
    el("div",{class:"schedule-grid"},cards)
  ]);
}
function monthLabel(sc){
  if(sc.StartMonth === sc.EndMonth) return `Month ${sc.StartMonth}`;
  return `Months ${sc.StartMonth}-${sc.EndMonth}`;
}
function renderModifiers(){
  const box = document.getElementById("modifierList");
  if(!box) return;
  box.innerHTML="";
  DB.modifiers.forEach(m => {
    const used = DB.personaModifiers.filter(pm=>pm.ModifierID===m.ModifierID && truthy(pm.Active)).length;
    box.appendChild(el("div",{class:"modifier"},[
      el("h3",{},[m.ModifierName]),
      el("div",{class:"meta"},[`${m.Category || "Modifier"} • Used by ${used} personas`]),
      el("p",{class:"muted"},[m.Description || ""])
    ]));
  });
}
function renderHealth(){
  const box = document.getElementById("healthList");
  if(!box) return;
  box.innerHTML="";
  buildHealth().forEach(h => {
    const st = String(h.Status||"").toUpperCase();
    box.appendChild(el("div",{class:"health-row"},[
      el("div",{class:"muted"},[h.Section || ""]),
      el("div",{},[h.Check || ""]),
      el("div",{class:st==="OK"?"status-ok":st==="WARN"?"status-warn":"status-bad"},[st || "—"]),
      el("div",{},[String(h.Count ?? "")])
    ]));
  });
}
function fillExportPicker(){
  const sel = document.getElementById("exportPersona");
  if(!sel) return;
  sel.innerHTML="";
  DB.personas.forEach(p => sel.appendChild(el("option",{value:p.PersonaID},[p.PersonaName])));
  renderPrintArea();
}
function renderPrintArea(){
  const sel = document.getElementById("exportPersona");
  const p = DB.personas.find(x=>x.PersonaID===sel.value) || DB.personas[0];
  const area = document.getElementById("printArea");
  if(!p || !area) return;
  area.innerHTML="";
  area.appendChild(el("h2",{},[p.PersonaName]));
  area.appendChild(el("div",{class:"meta"},[`Family Group: ${p.FamilyGroup} • Pricing Set: ${p.PricingSet}`]));
  const chips = el("div",{class:"chips"},[]);
  if(truthy(p.EquipInc)) chips.appendChild(el("span",{class:"chip feature"},["✓ Equip Inc"]));
  if(truthy(p.SymSpeed)) chips.appendChild(el("span",{class:"chip feature"},["✓ Sym Speed"]));
  (p.modifiers||[]).forEach(m=>chips.appendChild(el("span",{class:"chip mod"},[m.ModifierName])));
  area.appendChild(chips);
  p.speeds.forEach(s => area.appendChild(speedDetail(s)));
  area.appendChild(el("div",{class:"detail-section disclaimer"},[p.disclaimer?.DisclaimerText || ""]));
}
function copySelectedSummary(){
  const sel = document.getElementById("exportPersona");
  const p = DB.personas.find(x=>x.PersonaID===sel.value);
  if(!p) return;
  const lines=[p.PersonaName,`Family Group: ${p.FamilyGroup}`,`Pricing Set: ${p.PricingSet}`,""];
  p.speeds.forEach(s=>lines.push(`${s.SpeedOption} ${s.DisplaySpeed} - ${money(s.FirstPaidPrice)} - Reg. ${money(s.RegularRate)}`));
  navigator.clipboard.writeText(lines.join("\n"));
}
