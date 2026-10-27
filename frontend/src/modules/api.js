import { BASE_URL, TIEMPO_MAXIMO_MS } from "./config.js";
import { ErrorApi } from "./errores.js";
import { obtenerToken, olvidarSesion } from "./auth.js";

/**
 * Cliente HTTP único de la aplicación.
 */
export const request = async (ruta, opciones = {}) => {
  // 1. Construir la URL completa
  const url = `${BASE_URL}${ruta}`;

  // 2. Encabezados base con Accept
  const headers = {
    Accept: "application/json",
    ...(opciones.headers || {}),
  };

  // 3. Authorization Bearer si existe token
  const token = obtenerToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 4. Si el body es un objeto, serializar a JSON y agregar Content-Type
  let body = opciones.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  // 5. AbortController para cancelar tras TIEMPO_MAXIMO_MS
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIEMPO_MAXIMO_MS);

  try {
    const response = await fetch(url, {
      ...opciones,
      headers,
      body,
      signal: controller.signal,
    });

    // 6. Respuesta 204 No Content devuelve null
    if (response.status === 204) {
      return null;
    }

    // Obtener cuerpo JSON si viene en la respuesta
    const data = await response.json().catch(() => null);

    // 7. Si response.ok es false, manejar 401 y lanzar ErrorApi
    if (!response.ok) {
      if (response.status === 401) {
        olvidarSesion();
        window.location.reload();
      }
      throw new ErrorApi(response.status, data);
    }

    // 8. Devolver el JSON parseado
    return data;
  } finally {
    clearTimeout(timer);
  }
};