(() => {
  const $ = (id) => document.getElementById(id);
  $("year").textContent = new Date().getFullYear();
  $("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
  document.querySelectorAll("#mainNav a").forEach(a => a.addEventListener("click", () => $("mainNav").classList.remove("open")));

  const cfg = window.FISU_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("PASTE_") && !cfg.SUPABASE_ANON_KEY.includes("PASTE_");
  if (!configured || !window.supabase) {
    $("loginMessage").textContent = "Admin login is not connected yet. Add your Supabase Project URL and publishable key in config.js.";
    return;
  }

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  let currentRole = null;
  const sectionNames = {news:"News & announcements", leadership:"Leadership", projects:"Projects & impact", resources:"Scholarships & resources"};
  const escapeHtml = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const safeUrl = (s="") => { try { const u = new URL(s); return ["https:","http:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };

  async function loadPublic() {
    const {data, error} = await client.from("site_content").select("*").eq("published", true).order("created_at", {ascending:false});
    if (error) { console.warn("FISU content could not be loaded:", error.message); return; }
    const targets = {news:"newsGrid", leadership:"leadershipGrid", projects:"projectsGrid", resources:"resourcesGrid"};
    for (const [section, id] of Object.entries(targets)) {
      const rows = (data || []).filter(x => x.section === section);
      $(id).innerHTML = rows.length ? rows.map(cardHtml).join("") : `<div class="empty-state">No ${escapeHtml(sectionNames[section].toLowerCase())} have been published yet.</div>`;
    }
  }
  function cardHtml(item) {
    const img = safeUrl(item.image_url);
    const link = safeUrl(item.link_url);
    return `<article class="content-card">${img ? `<img class="card-image" src="${escapeHtml(img)}" alt="" loading="lazy">` : ""}
      <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p>${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener">READ MORE ↗</a>` : ""}</article>`;
  }
  async function getRole(userId) {
    const {data, error} = await client.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return data?.role || null;
  }
  async function showSession(session) {
    if (!session) {
      $("authPanel").classList.remove("hidden"); $("dashboardPanel").classList.add("hidden"); currentRole = null; return;
    }
    try {
      currentRole = await getRole(session.user.id);
      if (!["super_admin","admin","editor"].includes(currentRole)) {
        await client.auth.signOut();
        $("loginMessage").textContent = "This account does not have permission to access the FISU admin portal.";
        return;
      }
      $("authPanel").classList.add("hidden"); $("dashboardPanel").classList.remove("hidden");
      $("adminIdentity").textContent = session.user.email;
      $("adminRole").textContent = `Access level: ${currentRole.replace("_"," ")}`;
      await loadManaged();
    } catch (e) {
      $("loginMessage").textContent = "Could not verify administrator permissions: " + e.message;
    }
  }
  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault(); $("loginMessage").textContent = "Signing in…";
    const {data, error} = await client.auth.signInWithPassword({email:$("loginEmail").value.trim(), password:$("loginPassword").value});
    if (error) { $("loginMessage").textContent = error.message; return; }
    $("loginMessage").textContent = "";
    await showSession(data.session);
  });
  $("signOutBtn").addEventListener("click", async () => { await client.auth.signOut(); await showSession(null); });
  client.auth.onAuthStateChange((_event, session) => { showSession(session); });

  async function loadManaged() {
    const {data, error} = await client.from("site_content").select("*").order("created_at", {ascending:false});
    if (error) { $("managedContent").textContent = "Unable to load content: " + error.message; return; }
    if (!data?.length) { $("managedContent").textContent = "No content yet. Use the form to add your first item."; return; }
    $("managedContent").innerHTML = data.map(x => `<div class="managed-item"><div><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(sectionNames[x.section] || x.section)} · ${x.published ? "Published" : "Draft"}</small></div><div class="item-actions"><button type="button" data-edit="${x.id}">Edit</button><button type="button" class="delete-btn" data-delete="${x.id}">Delete</button></div></div>`).join("");
    $("managedContent").querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editItem(data.find(x => x.id === b.dataset.edit))));
    $("managedContent").querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => deleteItem(b.dataset.delete)));
  }
  function editItem(x) {
    if (!x) return;
    $("contentId").value=x.id; $("contentSection").value=x.section; $("contentTitle").value=x.title;
    $("contentBody").value=x.body; $("contentImage").value=x.image_url || ""; $("contentLink").value=x.link_url || "";
    $("contentPublished").checked=x.published; $("editorHeading").textContent="Edit website content"; $("saveContentBtn").textContent="Update content";
    $("editorMessage").textContent=""; $("contentForm").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function clearForm() {
    $("contentForm").reset(); $("contentId").value=""; $("contentPublished").checked=true;
    $("editorHeading").textContent="Add website content"; $("saveContentBtn").textContent="Save content"; $("editorMessage").textContent="";
  }
  $("resetFormBtn").addEventListener("click", clearForm);
  $("contentForm").addEventListener("submit", async e => {
    e.preventDefault();
    const id=$("contentId").value;
    const payload={section:$("contentSection").value,title:$("contentTitle").value.trim(),body:$("contentBody").value.trim(),
      image_url:$("contentImage").value.trim() || null,link_url:$("contentLink").value.trim() || null,published:$("contentPublished").checked};
    $("editorMessage").textContent="Saving…";
    let result;
    if (id) result=await client.from("site_content").update(payload).eq("id",id);
    else result=await client.from("site_content").insert(payload);
    if (result.error) { $("editorMessage").textContent=result.error.message; return; }
    $("editorMessage").textContent="Saved successfully.";
    clearForm(); await loadManaged(); await loadPublic();
  });
  async function deleteItem(id) {
    if (!confirm("Delete this item from the FISU website?")) return;
    const {error}=await client.from("site_content").delete().eq("id",id);
    if (error) { alert("Could not delete: "+error.message); return; }
    await loadManaged(); await loadPublic();
  }
  $("refreshBtn").addEventListener("click", async () => { await loadManaged(); await loadPublic(); });
  client.auth.getSession().then(({data}) => showSession(data.session));
  loadPublic();
})();