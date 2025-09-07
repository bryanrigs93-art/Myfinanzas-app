const form = document.getElementById("form");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const lista = document.getElementById("lista");
const saldoEl = document.getElementById("saldo");

const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");
const btnFiltrar = document.getElementById("btnFiltrar");
const btnReset = document.getElementById("btnReset");

// ✅ URL del Web App de Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";

// Proxy para GET (lectura con CORS)
const GET_PROXY = "https://api.allorigins.win/raw?url=";

let saldo = 0;
let movimientos = [];

// Función para formatear fecha corta
function formatFecha(fecha) {
  try {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return fecha;
  }
}

// Renderizar lista con botones de acción
function renderMovimientos(data) {
  lista.innerHTML = "";
  saldo = 0;

  data.reverse().forEach(item => {
    const li = document.createElement("li");
    li.classList.add(item.tipo);
    li.innerHTML = `
      <span>${formatFecha(item.fecha)} - ${item.descripcion} (${item.categoria})</span>
      <span>
        ${item.tipo === "ingreso" ? "+" : "-"}$${parseFloat(item.monto).toFixed(2)}
        <button class="edit" data-row="${item.row}">✏️</button>
        <button class="delete" data-row="${item.row}">❌</button>
      </span>
    `;
    lista.appendChild(li);

    saldo = item.tipo === "ingreso"
      ? saldo + parseFloat(item.monto)
      : saldo - parseFloat(item.monto);
  });

  saldoEl.textContent = saldo.toFixed(2);

  // --- Eventos de borrar
  document.querySelectorAll(".delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = btn.dataset.row;
      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "delete", row: parseInt(row) })
      });
      btn.closest("li").remove();
    });
  });

  // --- Eventos de editar
  document.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = btn.dataset.row;
      const nuevoDesc = prompt("Nueva descripción:");
      const nuevoMonto = parseFloat(prompt("Nuevo monto:"));
      const nuevaCat = prompt("Nueva categoría:");
      const nuevoTipo = prompt("Tipo (ingreso/gasto):", "ingreso");

      if (!nuevoDesc || isNaN(nuevoMonto)) return;

      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "edit",
          row: parseInt(row),
          descripcion: nuevoDesc,
          monto: nuevoMonto,
          categoria: nuevaCat,
          tipo: nuevoTipo
        })
      });

      btn.closest("li").querySelector("span").textContent =
        `${formatFecha(new Date())} - ${nuevoDesc} (${nuevaCat})`;
    });
  });
}

// --- Cargar datos ---
window.addEventListener("DOMContentLoaded", () => {
  fetch(GET_PROXY + encodeURIComponent(API_URL))
    .then(r => r.text())
    .then(txt => {
      movimientos = txt ? JSON.parse(txt) : [];
      renderMovimientos(movimientos);
    })
    .catch(err => console.error("⚠️ Error cargando datos:", err));
});

// --- Guardar movimiento ---
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const desc = descripcion.value.trim();
  const amount = parseFloat(monto.value);
  const tipoMov = tipo.value;
  const cat = categoria.value;

  if (!desc || isNaN(amount) || amount <= 0) {
    alert("Ingresa una descripción y un monto válidos");
    return;
  }

  const fechaHoy = new Date();
  const li = document.createElement("li");
  li.classList.add(tipoMov);
  li.innerHTML = `
    <span>${formatFecha(fechaHoy)} - ${desc} (${cat})</span>
    <span>
      ${tipoMov === "ingreso" ? "+" : "-"}$${amount.toFixed(2)}
      <button class="edit">✏️</button>
      <button class="delete">❌</button>
    </span>
  `;
  lista.insertBefore(li, lista.firstChild);

  saldo = tipoMov === "ingreso" ? saldo + amount : saldo - amount;
  saldoEl.textContent = saldo.toFixed(2);

  // Enviar a Sheets
  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      action: "add",
      descripcion: desc,
      monto: amount,
      categoria: cat,
      tipo: tipoMov
    })
  }).catch(err => console.error("❌ Error al guardar:", err));

  descripcion.value = "";
  monto.value = "";
  tipo.value = "ingreso";
  categoria.value = "General";
});

// --- Filtros por fecha ---
btnFiltrar.addEventListener("click", () => {
  const inicio = fechaInicio.value ? new Date(fechaInicio.value) : null;
  const fin = fechaFin.value ? new Date(fechaFin.value) : null;

  const filtrados = movimientos.filter(item => {
    const fechaItem = new Date(item.fecha);
    if (inicio && fechaItem < inicio) return false;
    if (fin && fechaItem > fin) return false;
    return true;
  });

  renderMovimientos(filtrados);
});

btnReset.addEventListener("click", () => {
  fechaInicio.value = "";
  fechaFin.value = "";
  renderMovimientos(movimientos);
});
