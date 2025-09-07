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

// ✅ URL del Web App desplegado en Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";
const GET_PROXY = "https://api.allorigins.win/raw?url=";

let saldo = 0;
let movimientos = [];

// Formatear fecha
function formatFecha(fecha) {
  try {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  } catch {
    return fecha;
  }
}

// Renderizar lista
function renderMovimientos(data) {
  lista.innerHTML = "";
  saldo = 0;

  data.slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.classList.add(item.tipo);
    li.innerHTML = `
      <span>${formatFecha(item.fecha)} - ${item.descripcion} (${item.categoria})</span>
      <span>
        ${item.tipo === "ingreso" ? "+" : "-"}$${parseFloat(item.monto).toFixed(2)}
        <button class="edit" data-id="${item.id}">✏️</button>
        <button class="delete" data-id="${item.id}">❌</button>
      </span>
    `;
    lista.appendChild(li);

    const montoNum = parseFloat(item.monto);
    if (!isNaN(montoNum)) {
      saldo = item.tipo === "ingreso" ? saldo + montoNum : saldo - montoNum;
    }
  });

  saldoEl.textContent = saldo.toFixed(2);

  // Eventos borrar
  document.querySelectorAll(".delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "delete", id })
      });
      btn.closest("li").remove();
    });
  });

  // Eventos editar
  document.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
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
          id,
          descripcion: nuevoDesc,
          monto: nuevoMonto,
          categoria: nuevaCat,
          tipo: nuevoTipo
        })
      });

      // Actualizar en UI rápido
      btn.closest("li").querySelector("span").textContent =
        `${formatFecha(new Date())} - ${nuevoDesc} (${nuevaCat})`;
    });
  });
}

// Cargar desde backend
async function cargar() {
  try {
    const r = await fetch(GET_PROXY + encodeURIComponent(API_URL));
    const txt = await r.text();
    movimientos = txt ? JSON.parse(txt) : [];
    renderMovimientos(movimientos);
  } catch (err) {
    console.error("⚠️ Error cargando datos:", err);
  }
}

window.addEventListener("DOMContentLoaded", cargar);

// Guardar movimiento
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

  setTimeout(() => cargar(), 800);

  descripcion.value = "";
  monto.value = "";
  tipo.value = "ingreso";
  categoria.value = "General";
});

// Filtros
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
