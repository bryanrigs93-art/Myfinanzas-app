const form = document.getElementById("form");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const lista = document.getElementById("lista");
const saldoEl = document.getElementById("saldo");

// ✅ URL del Web App de Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";

// Proxy para GET (lectura con CORS)
const GET_PROXY = "https://api.allorigins.win/raw?url=";

let saldo = 0;

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

// --- Cargar datos existentes ---
window.addEventListener("DOMContentLoaded", () => {
  fetch(GET_PROXY + encodeURIComponent(API_URL))
    .then(r => r.text())
    .then(txt => {
      const data = txt ? JSON.parse(txt) : [];
      lista.innerHTML = "";
      saldo = 0;

      // ✅ Mostrar primero los más recientes
      data.reverse().forEach(item => {
        const li = document.createElement("li");
        li.classList.add(item.tipo);
        li.innerHTML = `
          <span>${formatFecha(item.fecha)} - ${item.descripcion} (${item.categoria})</span>
          <span>${item.tipo === "ingreso" ? "+" : "-"}$${parseFloat(item.monto).toFixed(2)}</span>
        `;
        lista.appendChild(li);

        saldo = item.tipo === "ingreso"
          ? saldo + parseFloat(item.monto)
          : saldo - parseFloat(item.monto);
      });

      saldoEl.textContent = saldo.toFixed(2);
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

  // ✅ Crear movimiento con fecha actual y ponerlo arriba
  const fechaHoy = new Date();
  const li = document.createElement("li");
  li.classList.add(tipoMov);
  li.innerHTML = `
    <span>${formatFecha(fechaHoy)} - ${desc} (${cat})</span>
    <span>${tipoMov === "ingreso" ? "+" : "-"}$${amount.toFixed(2)}</span>
  `;
  lista.insertBefore(li, lista.firstChild);

  saldo = tipoMov === "ingreso" ? saldo + amount : saldo - amount;
  saldoEl.textContent = saldo.toFixed(2);

  // Enviar a Sheets (modo no-cors)
  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      descripcion: desc,
      monto: amount,
      categoria: cat,
      tipo: tipoMov
    })
  }).catch(err => console.error("❌ Error al guardar:", err));

  // Reset form
  descripcion.value = "";
  monto.value = "";
  tipo.value = "ingreso";
  categoria.value = "General";
});
