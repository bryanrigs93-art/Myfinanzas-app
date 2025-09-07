@@ -36,61 +36,63 @@ function formatFecha(fecha) {
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
    // Algunos backends envían la clave como "ID" en vez de "id"
    const id = item.id ?? item.ID ?? item.Id ?? "";
    const li = document.createElement("li");
    li.classList.add(item.tipo === "gasto" ? "gasto" : "ingreso");

    li.innerHTML = `
      <span>
        <strong>#${item.id}</strong> — ${formatFecha(item.fecha)} - ${item.descripcion} (${item.categoria})
        <strong>#${id}</strong> — ${formatFecha(item.fecha)} - ${item.descripcion} (${item.categoria})
      </span>
      <span>
        ${item.tipo === "ingreso" ? "+" : "-"}$${toMoney(item.monto)}
        <button class="edit" data-id="${item.id}">✏️</button>
        <button class="delete" data-id="${item.id}">❌</button>
        <button class="edit" data-id="${id}">✏️</button>
        <button class="delete" data-id="${id}">❌</button>
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
@@ -118,51 +120,58 @@ function renderMovimientos(data) {
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
    const raw = txt ? JSON.parse(txt) : [];

    // Normalizar IDs para que siempre exista la clave en minúsculas
    movimientos = raw.map((m, idx) => ({
      ...m,
      id: m.id ?? m.ID ?? m.Id ?? (idx + 1)
    }));

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