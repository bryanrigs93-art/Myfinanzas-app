const baseUrl = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";
let itemsCache = [];

async function cargar() {
  try {
    const resp = await fetch(baseUrl);
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    itemsCache = await resp.json();
    renderizar(itemsCache);
  } catch {
    console.warn("GET directo falló, probando fallback...");
    const fallback = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;
    const resp = await fetch(fallback);
    itemsCache = await resp.json();
    renderizar(itemsCache);
  }
}

function renderizar(items) {
  const lista = document.getElementById("transacciones");
  lista.innerHTML = "";
  items.forEach(({ row, fecha, descripcion, monto, categoria, tipo }) => {
    const signo = tipo === "ingreso" ? "+" : "-";
    const montoStr = Number(monto).toFixed(2);
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${fecha} — ${descripcion} (${categoria}) ${signo}$${montoStr}</span>
      <button data-row="${row}" onclick="editar(${row})">✏️</button>
      <button data-row="${row}" onclick="borrar(${row})">❌</button>
    `;
    lista.appendChild(li);
  });
}

async function postAction(action, row = null, data = {}) {
  const payload = { action, row, ...data };
  await fetch(baseUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  setTimeout(cargar, 600);
}

function agregar() {
  const fecha = document.getElementById("fecha").value;
  const descripcion = document.getElementById("descripcion").value;
  const monto = parseFloat(document.getElementById("monto").value);
  const categoria = document.getElementById("categoria").value;
  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  postAction("add", null, { fecha, descripcion, monto, categoria, tipo });
}

function editar(row) {
  const idx = itemsCache.findIndex(i => i.row === row);
  if (idx === -1) return alert("Fila no encontrada");
  const item = itemsCache[idx];
  const nuevaDesc = prompt("Descripción:", item.descripcion);
  if (nuevaDesc === null) return;
  postAction("edit", row, {
    fecha: item.fecha,
    descripcion: nuevaDesc,
    monto: item.monto,
    categoria: item.categoria,
    tipo: item.tipo
  });
}

function borrar(row) {
  if (confirm("¿Borrar transacción en fila " + row + "?")) {
    postAction("delete", row);
  }
}

function filtrar() {
  const desde = document.getElementById("fdesde").valueAsDate;
  const hasta = document.getElementById("fhasta").valueAsDate;
  const filtrado = itemsCache.filter(i => {
    const f = new Date(i.fecha);
    return (!desde || f >= desde) && (!hasta || f <= hasta);
  });
  renderizar(filtrado);
}

window.addEventListener("load", () => {
  cargar();
  document.getElementById("agregarBtn").onclick = agregar;
  document.getElementById("filtrarBtn").onclick = filtrar;
});
