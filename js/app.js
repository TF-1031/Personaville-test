
function setView(name){
  document.querySelectorAll(".nav").forEach(n=>{
    const active = n.dataset.view===name;
    n.classList.toggle("active", active);
    n.setAttribute("aria-current", active ? "page" : "false");
  });
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active", v.id===name));
  const heading = document.getElementById(name)?.querySelector("h2");
  if(heading){
    heading.setAttribute("tabindex", "-1");
    heading.focus({preventScroll:true});
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".nav").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
  document.getElementById("workbookUpload").addEventListener("change", async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    try{
      await loadWorkbookFile(file);
      const instructions = document.getElementById("downloadInstructions");
      if(instructions) instructions.hidden = true;
      renderAll();
      setView("dashboard");
    }catch(err){
      alert("Could not build database from workbook: " + err.message);
    }
  });
  document.getElementById("downloadUpdatedJson").addEventListener("click", downloadUpdatedJson);
  document.getElementById("loadBundled").addEventListener("click", async ()=>{
    try{
      await loadBundledDatabase();
      renderAll();
    }catch(err){
      alert("Could not load bundled database: " + err.message + "\\nIf opening from local file, use Build Database instead.");
    }
  });
  document.getElementById("globalSearch").addEventListener("input", renderTiles);
  document.getElementById("familyFilter").addEventListener("change", renderTiles);
  document.getElementById("pricingFilter").addEventListener("change", renderTiles);
  document.getElementById("clearSelection").addEventListener("click", ()=>{
    selectedPersona=null;
    const p=document.getElementById("detailPanel");
    p.className="detail empty";
    p.textContent="Select a persona tile to view details.";
  });
  document.getElementById("exportPersona").addEventListener("change", renderPrintArea);
  document.getElementById("selectAllVisible").addEventListener("click", selectAllVisiblePersonas);
  document.getElementById("clearExportSelection").addEventListener("click", clearExportSelection);
  document.getElementById("printPersona").addEventListener("click", ()=>window.print());
  document.getElementById("copySummary").addEventListener("click", copySelectedSummary);

  // Try bundled database on load. If local browser blocks fetch, user can still upload workbook.
  try{
    await loadBundledDatabase();
    renderAll();
  }catch(err){
    console.warn(err);
  }
});

function downloadUpdatedJson(){
  try{
    if(hasBlockingHealthErrors()){
      const ok = window.confirm("Database health includes BAD/Error rows. Download persona-db.json anyway?");
      if(!ok) return;
    }
    const blob = new Blob([updatedDatabaseJson()], {type:"application/json"});
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "persona-db.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    const instructions = document.getElementById("downloadInstructions");
    if(instructions) instructions.hidden = false;
    renderPublishPanel();
  }catch(err){
    alert(err.message);
  }
}
