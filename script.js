const form = document.getElementById("form");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const lista = document.getElementById("lista");
const saldoEl = document.getElementById("saldo");

const API_URL = "https://script.google.com/macros/s/AKfycbyPkz8A_cX-7G6m6sA5yqXTAmd1ci8xAxQ3A2zWjbDLmfWIJRwne16oXWZCE4cH9cbu/exec";
const GET_PROXY = "https://api.allorigins.win/raw?url=";

let saldo = 0;

function cargarDatos() {
  fetch(GET_PROXY + encodeURIComponent(API_URL))
    .then(r => r.text())
    .then(txt => {
      const data = txt ? JSON.parse(txt) : [];
      lista.innerHTML = "";
      saldo = 0;

      data.forEach(item => {
        const li = document.createElement("li");
        li.classList.add(item.tipo);

        const idFormat = item.id ? item.id.replace(/^A/, "ID: #") : "";

        li.innerHTML = `
          <div>
            <strong>${idFormat}</strong><br>
            ${item.descripcion} (${item.categoria})
          </div>
          <div>
            <span>${item.tipo === "ingreso" ? "+" : "-"}$${item.monto}</span>
            <button class="delete-btn">🗑️</button>
          </div>
        `;

        // Botón borrar
        li.querySelector(".delete-btn").addEventListener("click", () => {
          if (confirm("¿Seguro que deseas eliminar este movimiento?")) {
            fetch(API_URL, {
              method: "POST",
              mode: "no-cors",
              body: JSON.stringify({ action: "delete", id: item.id })
            }).catch(err => console.error("❌ Error al borrar:", err));

            li.remove();
          }
        });

        lista.appendChild(li);

        saldo = item.tipo === "ingreso"
          ? saldo + parseFloat(item.monto)
          : saldo - parseFloat(item.monto);
      });

      saldoEl.textContent = saldo.toFixed(2);
    })
    .catch(err => console.error("⚠️ Error cargando datos:", err));
}

window.addEventListener("DOMContentLoaded", cargarDatos);

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
      descripcion: desc,
      monto: amount,
      categoria: cat,
      tipo: tipoMov
    })
  }).catch(err => console.error("❌ Error al guardar:", err));

  descripcion.value = "";
  monto.value = "";
  tipo.value = "ingreso";
  categoria.value = "General";

  setTimeout(cargarDatos, 1000);
});
