
let DB = {
  raw: {},
  personas: [],
  speedOptions: [],
  schedules: [],
  modifiers: [],
  personaModifiers: [],
  disclaimers: [],
  icons: [],
  health: [],
  iconFailures: []
};

const ICON_DIR = "icons/";
function normalizeIconFile(file){
  const value = String(file || "").trim();
  if(!value) return "";
  if(/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  return value.replace(/^\.\//, "").replace(/^(icons\/)+/i, "");
}
function resolveIconPath(file){
  const normalized = normalizeIconFile(file);
  if(!normalized) return "";
  if(/^https?:\/\//i.test(normalized) || normalized.startsWith("/")) return normalized;
  return ICON_DIR + normalized;
}
function recordIconLoadFailure(path, context){
  if(!path) return;
  const key = `${context?.type || "Icon"}|${context?.id || ""}|${path}`;
  if(DB.iconFailures.some(f => f.Key === key)) return;
  DB.iconFailures.push({
    Key:key,
    Path:path,
    Context:context || {},
    Reason:"Browser could not load the resolved image path."
  });
}

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
  DB.iconFailures = [];
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
function pricingRowIdentity(row){
  return [
    row.ScheduleID || "",
    row.ReferenceID || "",
    row.StartMonth ?? "",
    row.EndMonth ?? "",
    row.Price ?? "",
    truthy(row.DisplayAsFree) ? "FREE" : "PAID",
    row.StrikeThroughPrice ?? ""
  ].join("|");
}
function dedupePricingRows(rows){
  const seen = new Set();
  return rows.filter(row => {
    const key = pricingRowIdentity(row);
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function getSchedulesForSpeed(speed){
  return dedupePricingRows(
    DB.schedules.filter(row =>
      row.ReferenceID === speed.ReferenceID &&
      row.ScheduleID === speed.ScheduleID
    )
  ).sort((a,b)=>Number(a.Sequence||0)-Number(b.Sequence||0));
}
function healthMonthLabel(row){
  if(row.StartMonth === row.EndMonth) return `Month ${row.StartMonth}`;
  return `Months ${row.StartMonth}-${row.EndMonth}`;
}
function healthRecord(record, reason, fields={}){
  return {Record: record || "Unknown record", Reason: reason || "No reason provided", Fields: fields};
}
function healthDetailsFromRecords(records){
  return records.map(r => `${r.Record}: ${r.Reason}`).join(", ");
}
function workbookHealthRecords(row){
  const details = String(row.Details || "").trim();
  if(!details) return [];
  return details.split(/,\s*/).filter(Boolean).map((detail, index) => healthRecord(
    `${row.Check || "Workbook health"} #${index + 1}`,
    detail,
    {Source:"12_DataHealth", Section:row.Section || "Workbook", Status:row.Status || ""}
  ));
}
function enhanceDatabase(){
  const speedsByPersona = groupBy(DB.speedOptions.filter(s => truthy(s.Active)), "PersonaID");
  const modsById = Object.fromEntries(DB.modifiers.map(m => [m.ModifierID, m]));
  const personaModsByPersona = groupBy(DB.personaModifiers.filter(pm => truthy(pm.Active)), "PersonaID");
  const disclaimersById = Object.fromEntries(DB.disclaimers.map(d => [d.DisclaimerID, d]));
  const iconsByFile = Object.fromEntries(DB.icons.map(i => [normalizeIconFile(i.FileName), {...i, ResolvedPath:resolveIconPath(i.FileName)}]));
  DB.icons.forEach(i => { i.ResolvedPath = resolveIconPath(i.FileName); });
  DB.modifiers.forEach(m => {
    m.IconPath = resolveIconPath(m.IconFile);
    m.IconRecord = iconsByFile[normalizeIconFile(m.IconFile)] || null;
  });
  DB.personas.forEach(p => {
    p.PricingSet = displayPricingSet(p.PricingSet);
    p.IconPath = resolveIconPath(p.PromoIcon);
    p.IconRecord = iconsByFile[normalizeIconFile(p.PromoIcon)] || null;
    p.speeds = (speedsByPersona[p.PersonaID] || []).sort((a,b) => Number(a.SortOrder||0)-Number(b.SortOrder||0));
    p.speeds.forEach(s => {
      // ReferenceID is reused across Standard, 3 Months Free, and Price Lock personas.
      // ScheduleID + ReferenceID is the exact schedule key for one persona speed.
      s.schedules = getSchedulesForSpeed(s);
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
  const personaById = Object.fromEntries(DB.personas.map(p => [p.PersonaID, p]));
  const disc = new Set(DB.disclaimers.map(d=>d.DisclaimerID));

  rows.push({Section:"Summary",Check:"Market Personas",Status:"OK",Count:DB.personas.length,Details:"Rows in 05_Personas"});
  rows.push({Section:"Summary",Check:"Speed Options",Status:"OK",Count:DB.speedOptions.length,Details:"Rows in 06_SpeedOptions"});
  rows.push({Section:"Summary",Check:"Pricing Schedules",Status:"OK",Count:DB.schedules.length,Details:"Rows in 07_PricingSchedules"});

  const duplicatePricingKeys = {};
  DB.schedules.forEach(row => {
    const key = pricingRowIdentity(row);
    duplicatePricingKeys[key] = (duplicatePricingKeys[key] || 0) + 1;
  });
  const duplicatePricingRows = Object.entries(duplicatePricingKeys).filter(([,count]) => count > 1);
  const duplicatePricingRecords = duplicatePricingRows.map(([key,count]) => healthRecord(
    key,
    `Pricing schedule has ${count} identical rows for the same schedule, reference, months, price, free flag, and strike-through price.`,
    {Identity:key, DuplicateRows:count}
  ));
  rows.push({
    Section:"Pricing",
    Check:"Duplicate Pricing Rows",
    Status:duplicatePricingRecords.length?"WARN":"OK",
    Count:duplicatePricingRecords.length,
    Details:healthDetailsFromRecords(duplicatePricingRecords),
    Records:duplicatePricingRecords
  });

  const schedulesByExactKey = groupBy(DB.schedules, "ScheduleID");
  const overlapRecords = [];
  Object.entries(schedulesByExactKey).forEach(([scheduleID, scheduleRows]) => {
    const byRef = groupBy(scheduleRows, "ReferenceID");
    Object.entries(byRef).forEach(([referenceID, refRows]) => {
      const sorted = dedupePricingRows(refRows).sort((a,b)=>Number(a.StartMonth||0)-Number(b.StartMonth||0));
      for(let i=1; i<sorted.length; i++){
        if(Number(sorted[i].StartMonth||0) <= Number(sorted[i-1].EndMonth||0)){
          overlapRecords.push(healthRecord(
            `${scheduleID}/${referenceID}`,
            `${sorted[i].DisplayLabel || healthMonthLabel(sorted[i])} starts before ${sorted[i-1].DisplayLabel || healthMonthLabel(sorted[i-1])} ends.`,
            {ScheduleID:scheduleID, ReferenceID:referenceID, PreviousRange:sorted[i-1].DisplayLabel || healthMonthLabel(sorted[i-1]), CurrentRange:sorted[i].DisplayLabel || healthMonthLabel(sorted[i])}
          ));
        }
      }
    });
  });
  rows.push({
    Section:"Pricing",
    Check:"Overlapping Month Ranges",
    Status:overlapRecords.length?"WARN":"OK",
    Count:overlapRecords.length,
    Details:healthDetailsFromRecords(overlapRecords),
    Records:overlapRecords
  });

  const refPricingSets = {};
  DB.speedOptions.forEach(speed => {
    const persona = personaById[speed.PersonaID];
    if(!persona) return;
    if(!refPricingSets[speed.ReferenceID]) refPricingSets[speed.ReferenceID] = new Set();
    refPricingSets[speed.ReferenceID].add(displayPricingSet(persona.PricingSet));
  });
  const mixedRefs = Object.entries(refPricingSets).filter(([,sets]) => sets.size > 1);
  const mixedRefRecords = mixedRefs.map(([ref,sets]) => healthRecord(
    ref,
    `ReferenceID is shared across pricing sets: ${[...sets].join(" / ")}. Schedules must be matched by ScheduleID + ReferenceID to avoid promotion mixing.`,
    {ReferenceID:ref, PricingSets:[...sets].join(" / ")}
  ));
  rows.push({
    Section:"Pricing",
    Check:"Mixed Promotion Reference IDs",
    Status:mixedRefRecords.length?"WARN":"OK",
    Count:mixedRefRecords.length,
    Details:healthDetailsFromRecords(mixedRefRecords),
    Records:mixedRefRecords
  });

  const missingSchedule = DB.speedOptions.filter(speed => !DB.schedules.some(row =>
    row.ReferenceID === speed.ReferenceID && row.ScheduleID === speed.ScheduleID
  ));
  const missingScheduleRecords = missingSchedule.map(speed => healthRecord(
    `${speed.PersonaID} ${speed.ReferenceID} ${speed.ScheduleID}`,
    "Speed option has no matching pricing rows for its exact ScheduleID + ReferenceID.",
    {PersonaID:speed.PersonaID, ReferenceID:speed.ReferenceID, ScheduleID:speed.ScheduleID, SpeedOption:speed.SpeedOption}
  ));
  rows.push({
    Section:"Relationships",
    Check:"Missing Pricing Rows",
    Status:missingScheduleRecords.length?"WARN":"OK",
    Count:missingScheduleRecords.length,
    Details:healthDetailsFromRecords(missingScheduleRecords),
    Records:missingScheduleRecords
  });

  const missingDisc = DB.personas.filter(p=>!p.DisclaimerID || !disc.has(p.DisclaimerID));
  const missingDiscRecords = missingDisc.map(p => healthRecord(
    p.PersonaName || p.PersonaID,
    p.DisclaimerID ? `Persona references missing DisclaimerID ${p.DisclaimerID}.` : "Persona does not have a DisclaimerID.",
    {PersonaID:p.PersonaID, PersonaName:p.PersonaName, DisclaimerID:p.DisclaimerID || ""}
  ));
  rows.push({
    Section:"Relationships",
    Check:"Missing Disclaimers",
    Status:missingDiscRecords.length?"WARN":"OK",
    Count:missingDiscRecords.length,
    Details:healthDetailsFromRecords(missingDiscRecords),
    Records:missingDiscRecords
  });

  const iconRecords = [];
  const iconFiles = new Set(DB.icons.map(i => normalizeIconFile(i.FileName)).filter(Boolean));
  DB.icons.forEach(icon => {
    const resolved = resolveIconPath(icon.FileName);
    if(!resolved){
      iconRecords.push(healthRecord(
        icon.IconName || icon.IconID,
        "Icon table row does not resolve to an image path.",
        {IconID:icon.IconID, IconName:icon.IconName, FileName:icon.FileName || "", ResolvedPath:resolved}
      ));
    }
  });
  DB.personas.forEach(persona => {
    const normalized = normalizeIconFile(persona.PromoIcon);
    const resolved = resolveIconPath(persona.PromoIcon);
    if(!normalized || !iconFiles.has(normalized)){
      iconRecords.push(healthRecord(
        persona.PersonaName || persona.PersonaID,
        "Persona PromoIcon does not match a FileName in the Icons table.",
        {PersonaID:persona.PersonaID, PromoIcon:persona.PromoIcon || "", ResolvedPath:resolved}
      ));
    }
  });
  DB.modifiers.forEach(modifier => {
    const normalized = normalizeIconFile(modifier.IconFile);
    const resolved = resolveIconPath(modifier.IconFile);
    if(!normalized || !iconFiles.has(normalized)){
      iconRecords.push(healthRecord(
        modifier.ModifierName || modifier.ModifierID,
        "Modifier IconFile does not match a FileName in the Icons table.",
        {ModifierID:modifier.ModifierID, IconFile:modifier.IconFile || "", ResolvedPath:resolved}
      ));
    }
  });
  DB.iconFailures.forEach(failure => {
    iconRecords.push(healthRecord(
      `${failure.Context.type || "Icon"} ${failure.Context.id || failure.Path}`,
      failure.Reason,
      {ResolvedPath:failure.Path, SourceFile:failure.Context.file || "", AssociatedRecord:failure.Context.name || ""}
    ));
  });
  rows.push({
    Section:"Assets",
    Check:"Resolved Icon Image Paths",
    Status:iconRecords.length?"WARN":"OK",
    Count:iconRecords.length,
    Details:healthDetailsFromRecords(iconRecords),
    Records:iconRecords
  });

  const workbookRows = (DB.health || []).map(h => ({...h, Section:h.Section || "Workbook", Records:workbookHealthRecords(h)}));
  return rows.concat(workbookRows);
}
