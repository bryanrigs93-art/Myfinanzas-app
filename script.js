const form = document.getElementById("form");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const lista = document.getElementById("lista");
const saldoEl = document.getElementById("saldo");

// ✅ Tu Web App (Apps Script)
const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";

// Proxy para GET (lectura de datos con CORS)
const GET_PROXY = "https://api.allorigins.win/raw?url=";

let saldo = 0;

// Utilidades
const fmt = (n) => Number(n).toFixed(2);
const parseMonto = (v) => parseFloat(String(v).replace(",", "."));
const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));

// Crear movimiento en UI con botón eliminar
function crearMovimiento(item) {
  const amount = parseMonto(item.monto);

  const li = document.createElement("li");
  li.classList.add(item.tipo);
  li.innerHTML = `
    <span>${escapeHtml(item.descripcion)} (${escapeHtml(item.categoria)})</span>
    <span>
      ${item.tipo === "ingreso" ? "+" : "-"}$${fmt(amount)}
      <button class="eliminar">❌</button>
    </span>
  `;

  // Botón eliminar
  li.querySelector(".eliminar").addEventListener("click", () => {
    saldo = item.tipo === "ingreso" ? saldo - amount : saldo + amount;
    saldoEl.textContent = fmt(saldo);
    li.remove();

    fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        accion: "eliminar",
        descripcion: item.descripcion,
        monto: amount,
        categoria: item.categoria,
        tipo: item.tipo
      })
    }).catch(err => console.error("❌ Error eliminando:", err));
  });

  lista.appendChild(li);
}

// --- Cargar datos existentes ---
window.addEventListener("DOMContentLoaded", () => {
  fetch(GET_PROXY + encodeURIComponent(API_URL))
    .then(r => r.text())
    .then(txt => {
      const data = txt ? JSON.parse(txt) : [];
      lista.innerHTML = "";
      saldo = 0;

      data.forEach(item => {
        const amount = parseMonto(item.monto);
        crearMovimiento(item);
        saldo = item.tipo === "ingreso" ? saldo + amount : saldo - amount;
      });

      saldoEl.textContent = fmt(saldo);
    })
    .catch(err => console.error("⚠️ Error cargando datos:", err));
});

// --- Guardar movimiento ---
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const desc = descripcion.value.trim();
  const amount = parseMonto(monto.value);
  const tipoMov = tipo.value;
  const cat = categoria.value;

  if (!desc || isNaN(amount) || amount <= 0) {
    alert("Ingresa una descripción y un monto válidos");
    return;
  }

  const item = { descripcion: desc, monto: amount, categoria: cat, tipo: tipoMov };
  crearMovimiento(item);

  saldo = tipoMov === "ingreso" ? saldo + amount : saldo - amount;
  saldoEl.textContent = fmt(saldo);

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(item)
  }).catch(err => console.error("❌ Error al guardar:", err));

  descripcion.value = "";
  monto.value = "";
  tipo.value = "ingreso";
  categoria.value = "General";
});
