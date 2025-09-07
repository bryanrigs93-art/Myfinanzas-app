const form = document.getElementById("form");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const lista = document.getElementById("lista");
const saldoEl = document.getElementById("saldo");

const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";

let saldo = 0;

function crearMovimiento(item) {
  const li = document.createElement("li");
  li.classList.add(item.tipo);
  li.innerHTML = `
    <span>${item.descripcion} (${item.categoria}) - <small>${item.fecha}</small></span>
    <span>${item.tipo === "ingreso" ? "+" : "-"}$${Number(item.monto).toFixed(2)}</span>
  `;
  lista.prepend(li);
}

// Cargar al iniciar
window.addEventListener("DOMContentLoaded", () => {
  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      lista.innerHTML = "";
      saldo = 0;

      data.forEach(item => {
        crearMovimiento(item);
        saldo = item.tipo === "ingreso"
          ? saldo + Number(item.monto)
          : saldo - Number(item.monto);
      });

      saldoEl.textContent = saldo.toFixed(2);
    })
    .catch(err => console.error("⚠️ Error cargando:", err));
});

// Guardar
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

  const fecha = new Date().toLocaleDateString("es-ES");
  const item = { fecha, descripcion: desc, monto: amount, categoria: cat, tipo: tipoMov };

  crearMovimiento(item);
  saldo = tipoMov === "ingreso" ? saldo + amount : saldo - amount;
  saldoEl.textContent = saldo.toFixed(2);

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
