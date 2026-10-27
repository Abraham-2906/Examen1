import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

/**
 * [F2] Listado y paginación.
 */
export const cargarPagina = async (pagina = 1) => {
  $lista.setAttribute("aria-busy", "true");

  try {
    const respuesta = await listarEquipos(pagina, POR_PAGINA);
    const { data: equipos, meta } = respuesta;

    paginaActual = meta.current_page;
    ultimaPagina = meta.last_page;

    // Vaciar lista
    $lista.replaceChildren();

    if (!equipos || equipos.length === 0) {
      const liVacio = document.createElement("li");
      liVacio.className = "vacio";
      liVacio.textContent = "No hay equipos registrados.";
      $lista.appendChild(liVacio);
    } else {
      equipos.forEach((equipo) => {
        const clon = $plantilla.content.cloneNode(true);
        const li = clon.querySelector("li");

        if (li) {
          li.dataset.id = equipo.id;
        }

        const elCodigo = clon.querySelector(".codigo");
        if (elCodigo) elCodigo.textContent = equipo.codigo;

        const elNombre = clon.querySelector(".nombre");
        if (elNombre) elNombre.textContent = equipo.nombre;

        const elCategoria = clon.querySelector(".categoria");
        if (elCategoria) {
          elCategoria.textContent = equipo.categoria?.nombre ?? "";
        }

        const elFecha = clon.querySelector(".fecha");
        if (elFecha) {
          elFecha.textContent = formatearFecha(equipo.fecha_adquisicion);
        }

        const elEstado = clon.querySelector(".estado");
        if (elEstado) {
          elEstado.textContent = equipo.estado;
          elEstado.dataset.estado = equipo.estado;
        }

        $lista.appendChild(clon);
      });
    }

    if ($resumen) {
      const from = meta.from ?? 0;
      const to = meta.to ?? 0;
      const total = meta.total ?? 0;
      $resumen.textContent = `Mostrando ${from}–${to} de ${total}`;
    }

    if ($paginaActual) {
      $paginaActual.textContent = `Página ${meta.current_page} de ${meta.last_page}`;
    }

    if ($btnAnterior) {
      $btnAnterior.disabled = meta.current_page <= 1;
    }

    if ($btnSiguiente) {
      $btnSiguiente.disabled = meta.current_page >= meta.last_page;
    }
  } catch (error) {
    mostrarMensaje("error", error.message || "Error al cargar los equipos.");
  } finally {
    $lista.removeAttribute("aria-busy");
  }
};

/**
 * [F4] Eliminación con manejo de reglas de negocio.
 */
const alHacerClicEnLista = async (evento) => {
  const btn = evento.target.closest(".btn-eliminar");
  if (!btn) return;

  const li = btn.closest("li");
  const id = li?.dataset.id;
  if (!id) return;

  if (!confirm("¿Está seguro de que desea eliminar este equipo?")) {
    return;
  }

  try {
    await eliminarEquipo(id);
    mostrarMensaje("exito", "Equipo eliminado.");

    // Si era el único equipo visible en la página actual y no estamos en la primera, retroceder
    const equiposEnLista = $lista.querySelectorAll("li:not(.vacio)");
    if (equiposEnLista.length <= 1 && paginaActual > 1) {
      await cargarPagina(paginaActual - 1);
    } else {
      await cargarPagina(paginaActual);
    }
  } catch (error) {
    if (error.status === 409 && error.datos?.mensaje) {
      mostrarMensaje("error", error.datos.mensaje);
    } else {
      mostrarMensaje("error", error.message || "Error al eliminar el equipo.");
    }
  }
};

export const iniciarListado = () => {
  $lista.addEventListener("click", alHacerClicEnLista);

  $btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) {
      cargarPagina(paginaActual - 1);
    }
  });

  $btnSiguiente.addEventListener("click", () => {
    if (paginaActual < ultimaPagina) {
      cargarPagina(paginaActual + 1);
    }
  });

  cargarPagina(1);
};