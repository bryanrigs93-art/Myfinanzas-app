function renderMovimientos(data) {
  lista.innerHTML = "";
  saldo = 0;

  data.slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.classList.add(item.tipo);
    li.innerHTML = `
      <span>
        <strong>#${item.id}</strong> — ${formatFecha(item.fecha)} - ${item.descripcion} (${item.categoria})
      </span>
      <span>
        ${item.tipo === "ingreso" ? "+" : "-"}$${parseFloat(item.monto).toFixed(2)}
        <button class="edit" data-id="${item.id}">✏️</button>
        <button class="delete" data-id="${item.id}">❌</button>
      </span>
    `;
    lista.appendChild(li);

    const montoNum = parseFloat(item.monto);
    if (!isNaN(montoNum)) {
      saldo = item.tipo === "ingreso" ? saldo + montoNum : saldo - montoNum;
    }
  });

  saldoEl.textContent = saldo.toFixed(2);

  // Borrar
  document.querySelectorAll(".delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "delete", id })
      }).catch(console.error);

      // Quitar rápido de la UI y refrescar saldo desde backend
      btn.closest("li").remove();
      setTimeout(() => cargar(), 500);
    });
  });

  // Editar
  document.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const nuevoDesc = prompt("Nueva descripción:");
      const nuevoMonto = parseFloat(prompt("Nuevo monto:"));
      const nuevaCat = prompt("Nueva categoría:");
      const nuevoTipo = prompt("Tipo (ingreso/gasto):", "ingreso");

      if (!nuevoDesc || isNaN(nuevoMonto)) return;

      fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "edit",
          id,
          descripcion: nuevoDesc,
          monto: nuevoMonto,
          categoria: nuevaCat,
          tipo: nuevoTipo
        })
      }).catch(console.error);

      // Refrescar desde backend para ver cambios (incluye fecha actualizada)
      setTimeout(() => cargar(), 500);
    });
  });
}
