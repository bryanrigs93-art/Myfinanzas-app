const form = document.getElementById("form");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const lista = document.getElementById("lista");
const saldoEl = document.getElementById("saldo");
const filtroFecha = document.getElementById("filtro-fecha");

// ✅ Tu Web App (Apps Script actualizado)
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

// Crear movimiento en UI (siempre arriba) + botón eliminar
function crearMovimiento(item) {
  const amount = parseMonto(item.monto);

  const li = document.createElement("li");
  li.classList.add(item.tipo);
  li.innerHTML = `
    <span>${escapeHtml(item.descripcion)} (${escapeHtml(item.categoria)}) - <small>${escapeHtml(item.fecha)}</small></span>
    <span>
      ${item.tipo === "ingreso" ? "+" : "-"}$${fmt(amount)}
      <button class="eliminar" aria-label="Eliminar">❌</button>
    </span>
  `;

  // Eliminar
  li.querySelector(".eliminar").addEventListener("click", () => {
    // Actualiza saldo en UI
    saldo = item.tipo === "ingreso" ? saldo - amount : saldo + amount;
    saldoEl.textContent = fmt(saldo);
    li.remove();

    // Pide eliminar al backend
    fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        accion: "eliminar",
        fecha: item.fecha,              // dd/MM/yyyy
        descripcion: item.descripcion,
        monto: amount,
        categoria: item.categoria,
        tipo: item.tipo
      })
    }).catch(err => console.error("❌ Error eliminando:", err));
  });

  // 👉 más reciente arriba
  lista.prepend(li);
}

// --- Cargar datos existentes ---
window.addEventListener("DOMContentLoaded", () => {
  // Evita caché del proxy
  const url = GET_PROXY + encodeURIComponent(`${API_URL}?t=${Date.now()}`);

  fetch(url)
    .then(r => r.text())
    .then(txt => {
      const data = txt ? JSON.parse(txt) : [];
      lista.innerHTML = "";
      saldo = 0;

      // El backend ya los manda invertidos (más recientes primero)
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

  if (!desc || !isFinite(amount) || amount <= 0) {
    alert("Ingresa una descripción y un monto válidos");
    return;
  }

  // Fecha automática (dd/MM/yyyy)
  const fecha = new Date().toLocaleDateString("es-ES");

  const item = { fecha, descripcion: desc, monto: amount, categoria: cat, tipo: tipoMov };

  // Pinta en UI primero
  crearMovimiento(item);

  // Actualiza saldo
  saldo = tipoMov === "ingreso" ? saldo + amount : saldo - amount;
  saldoEl.textContent = fmt(saldo);

  // Envía al backend
  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(item)
  }).catch(err => console.error("❌ Error al guardar:", err));

  // Limpia form
  descripcion.value = "";
  monto.value = "";
  tipo.value = "ingreso";
  categoria.value = "General";
});

// --- Filtro por RANGO (Flatpickr) ---
if (window.flatpickr && filtroFecha) {
  flatpickr(filtroFecha, {
    mode: "range",
    dateFormat: "d/m/Y",
    allowInput: true,
    clickOpens: true,
    onChange: function (selectedDates) {
      if (selectedDates.length === 2) {
        filtrarPorRango(selectedDates[0], selectedDates[1]);
      } else {
        mostrarTodo();
      }
    }
  });
}

// Mostrar todo
function mostrarTodo() {
  const items = lista.querySelectorAll("li");
  items.forEach(li => li.style.display = "flex");
}

// Filtrar por rango
function filtrarPorRango(fechaInicio, fechaFin) {
  const items = lista.querySelectorAll("li");
  items.forEach(li => {
    const texto = li.querySelector("span").innerText;
    const match = texto.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (match) {
      const [d, m, y] = match[1].split("/").map(Number);
      const fechaItem = new Date(y, m - 1, d);
      li.style.display = (fechaItem >= fechaInicio && fechaItem <= fechaFin) ? "flex" : "none";
    }
  });
}
