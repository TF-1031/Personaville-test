
let DB = {
  raw: {},
  personas: [],
  speedOptions: [],
  schedules: [],
  modifiers: [],
  personaModifiers: [],
  disclaimers: [],
  icons: [],
  health: []
};

const SHEET_MAP = {
  personas: "05_Personas",
  speedOptions: "06_SpeedOptions",
  schedules: "07_PricingSchedules",
  modifiers: "04_Modifiers",
  personaModifiers: "10_PersonaModifiers",
  disclaimers: "08_Disclaimers",
  icons: "09_Icons",
  health: "12_DataHealth",
  summary: "00_Summary"
};

function truthy(v){
  return String(v ?? "").toLowerCase() === "true" || v === true || v === 1;
}
function money(v){
  if(v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if(Number.isNaN(n)) return String(v);
  return "$" + n.toFixed(n % 1 ? 2 : 0) + "/mo.";
}
function bareMoney(v){
  if(v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if(Number.isNaN(n)) return String(v);
  return "$" + n.toFixed(2);
}
function displayPricingSet(v){
  if(!v) return "";
  const s=String(v).trim();
  if(s.toLowerCase()==="std") return "Standard";
  return s.replace(/^Standard$/i,"Standard");
}
function rowsFromSheet(sheet){
  const rows = XLSX.utils.sheet_to_json(sheet, {defval:""});
  return rows.filter(r => Object.values(r).some(v => String(v).trim() !== ""));
}
async function loadBundledDatabase(){
  const res = await fetch("database/persona-db.json");
  if(!res.ok) throw new Error("Could not load database/persona-db.json");
  const data = await res.json();
  applyRawDatabase(data);
}
function applyRawDatabase(raw){
  DB.raw = raw;
  DB.personas = raw[SHEET_MAP.personas] || [];
  DB.speedOptions = raw[SHEET_MAP.speedOptions] || [];
  DB.schedules = raw[SHEET_MAP.schedules] || [];
  DB.modifiers = raw[SHEET_MAP.modifiers] || [];
  DB.personaModifiers = raw[SHEET_MAP.personaModifiers] || [];
  DB.disclaimers = raw[SHEET_MAP.disclaimers] || [];
  DB.icons = raw[SHEET_MAP.icons] || [];
  DB.health = raw[SHEET_MAP.health] || [];
  enhanceDatabase();
}
async function loadWorkbookFile(file){
  if(!window.XLSX) throw new Error("SheetJS library did not load. Use the bundled JSON or connect to the internet once.");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {type:"array"});
  const raw = {};
  workbook.SheetNames.forEach(name => {
    raw[name] = rowsFromSheet(workbook.Sheets[name]);
  });
  applyRawDatabase(raw);
}
function enhanceDatabase(){
  const speedsByPersona = groupBy(DB.speedOptions.filter(s => truthy(s.Active)), "PersonaID");
  const schedulesByRef = groupBy(DB.schedules, "ReferenceID");
  const modsById = Object.fromEntries(DB.modifiers.map(m => [m.ModifierID, m]));
  const personaModsByPersona = groupBy(DB.personaModifiers.filter(pm => truthy(pm.Active)), "PersonaID");
  const disclaimersById = Object.fromEntries(DB.disclaimers.map(d => [d.DisclaimerID, d]));
  DB.personas.forEach(p => {
    p.PricingSet = displayPricingSet(p.PricingSet);
    p.speeds = (speedsByPersona[p.PersonaID] || []).sort((a,b) => Number(a.SortOrder||0)-Number(b.SortOrder||0));
    p.speeds.forEach(s => {
      s.schedules = (schedulesByRef[s.ReferenceID] || []).sort((a,b)=>Number(a.Sequence||0)-Number(b.Sequence||0));
    });
    p.modifiers = (personaModsByPersona[p.PersonaID] || [])
      .sort((a,b)=>Number(a.DisplayOrder||0)-Number(b.DisplayOrder||0))
      .map(pm => modsById[pm.ModifierID])
      .filter(Boolean);
    p.disclaimer = disclaimersById[p.DisclaimerID] || null;
  });
}
function groupBy(arr, key){
  return arr.reduce((acc,row)=>{
    const k = row[key] || "";
    if(!acc[k]) acc[k]=[];
    acc[k].push(row);
    return acc;
  }, {});
}
function getUnique(arr, key){
  return [...new Set(arr.map(x=>x[key]).filter(Boolean))].sort();
}
function searchPersonas(query, family, pricing){
  const q = (query || "").toLowerCase().trim();
  return DB.personas.filter(p => {
    if(family && p.FamilyGroup !== family) return false;
    if(pricing && p.PricingSet !== pricing) return false;
    if(!q) return true;
    const blob = [
      p.PersonaName,p.FamilyGroup,p.PricingSet,p.PersonaID,
      ...(p.speeds||[]).flatMap(s => [s.ReferenceID,s.SpeedOption,s.DisplaySpeed,s.UploadSpeed,s.FirstPaidPrice,s.RegularRate]),
      ...(p.modifiers||[]).map(m=>m.ModifierName)
    ].join(" ").toLowerCase();
    return blob.includes(q);
  });
}
function buildHealth(){
  const rows = [];
  const ids = new Set(DB.personas.map(p=>p.PersonaID));
  const disc = new Set(DB.disclaimers.map(d=>d.DisclaimerID));
  const refs = new Set();
  const duplicateRefs = [];
  DB.speedOptions.forEach(s => { if(refs.has(s.ReferenceID)) duplicateRefs.push(s.ReferenceID); refs.add(s.ReferenceID); });
  rows.push({Section:"Summary",Check:"Market Personas",Status:"OK",Count:DB.personas.length,Details:"Rows in 05_Personas"});
  rows.push({Section:"Summary",Check:"Speed Options",Status:"OK",Count:DB.speedOptions.length,Details:"Rows in 06_SpeedOptions"});
  rows.push({Section:"Summary",Check:"Pricing Schedules",Status:"OK",Count:DB.schedules.length,Details:"Rows in 07_PricingSchedules"});
  rows.push({Section:"Relationships",Check:"Duplicate Reference IDs",Status:duplicateRefs.length?"WARN":"OK",Count:duplicateRefs.length,Details:duplicateRefs.join(", ")});
  const missingDisc = DB.personas.filter(p=>p.DisclaimerID && !disc.has(p.DisclaimerID));
  rows.push({Section:"Relationships",Check:"Missing Disclaimers",Status:missingDisc.length?"WARN":"OK",Count:missingDisc.length,Details:missingDisc.map(p=>p.PersonaName).join(", ")});
  const missingSchedule = DB.speedOptions.filter(s => !DB.schedules.find(x=>x.ReferenceID===s.ReferenceID));
  rows.push({Section:"Relationships",Check:"Speed Options Missing Schedule",Status:missingSchedule.length?"WARN":"OK",Count:missingSchedule.length,Details:missingSchedule.map(s=>s.ReferenceID).join(", ")});
  return (DB.health && DB.health.length) ? DB.health : rows;
}
