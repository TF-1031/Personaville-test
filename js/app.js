
function setView(name){
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active", n.dataset.view===name));
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active", v.id===name));
}
document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".nav").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
  document.getElementById("workbookUpload").addEventListener("change", async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    try{
      await loadWorkbookFile(file);
      renderAll();
    }catch(err){
      alert("Could not build database from workbook: " + err.message);
    }
  });
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
