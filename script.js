/************ DOM ************/
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

/************ CONFIG ************/
// URL del Web App de Google Apps Script (deploy ID que me diste)
const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";
// Proxy para evitar CORS en GET
const GET_PROXY = "https://api.allorigins.win/raw?url=";

let saldo = 0;
let movimientos = [];

/************ HELPERS ************/
function formatFecha(fecha) {
  try {
    if (!fecha) return "";
    // Si llega como "yyyy-MM-dd HH:mm", convierto a ISO amigable para Date
    if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(fecha)) {
      const iso = fecha.replace(" ", "T"); // "2025-09-07T16:35"
      const d = new Date(iso);
      if (!isNaN(d)) {
        return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
               " " +
               d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      }
      return fecha; // fallback
    }
    const d = new Date(fecha);
    if (!isNaN(d)) {
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    return String(fecha);
  } catch {
    return String(fecha ?? "");
  }
}

function toMoney(n) {
  const v = Number(n);
  return isNaN(v) ? "0.00" : v.toFixed(2);
}

/************ RENDER ************/
function renderMovimientos(data) {
  lista.innerHTML = "";
  saldo = 0;

  // Mostrar últimos arriba
  data.slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.classList.add(item.tipo === "gasto" ? "gasto" : "ingreso");

    li.innerHTML = `
      <span>
        <strong>#${item.id}</strong> — ${formatFecha(item.fecha)} - ${item.descripcion} (${item.categoria})
      </span>
      <span>
        ${item.tipo === "ingreso" ? "+" : "-"}$${toMoney(item.monto)}
        <button class="edit" data-id="${item.id}">✏️</button>
        <button class="delete" data-id="${item.id}">❌</button>
      </span>
    `;

    lista.appendChild(li);

    const m = Number(item.monto);
    if (!isNaN(m)) {
      saldo = item.tipo === "ingreso" ? saldo + m : saldo - m;
    }
  });

  saldoEl.textContent = toMoney(saldo);

  // Acciones: borrar
  document.querySelectorAll(".delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      // Enviamos POST en modo no-cors (no podemos leer respuesta)
      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "delete", id })
      }).catch(console.error);

      // Remover rápido de UI y luego refrescar desde backend
      btn.closest("li")?.remove();
      setTimeout(() => cargar(), 500);
    });
  });

  // Acciones: editar
  document.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const nuevoDesc = prompt("Nueva descripción:");
      if (!nuevoDesc) return;

      const nuevoMontoStr = prompt("Nuevo monto:");
      const nuevoMonto = Number(nuevoMontoStr);
      if (!isFinite(nuevoMonto) || nuevoMonto <= 0) return;

      const nuevaCat = prompt("Nueva categoría:", "General") || "General";
      const nuevoTipo = prompt("Tipo (ingreso/gasto):", "ingreso");
      const tipoVal = (nuevoTipo || "").toLowerCase() === "gasto" ? "gasto" : "ingreso";

      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "edit",
          id,
          descripcion: nuevoDesc.trim(),
          monto: nuevoMonto,
          categoria: nuevaCat,
          tipo: tipoVal
        })
      }).catch(console.error);

      // Refrescar desde backend para ver cambios (incluye fecha actualizada)
      setTimeout(() => cargar(), 500);
    });
  });
}

/************ DATA ************/
async function cargar() {
  try {
    // Cache-bust para evitar respuestas cacheadas del proxy
    const url = `${GET_PROXY}${encodeURIComponent(API_URL)}&cb=${Date.now()}`;
    const r = await fetch(url);
    const txt = await r.text();
    movimientos = txt ? JSON.parse(txt) : [];
    renderMovimientos(movimientos);
  } catch (err) {
    console.error("⚠️ Error cargando datos:", err);
  }
}

/************ INIT ************/
window.addEventListener("DOMContentLoaded", cargar);

/************ FORM ************/
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const desc = descripcion.value.trim();
  const amount = Number(monto.value);
  const tipoMov = tipo.value;
  const cat = categoria.value;

  if (!desc || !isFinite(amount) || amount <= 0) {
    alert("Ingresa una descripción y un monto válidos");
    return;
  }

  // Enviamos el POST en no-cors (evita problemas CORS). El backend lo procesa,
  // y luego recargamos con GET por el proxy para ver el ID y la fecha.
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

  // Pequeño delay para que el backend escriba en la hoja y luego recargamos
  setTimeout(() => cargar(), 700);

  // Reset UI
  descripcion.value = "";
  monto.value = "";
  tipo.value = "ingreso";
  categoria.value = "General";
});

/************ FILTROS ************/
btnFiltrar.addEventListener("click", () => {
  const inicio = fechaInicio.value ? new Date(fechaInicio.value) : null;
  const fin = fechaFin.value ? new Date(fechaFin.value) : null;

  const filtrados = movimientos.filter(item => {
    const fechaItem = (() => {
      if (typeof item.fecha === "string" && item.fecha.includes(" ")) {
        return new Date(item.fecha.replace(" ", "T"));
      }
      return new Date(item.fecha);
    })();

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
