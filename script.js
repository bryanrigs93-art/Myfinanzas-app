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
const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";
const GET_PROXY = "https://api.allorigins.win/raw?url=";

let saldo = 0;
let movimientos = [];

/************ HELPERS ************/
function formatFecha(fecha) {
  try {
    if (!fecha) return "";
    if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(fecha)) {
      const d = new Date(fecha.replace(" ", "T"));
      if (!isNaN(d)) {
        return (
          d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
          " " +
          d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        );
      }
      return fecha;
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

  data.slice().reverse().forEach(item => {
    const idMostrar = item.id ? String(item.id) : `Fila ${item.row}`;
    const li = document.createElement("li");
    li.classList.add(item.tipo === "gasto" ? "gasto" : "ingreso");

    li.innerHTML = `
      <span>
        <strong>#${idMostrar}</strong> — ${formatFecha(item.fecha)} - ${item.descripcion} (${item.categoria})
      </span>
      <span>
        ${item.tipo === "ingreso" ? "+" : "-"}$${toMoney(item.monto)}
        <button class="edit" data-row="${item.row}">✏️</button>
        <button class="delete" data-row="${item.row}">❌</button>
      </span>
    `;
    lista.appendChild(li);

    const m = Number(item.monto);
    if (!isNaN(m)) {
      saldo = item.tipo === "ingreso" ? saldo + m : saldo - m;
    }
  });

  saldoEl.textContent = toMoney(saldo);

  // Borrar
  document.querySelectorAll(".delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = Number(btn.dataset.row);
      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "delete", row })
      }).catch(console.error);

      btn.closest("li")?.remove();
      setTimeout(() => cargar(), 500);
    });
  });

  // Editar
  document.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const row = Number(btn.dataset.row);
      const nuevoDesc = prompt("Nueva descripción:");
      if (!nuevoDesc) return;

      const nuevoMonto = Number(prompt("Nuevo monto:"));
      if (!isFinite(nuevoMonto) || nuevoMonto <= 0) return;

      const nuevaCat = prompt("Nueva categoría:", "General") || "General";
      const tipoVal = (prompt("Tipo (ingreso/gasto):", "ingreso") || "ingreso").toLowerCase() === "gasto" ? "gasto" : "ingreso";

      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "edit",
          row,
          descripcion: nuevoDesc.trim(),
          monto: nuevoMonto,
          categoria: nuevaCat,
          tipo: tipoVal
        })
      }).catch(console.error);

      setTimeout(() => cargar(), 500);
    });
  });
}

/************ DATA (GET con fallback) ************/
async function cargar() {
  try {
    let r = await fetch(API_URL, { cache: "no-store" });
    if (!r.ok) throw new Error("GET directo falló");
    const data = await r.json();
    movimientos = data || [];
    renderMovimientos(movimientos);
  } catch (e1) {
    try {
      const url = `${GET_PROXY}${encodeURIComponent(API_URL)}&cb=${Date.now()}`;
      const r2 = await fetch(url);
      const txt = await r2.text();
      movimientos = txt ? JSON.parse(txt) : [];
      renderMovimientos(movimientos);
    } catch (e2) {
      console.error("⚠️ Error cargando datos:", e1, e2);
      lista.innerHTML = `<li class="ingreso"><span>⚠️ No se pudo cargar datos.</span></li>`;
    }
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

  setTimeout(() => cargar(), 700);

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
    const d = typeof item.fecha === "string" && item.fecha.includes(" ")
      ? new Date(item.fecha.replace(" ", "T"))
      : new Date(item.fecha);
    if (inicio && d < inicio) return false;
    if (fin && d > fin) return false;
    return true;
  });

  renderMovimientos(filtrados);
});

btnReset.addEventListener("click", () => {
  fechaInicio.value = "";
  fechaFin.value = "";
  renderMovimientos(movimientos);
});
