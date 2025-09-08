const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";
const GET_PROXY = "https://api.allorigins.win/raw?url=";

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

let saldo = 0;
let movimientos = [];

function formatFecha(f) {
  if (!f) return "";
  const d = new Date(f.replace(" ", "T"));
  return d.toLocaleDateString("es-ES") + " " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
function toMoney(n) {
  const v = Number(n);
  return isNaN(v) ? "0.00" : v.toFixed(2);
}

function renderMovimientos(data) {
  lista.innerHTML = "";
  saldo = 0;

  data.slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.classList.add(item.tipo === "gasto" ? "gasto" : "ingreso");
    li.innerHTML = `
      <span><strong>Fila ${item.row}</strong> — ${formatFecha(item.fecha)} - ${item.descripcion} (${item.categoria})</span>
      <span>
        ${item.tipo === "ingreso" ? "+" : "-"}$${toMoney(item.monto)}
        <button class="edit" data-row="${item.row}">✏️</button>
        <button class="delete" data-row="${item.row}">❌</button>
      </span>`;
    lista.appendChild(li);

    const m = Number(item.monto);
    if (!isNaN(m)) {
      saldo = item.tipo === "ingreso" ? saldo + m : saldo - m;
    }
  });

  saldoEl.textContent = toMoney(saldo);

  document.querySelectorAll(".delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = Number(btn.dataset.row);
      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "delete", row })
      });
      btn.closest("li")?.remove();
      setTimeout(() => cargar(), 500);
    });
  });

  document.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = Number(btn.dataset.row);
      const item = movimientos.find(x => x.row === row);
      if (!item) return;
      const nuevoDesc = prompt("Nueva descripción:", item.descripcion);
      const nuevoMonto = Number(prompt("Nuevo monto:", item.monto));
      const nuevaCat = prompt("Nueva categoría:", item.categoria);
      const nuevoTipo = prompt("Tipo (ingreso/gasto):", item.tipo);

      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "edit", row,
          descripcion: nuevoDesc,
          monto: nuevoMonto,
          categoria: nuevaCat,
          tipo: nuevoTipo
        })
      });
      setTimeout(() => cargar(), 600);
    });
  });
}

async function cargar() {
  try {
    const url = `${GET_PROXY}${encodeURIComponent(API_URL)}&cb=${Date.now()}`;
    const r = await fetch(url);
    const raw = await r.json();
    movimientos = raw;
    renderMovimientos(movimientos);
  } catch (e) {
    console.error("Error al cargar:", e);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const desc = descripcion.value.trim();
  const amount = Number(monto.value);
  if (!desc || !isFinite(amount) || amount <= 0) {
    alert("Completa descripción y monto válido");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      action: "add",
      descripcion: desc,
      monto: amount,
      categoria: categoria.value,
      tipo: tipo.value
    })
  });

  setTimeout(() => cargar(), 700);

  descripcion.value = "";
  monto.value = "";
  tipo.value = "ingreso";
  categoria.value = "General";
});

btnFiltrar.addEventListener("click", () => {
  const desde = fechaInicio.value ? new Date(fechaInicio.value) : null;
  const hasta = fechaFin.value ? new Date(fechaFin.value) : null;

  const filtrados = movimientos.filter(item => {
    const f = new Date(item.fecha.replace(" ", "T"));
    return (!desde || f >= desde) && (!hasta || f <= hasta);
  });

  renderMovimientos(filtrados);
});

btnReset.addEventListener("click", () => {
  fechaInicio.value = "";
  fechaFin.value = "";
  renderMovimientos(movimientos);
});

window.addEventListener("DOMContentLoaded", cargar);
