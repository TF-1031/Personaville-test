
let selectedPersona = null;
const exportSelection = new Set();

function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(v===null || v===undefined || v===false) return;
    if(k==="class") node.className=v;
    else if(k==="html") node.innerHTML=v;
    else if(k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k,v===true ? "" : v);
  });
  [].concat(children).forEach(ch=>{
    if(ch===null || ch===undefined) return;
    node.appendChild(typeof ch==="string" ? document.createTextNode(ch) : ch);
  });
  return node;
}

function iconImage(path, alt, context={}, fallbackText="1:1"){
  if(!path) return el("span",{class:"icon-fallback"},[fallbackText]);
  return el("img",{
    src:path,
    alt:alt || "",
    loading:"lazy",
    onerror:(event)=>{
      recordIconLoadFailure(path, context);
      event.currentTarget.parentNode.replaceChildren(el("span",{class:"icon-fallback"},[fallbackText]));
      renderHealth();
    }
  });
}
function iconSlot(path, alt, context){
  return el("div",{class:"icon-slot"},[iconImage(path, alt, context)]);
}
function modifierChip(m){
  return el("span",{class:"chip mod"},[
    m.IconPath ? iconImage(m.IconPath, "", {type:"Modifier", id:m.ModifierID, name:m.ModifierName, file:m.IconFile}, "") : null,
    m.ModifierName
  ]);
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
function visiblePersonas(){
  const query = document.getElementById("globalSearch")?.value || "";
  const family = document.getElementById("familyFilter")?.value || "";
  const pricing = document.getElementById("pricingFilter")?.value || "";
  return searchPersonas(query, family, pricing);
}
function renderTiles(){
  const personas = visiblePersonas();
  const d1 = document.getElementById("dashboardTiles");
  const d2 = document.getElementById("personaTiles");
  [d1,d2].forEach(box => {
    if(!box) return;
    box.innerHTML="";
    personas.forEach(p => box.appendChild(personaTile(p)));
  });
}
function personaTile(p){
  const checked = exportSelection.has(p.PersonaID);
  const chips=[];
  if(truthy(p.EquipInc)) chips.push(el("span",{class:"chip feature"},["✓ Equip Inc"]));
  if(truthy(p.SymSpeed)) chips.push(el("span",{class:"chip feature"},["✓ Sym Speed"]));
  (p.modifiers||[]).forEach(m => chips.push(modifierChip(m)));
  const rows = (p.speeds||[]).map(s => el("tr",{},[
    el("td",{class:"so"},[s.SpeedOption || ""]),
    el("td",{},[s.DisplaySpeed || ""]),
    el("td",{class:"price schedule-summary"},[pricingSummaryNode(s)]),
    el("td",{},[money(s.RegularRate)])
  ]));
  return el("article",{class:`tile ${checked ? "selected" : ""}`, "data-persona-id":p.PersonaID, onclick:()=>selectPersona(p)},[
    el("div",{class:"tile-select"},[
      el("label",{class:"select-persona", onclick:event=>event.stopPropagation()},[
        el("input",{type:"checkbox", value:p.PersonaID, checked, "aria-label":`Select ${p.PersonaName || "persona"} for export`, onchange:event=>toggleExportPersona(p.PersonaID, event.currentTarget.checked)}),
        el("span",{},["Export"])
      ])
    ]),
    el("div",{class:"tile-head"},[
      el("div",{},[
        el("h3",{},[p.PersonaName || "Untitled"]),
        el("div",{class:"meta"},[`Family Group: ${p.FamilyGroup || "—"} • ${p.PricingSet || ""}`])
      ]),
      iconSlot(p.IconPath, `${p.PersonaName || "Persona"} icon`, {type:"Persona", id:p.PersonaID, name:p.PersonaName, file:p.PromoIcon})
    ]),
    el("div",{class:"chips"},chips.length?chips:[el("span",{class:"chip gray"},["No modifiers"])]),
    el("table",{class:"speed-table"},[
      el("thead",{},[el("tr",{},[el("th",{},["Option"]),el("th",{},["Speed"]),el("th",{},["Pricing"]),el("th",{},["Reg. Rate"])])]),
      el("tbody",{},rows)
    ])
  ]);
}
function pricingSummaryNode(s){
  const rows = s.schedules || [];
  if(!rows.length) return el("span",{},[money(s.FirstPaidPrice)]);
  if(rows.length === 1 && !truthy(rows[0].DisplayAsFree)) return el("span",{},[money(rows[0].Price ?? s.FirstPaidPrice)]);

  return el("div",{class:"pricing-summary-list"},rows.map(pricingSummaryRow));
}
function pricingSummaryRow(row){
  const label = row.DisplayLabel || monthLabel(row);
  if(truthy(row.DisplayAsFree)){
    return el("div",{class:"pricing-summary-row"},[
      el("span",{class:"pricing-summary-price free"},["FREE"]),
      el("span",{class:"pricing-summary-months"},[label])
    ]);
  }
  return el("div",{class:"pricing-summary-row"},[
    el("span",{class:"pricing-summary-price"},[money(row.Price)]),
    el("span",{class:"pricing-summary-months"},[label])
  ]);
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
  panel.appendChild(el("div",{class:"detail-title"},[
    iconSlot(p.IconPath, `${p.PersonaName || "Persona"} icon`, {type:"Persona", id:p.PersonaID, name:p.PersonaName, file:p.PromoIcon}),
    el("h3",{},[p.PersonaName])
  ]));
  panel.appendChild(el("div",{class:"meta"},[`Persona ID: ${p.PersonaID} • Family Group: ${p.FamilyGroup}`]));
  const chips = el("div",{class:"chips"},[]);
  if(truthy(p.EquipInc)) chips.appendChild(el("span",{class:"chip feature"},["✓ Equip Inc"]));
  if(truthy(p.SymSpeed)) chips.appendChild(el("span",{class:"chip feature"},["✓ Sym Speed"]));
  (p.modifiers||[]).forEach(m=>chips.appendChild(modifierChip(m)));
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
      el("div",{class:"modifier-title"},[
        iconSlot(m.IconPath, `${m.ModifierName || "Modifier"} icon`, {type:"Modifier", id:m.ModifierID, name:m.ModifierName, file:m.IconFile}),
        el("h3",{},[m.ModifierName])
      ]),
      el("div",{class:"meta"},[`${m.Category || "Modifier"} • Used by ${used} personas`]),
      el("p",{class:"muted"},[m.Description || ""])
    ]));
  });
}
function renderHealth(){
  const box = document.getElementById("healthList");
  if(!box) return;
  box.innerHTML="";
  buildHealth().forEach((h, index) => {
    const st = String(h.Status||"").toUpperCase();
    const failed = st && st !== "OK";
    const records = h.Records || [];
    const detailId = `health-detail-${index}`;
    const row = el("button",{
      class:`health-row ${failed ? "failed" : ""}`,
      type:"button",
      "aria-expanded":"false",
      "aria-controls":detailId,
      disabled:failed ? null : "disabled",
      onclick:()=>toggleHealthDetails(detailId, row)
    },[
      el("div",{class:"muted"},[h.Section || ""]),
      el("div",{},[h.Check || ""]),
      el("div",{class:st==="OK"?"status-ok":st==="WARN"?"status-warn":"status-bad"},[st || "—"]),
      el("div",{},[String(h.Count ?? "")]),
      el("div",{class:"health-details muted", title:h.Details || ""},[failed ? "Click to inspect offending records" : (h.Details || "—")])
    ]);
    box.appendChild(row);
    box.appendChild(healthDetailPanel(h, records, detailId));
  });
}
function toggleHealthDetails(detailId, row){
  const panel = document.getElementById(detailId);
  if(!panel || row.disabled) return;
  const open = panel.hidden;
  panel.hidden = !open;
  row.setAttribute("aria-expanded", String(open));
}
function healthDetailPanel(h, records, id){
  const failed = String(h.Status||"").toUpperCase() !== "OK";
  const panel = el("div",{class:"health-detail-panel", id},[]);
  panel.hidden = true;
  if(!failed){
    return panel;
  }
  panel.appendChild(el("h3",{},[`${h.Check || "Health check"} details`]));
  panel.appendChild(el("p",{class:"muted"},[records.length ? `${records.length} offending record${records.length===1?"":"s"}.` : "No record-level details were provided for this failed check."]));
  if(!records.length){
    panel.appendChild(el("pre",{},[h.Details || "No details available."]));
    return panel;
  }
  records.forEach(record => {
    const fields = record.Fields || {};
    panel.appendChild(el("div",{class:"health-record"},[
      el("div",{class:"health-record-title"},[record.Record || "Unknown record"]),
      el("div",{class:"health-record-reason"},[record.Reason || "No reason provided."]),
      el("dl",{class:"health-record-fields"},Object.entries(fields).flatMap(([key,value]) => [
        el("dt",{},[key]),
        el("dd",{},[String(value ?? "")])
      ]))
    ]));
  });
  return panel;
}
function fillExportPicker(){
  const sel = document.getElementById("exportPersona");
  if(!sel) return;
  sel.innerHTML="";
  DB.personas.forEach(p => sel.appendChild(el("option",{value:p.PersonaID},[p.PersonaName])));
  syncExportSelectionUI();
  renderPrintArea();
}
function selectedExportPersonas(){
  return [...exportSelection]
    .map(id => DB.personas.find(p => p.PersonaID === id))
    .filter(Boolean);
}
function currentExportPersona(){
  const sel = document.getElementById("exportPersona");
  return DB.personas.find(x=>x.PersonaID===sel?.value) || DB.personas[0];
}
function toggleExportPersona(personaID, checked){
  if(checked) exportSelection.add(personaID);
  else exportSelection.delete(personaID);
  syncExportSelectionUI();
  renderPrintArea();
  renderTiles();
}
function selectAllVisiblePersonas(){
  visiblePersonas().forEach(p => exportSelection.add(p.PersonaID));
  syncExportSelectionUI();
  renderPrintArea();
  renderTiles();
}
function clearExportSelection(){
  exportSelection.clear();
  syncExportSelectionUI();
  renderPrintArea();
  renderTiles();
}
function syncExportSelectionUI(){
  const count = exportSelection.size;
  const label = count === 1 ? "1 selected" : `${count} selected`;
  const countEl = document.getElementById("selectedCount");
  if(countEl) countEl.textContent = label;
  document.querySelectorAll(".select-persona input[type='checkbox']").forEach(input => {
    input.checked = exportSelection.has(input.closest("article")?.dataset?.personaId || input.value);
  });
}
function renderPrintArea(){
  const area = document.getElementById("printArea");
  if(!area) return;
  area.innerHTML="";
  const selected = selectedExportPersonas();
  if(selected.length){
    selected.forEach(p => area.appendChild(printablePersonaCard(p)));
    return;
  }
  const p = currentExportPersona();
  if(!p){
    area.appendChild(el("div",{class:"print-card empty-state"},["No personas are available to export."]));
    return;
  }
  area.appendChild(el("div",{class:"print-card empty-state"},[
    el("strong",{},["No personas selected for multi-export."]),
    el("p",{class:"muted"},["Use the tile checkboxes or Select All Visible to print multiple personas. The single-persona preview remains below."])
  ]));
  area.appendChild(printablePersonaCard(p));
}
function printablePersonaCard(p){
  const card = el("section",{class:"print-card"},[]);
  card.appendChild(el("div",{class:"print-title"},[
    iconSlot(p.IconPath, `${p.PersonaName || "Persona"} icon`, {type:"Persona", id:p.PersonaID, name:p.PersonaName, file:p.PromoIcon}),
    el("h2",{},[p.PersonaName])
  ]));
  card.appendChild(el("div",{class:"meta"},[`Family Group: ${p.FamilyGroup} • Pricing Set: ${p.PricingSet}`]));
  const chips = el("div",{class:"chips"},[]);
  if(truthy(p.EquipInc)) chips.appendChild(el("span",{class:"chip feature"},["✓ Equip Inc"]));
  if(truthy(p.SymSpeed)) chips.appendChild(el("span",{class:"chip feature"},["✓ Sym Speed"]));
  (p.modifiers||[]).forEach(m=>chips.appendChild(modifierChip(m)));
  card.appendChild(chips);
  p.speeds.forEach(s => card.appendChild(speedDetail(s)));
  card.appendChild(healthSummaryNode(p));
  card.appendChild(el("div",{class:"detail-section disclaimer"},[p.disclaimer?.DisclaimerText || ""]));
  return card;
}
function healthSummaryNode(p){
  const personaRecords = buildHealth().flatMap(row => row.Records || []).filter(record => record.Fields?.PersonaID === p.PersonaID);
  const message = personaRecords.length ? `${personaRecords.length} health note${personaRecords.length===1?"":"s"} reference this persona.` : "No persona-specific health notes.";
  return el("div",{class:"detail-section"},[
    el("strong",{},["Health summary"]),
    el("p",{class:"muted"},[message])
  ]);
}
function copySelectedSummary(){
  const personas = selectedExportPersonas();
  const list = personas.length ? personas : [currentExportPersona()].filter(Boolean);
  if(!list.length) return;
  const lines=[];
  list.forEach((p, index)=>{
    if(index) lines.push("", "---", "");
    lines.push(p.PersonaName,`Family Group: ${p.FamilyGroup}`,`Pricing Set: ${p.PricingSet}`,"");
    p.speeds.forEach(s=>lines.push(`${s.SpeedOption} ${s.DisplaySpeed} - ${money(s.FirstPaidPrice)} - Reg. ${money(s.RegularRate)}`));
  });
  navigator.clipboard.writeText(lines.join("\n"));
}
