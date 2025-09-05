const form = document.getElementById("form");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const lista = document.getElementById("lista");
const saldoEl = document.getElementById("saldo");

// ✅ Tu Web App
const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";

// Proxy para GET (lectura de datos con CORS)
const GET_PROXY = "https://api.allorigins.win/raw?url=";

let saldo = 0;

// --- Cargar datos existentes ---
window.addEventListener("DOMContentLoaded", () => {
  fetch(GET_PROXY + encodeURIComponent(API_URL))
    .then(r => r.text())
    .then(txt => {
      const data = txt ? JSON.parse(txt) : [];
      lista.innerHTML = "";
      saldo = 0;

      data.forEach(item => {
        const li = document.createElement("li");
        li.classList.add(item.tipo);
        li.innerHTML = `
          <span>${item.descripcion} (${item.categoria})</span>
          <span>${item.tipo === "ingreso" ? "+" : "-"}$${item.monto}</span>
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

  // Pintar en UI
  const li = document.createElement("li");
  li.classList.add(tipoMov);
  li.innerHTML = `
    <span>${desc} (${cat})</span>
    <span>${tipoMov === "ingreso" ? "+" : "-"}$${amount}</span>
  `;
  lista.appendChild(li);

  saldo = tipoMov === "ingreso" ? saldo + amount : saldo - amount;
  saldoEl.textContent = saldo.toFixed(2);

  // Enviar a Sheets con no-cors (no podremos leer la respuesta, pero se guarda)
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

