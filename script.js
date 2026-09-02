const titles = {
  dashboard: "Dashboard",
  monitoramento: "Monitoramento",
  alertas: "Alertas",
  historico: "Histórico",
  configuracoes: "Configurações"
};

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active-page");
  });

  document.getElementById(id).classList.add("active-page");

  document.querySelectorAll(".nav-item").forEach(b => {
    b.classList.toggle("active", b.dataset.page === id);
  });

  document.getElementById("page-title").textContent = titles[id];
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    showPage(btn.dataset.page);
  });
});

function saveSettings() {
  document.getElementById("saved").textContent =
    "✓ Configurações salvas neste protótipo.";
}

setTimeout(() => {
  document.getElementById("device-status").textContent = "Pronto";
}, 1200);