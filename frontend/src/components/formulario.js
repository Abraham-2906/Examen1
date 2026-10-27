import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

/**
 * [F3] Formulario de registro de equipos.
 */
export const iniciarFormulario = ({ alGuardar }) => {
  // 1. Cargar las categorías en el <select>
  const cargarCategorias = async () => {
    try {
      const respuesta = await listarCategorias();
      const categorias = respuesta?.data || respuesta || [];

      categorias.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.nombre;
        $selectCategoria.appendChild(option);
      });
    } catch (error) {
      mostrarMensaje("error", error.message || "Error al cargar las categorías.");
    }
  };

  cargarCategorias();

  // 2. Manejo del evento submit
  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    // Limpiar errores anteriores
    $form.querySelectorAll("[data-error]").forEach((el) => {
      el.textContent = "";
    });
    $form.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
    });

    // Construir objeto de datos
    const formData = new FormData($form);
    const datos = Object.fromEntries(formData.entries());

    // Convertir campos numéricos solo si no vienen vacíos (para permitir que 422 valide campos requeridos)
    if (datos.categoria_id !== "") {
      datos.categoria_id = Number(datos.categoria_id);
    }
    if (datos.costo_interno !== "") {
      datos.costo_interno = Number(datos.costo_interno);
    }
    if (!datos.estado) {
      delete datos.estado;
    }

    // Estado de carga en el botón
    const textoOriginal = $btnGuardar.textContent;
    $btnGuardar.disabled = true;
    $btnGuardar.textContent = "Guardando…";

    try {
      const respuesta = await crearEquipo(datos);
      $form.reset();

      const codigo = respuesta?.data?.codigo || datos.codigo;
      mostrarMensaje("exito", `Equipo ${codigo} registrado.`);

      if (typeof alGuardar === "function") {
        alGuardar();
      }
    } catch (error) {
      if (error.status === 422 && error.datos?.errors) {
        Object.entries(error.datos.errors).forEach(([campo, mensajes]) => {
          const primerMensaje = Array.isArray(mensajes) ? mensajes[0] : mensajes;
          const pError = $form.querySelector(`[data-error="${campo}"]`);
          if (pError) {
            pError.textContent = primerMensaje;
          }

          const campoInput = $form.querySelector(`[name="${campo}"]`);
          if (campoInput) {
            campoInput.setAttribute("aria-invalid", "true");
          }
        });
      } else {
        mostrarMensaje("error", error.datos?.mensaje || error.message || "Error al registrar el equipo.");
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = textoOriginal;
    }
  });
};
