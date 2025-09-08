const baseUrl = "https://script.google.com/macros/s/…/exec"; // tu URL Web App

async function cargar() {
  let url = baseUrl;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("HTTP error " + resp.status);
    const data = await resp.json();
    renderizar(data);
  } catch (err) {
    console.warn("GET directo falló, intentando AllOrigins:", err);
    const fallback = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const resp = await fetch(fallback);
    const data = await resp.json();
    renderizar(data);
  }
}

function renderizar(items) {
  const lista = document.getElementById("transacciones");
  lista.innerHTML = "";
  items.forEach(item => {
    const monto = parseFloat(item.monto).toFixed(2);
    const signo = item.tipo === "ingreso" ? "+" : "-";
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.fecha} — ${item.descripcion} (${item.categoria}) ${signo}$${monto}</span>
      <button data-row="${item.row}" onclick="editar(${item.row})">✏️</button>
      <button data-row="${item.row}" onclick="borrar(${item.row})">❌</button>
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
  const nuevaDesc = prompt("Nueva descripción:");
  // ...otros prompts u inputs...
  if (nuevaDesc !== null) {
    // usar otros valores desde inputs o prompts
    postAction("edit", row, {
      fecha: new Date().toISOString(),
      descripcion: nuevaDesc,
      monto: 0,
      categoria: "General",
      tipo: "gasto"
    });
  }
}

function borrar(row) {
  if (confirm("¿Borrar transacción en fila " + row + "?")) {
    postAction("delete", row);
  }
}

// Filtros (ejemplo sencillo)
function filtrar() {
  const desde = new Date(document.getElementById("fdesde").value);
  const hasta = new Date(document.getElementById("fhasta").value);
  // Asume que cargar() y renderizar() usan variables globales items
  const filtrados = window.currentItems.filter(item => {
    const f = new Date(item.fecha);
    return (!desde || f >= desde) && (!hasta || f <= hasta);
  });
  renderizar(filtrados);
}

window.addEventListener("load", () => {
  cargar();
  document.getElementById("agregarBtn").onclick = agregar;
  document.getElementById("filtrarBtn").onclick = filtrar;
});
