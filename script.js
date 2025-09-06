const form = document.getElementById("form");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const lista = document.getElementById("lista");
const saldoEl = document.getElementById("saldo");
const filtroFecha = document.getElementById("filtro-fecha");

// 👉 Pega aquí tu URL de Apps Script publicada
const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";

// Proxy para GET
const GET_PROXY = "https://api.allorigins.win/raw?url=";

let saldo = 0;

const fmt = (n) => Number(n).toFixed(2);
const parseMonto = (v) => parseFloat(String(v).replace(",", "."));
const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));

function crearMovimiento(item) {
  const amount = parseMonto(item.monto);

  const li = document.createElement("li");
  li.classList.add(item.tipo);
  li.innerHTML = `
    <span>${escapeHtml(item.descripcion)} (${escapeHtml(item.categoria)}) - <small>${escapeHtml(item.fecha)}</small></span>
    <span>
      ${item.tipo === "ingreso" ? "+" : "-"}$${fmt(amount)}
      <button class="eliminar">❌</button>
    </span>
  `;

  li.querySelector(".eliminar").addEventListener("click", () => {
    saldo = item.tipo === "ingreso" ? saldo - amount : saldo + amount;
    saldoEl.textContent = fmt(saldo);
    li.remove();

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "eliminar",
        fecha: item.fecha,
        descripcion: item.descripcion,
        monto: amount,
        categoria: item.categoria,
        tipo: item.tipo
      })
    }).catch(err => console.error("❌ Error eliminando:", err));
  });

  lista.prepend(li);
}

// --- Cargar datos ---
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

// --- Guardar ---
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

  const fecha = new Date().toLocaleDateString("es-ES");
  const item = { fecha, descripcion: desc, monto: amount, categoria: cat, tipo: tipoMov };
  crearMovimiento(item);

  saldo = tipoMov === "ingreso" ? saldo + amount : saldo - amount;
  saldoEl.textContent = fmt(saldo);

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  }).catch(err => console.error("❌ Error al guardar:", err));

  descripcion.value = "";
  monto.value = "";
  tipo.value = "ingreso";
  categoria.value = "General";
});

// --- Filtro Flatpickr ---
if (filtroFecha) {
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

function mostrarTodo() {
  const items = lista.querySelectorAll("li");
  items.forEach(li => li.style.display = "flex");
}

function filtrarPorRango(fechaInicio, fechaFin) {
  const items = lista.querySelectorAll("li");
  items.forEach(li => {
    const texto = li.querySelector("span").innerText;
    const regex = /(\d{1,2}\/\d{1,2}\/\d{4})/;
    const match = texto.match(regex);

    if (match) {
      const partes = match[1].split("/");
      const fechaItem = new Date(partes[2], partes[1] - 1, partes[0]);

      li.style.display = (fechaItem >= fechaInicio && fechaItem <= fechaFin) ? "flex" : "none";
    }
  });
}
