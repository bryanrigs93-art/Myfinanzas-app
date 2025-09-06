const form = document.getElementById("form");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const lista = document.getElementById("lista");
const saldoEl = document.getElementById("saldo");
const filtroFecha = document.getElementById("filtro-fecha"); // ✅ campo para Flatpickr

// ✅ Tu Web App (Apps Script)
const API_URL = "TU_URL_DEPLOY_DE_APPS_SCRIPT";

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
    <span>${escapeHtml(item.descripcion)} (${escapeHtml(item.categoria)}) - <small>${escapeHtml(item.fecha)}</small></span>
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
        fecha: item.fecha,
        descripcion: item.descripcion,
        monto: amount,
        categoria: item.categoria,
        tipo: item.tipo
      })
    }).catch(err => console.error("❌ Error eliminando:", err));
  });

  // ✅ Mostrar siempre arriba
  lista.prepend(li);
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

  // ✅ Fecha automática (dd/MM/yyyy)
  const fecha = new Date().toLocaleDateString("es-ES");

  const item = { fecha, descripcion: desc, monto: amount, categoria: cat, tipo: tipoMov };
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

// --- Filtro con calendario (Flatpickr en modo rango) ---
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

// Mostrar todo (cuando se borra el rango)
function mostrarTodo() {
  const items = lista.querySelectorAll("li");
  items.forEach(li => li.style.display = "flex");
}

// Función de filtrado por rango
function filtrarPorRango(fechaInicio, fechaFin) {
  const items = lista.querySelectorAll("li");
  items.forEach(li => {
    const texto = li.querySelector("span").innerText;
    const regex = /(\d{1,2}\/\d{1,2}\/\d{4})/;
    const match = texto.match(regex);

    if (match) {
      const partes = match[1].split("/");
      const fechaItem = new Date(partes[2], partes[1] - 1, partes[0]); // dd/mm/yyyy → Date

      if (fechaItem >= fechaInicio && fechaItem <= fechaFin) {
        li.style.display = "flex"; // dentro del rango
      } else {
        li.style.display = "none"; // fuera del rango
      }
    }
  });
}
