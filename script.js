// URL del backend desplegado
const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";

// Cargar movimientos desde el backend
async function cargar() {
  try {
    let res = await fetch(API_URL);
    if (!res.ok) throw new Error("Fallo directo, probando con AllOrigins");

    let data = await res.json();
    renderMovimientos(data);
  } catch (err) {
    console.warn("Usando proxy AllOrigins...");
    let res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(API_URL)}`);
    let data = await res.json();
    renderMovimientos(data);
  }
}

// Renderizar lista de movimientos
function renderMovimientos(data) {
  const lista = document.getElementById("movimientos");
  const saldoElem = document.getElementById("saldo");
  lista.innerHTML = "";

  let saldo = 0;

  data.forEach(item => {
    const monto = Number(item.monto) || 0;
    saldo += (item.tipo === "ingreso" ? monto : -monto);

    const li = document.createElement("li");
    li.className = "movimiento";

    li.innerHTML = `
      <div>
        <strong>${item.id || "#?"}</strong> — ${item.fecha} - ${item.descripcion} (${item.categoria})
        ${item.extra ? `[${item.extra}]` : ""}
      </div>
      <div class="acciones">
        <span class="${item.tipo === "ingreso" ? "positivo" : "negativo"}">
          ${item.tipo === "ingreso" ? "+" : "-"}$${monto.toFixed(2)}
        </span>
        <button onclick="editar('${item.id}')">✏️</button>
        <button onclick="eliminar('${item.id}')">❌</button>
      </div>
    `;
    lista.appendChild(li);
  });

  saldoElem.textContent = `$${saldo.toFixed(2)}`;
}

// Agregar movimiento
function agregar(e) {
  e.preventDefault();
  const desc = document.getElementById("descripcion").value.trim();
  const monto = parseFloat(document.getElementById("monto").value);
  const tipo = document.getElementById("tipo").value;
  const cat = document.getElementById("categoria").value;
  const extra = document.getElementById("extra").value.trim();

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      action: "add",
      descripcion: desc,
      monto,
      categoria: cat,
      tipo,
      extra
    })
  });

  setTimeout(cargar, 700);
  e.target.reset();
}

// Editar movimiento
function editar(id) {
  const nuevoDesc = prompt("Nueva descripción:");
  if (!nuevoDesc) return;

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ action: "edit", id, descripcion: nuevoDesc })
  });

  setTimeout(cargar, 700);
}

// Eliminar movimiento
function eliminar(id) {
  if (!confirm("¿Eliminar este movimiento?")) return;

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ action: "delete", id })
  });

  setTimeout(cargar, 700);
}

// Filtrar movimientos por fecha
function filtrar() {
  const desde = document.getElementById("desde").value;
  const hasta = document.getElementById("hasta").value;

  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      let filtrados = data;
      if (desde) filtrados = filtrados.filter(m => m.fecha >= desde);
      if (hasta) filtrados = filtrados.filter(m => m.fecha <= hasta);
      renderMovimientos(filtrados);
    });
}

// Reset filtro
function resetFiltro() {
  document.getElementById("desde").value = "";
  document.getElementById("hasta").value = "";
  cargar();
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form").addEventListener("submit", agregar);
  document.getElementById("filtrar").addEventListener("click", filtrar);
  document.getElementById("reset").addEventListener("click", resetFiltro);
  cargar();
});
