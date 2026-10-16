
/*
 * Directorio de Contactos
 * Frontend: HTML + CSS + JavaScript
 */

// Cuando la API esté disponible, cambia a false.
// El frontend llamará a /api/contactos en el mismo dominio.
const USE_MOCK_DATA = true;
const API_URL = "/api/contactos";

const mockContacts = [
  {
    id_contacto: 1,
    nombre: "Ana Martínez",
    telefono: "771 100 2001",
    correo: "ana.ejemplo@correo.test",
    categoria: "Administración",
    id_categoria: 1
  },
  {
    id_contacto: 2,
    nombre: "Carlos Hernández",
    telefono: "771 100 2002",
    correo: "carlos.ejemplo@correo.test",
    categoria: "Tecnología",
    id_categoria: 2
  },
  {
    id_contacto: 3,
    nombre: "Mariana López",
    telefono: "771 100 2003",
    correo: "mariana.ejemplo@correo.test",
    categoria: "Ventas",
    id_categoria: 3
  },
  {
    id_contacto: 4,
    nombre: "Diego Ramírez",
    telefono: "771 100 2004",
    correo: "diego.ejemplo@correo.test",
    categoria: "Soporte",
    id_categoria: 4
  },
  {
    id_contacto: 5,
    nombre: "Sofía Torres",
    telefono: "771 100 2005",
    correo: "sofia.ejemplo@correo.test",
    categoria: "Proveedores",
    id_categoria: 5
  }
];

let contacts = [];
let categories = [];

const elements = {
  body: document.getElementById("contactsBody"),
  search: document.getElementById("searchInput"),
  category: document.getElementById("categoryFilter"),
  totalContacts: document.getElementById("totalContacts"),
  totalCategories: document.getElementById("totalCategories"),
  resultsCount: document.getElementById("resultsCount"),
  connectionStatus: document.getElementById("connectionStatus"),
  notice: document.getElementById("notice"),
  reload: document.getElementById("reloadBtn")
};

// Escapa texto antes de insertarlo en el HTML.
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function showNotice(message) {
  elements.notice.textContent = message;
  elements.notice.hidden = false;
}

function hideNotice() {
  elements.notice.hidden = true;
  elements.notice.textContent = "";
}

// Normaliza posibles nombres de columnas de la API.
// Ajustaremos este adaptador cuando confirmemos su JSON real.
function normalizeContact(contact) {
  return {
    id_contacto: contact.id_contacto ?? contact.id ?? "",
    nombre: contact.nombre ?? contact.name ?? "",
    telefono: contact.telefono ?? contact.telephone ?? "",
    correo: contact.correo ?? contact.email ?? "",
    categoria:
      contact.categoria ??
      contact.nombre_categoria ??
      contact.category ??
      "Sin categoría",
    id_categoria: contact.id_categoria ?? null
  };
}

function normalizeResponse(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.contactos)) {
    return payload.contactos;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  throw new Error("La respuesta de la API no contiene una lista de contactos.");
}

async function loadContacts() {
  elements.body.innerHTML =
    '<tr><td colspan="5" class="empty-state">Cargando contactos...</td></tr>';

  hideNotice();

  try {
    let data;

    if (USE_MOCK_DATA) {
      // Datos de prueba: no requieren conexión a AWS.
      data = [...mockContacts];
      elements.connectionStatus.textContent = "Modo de prueba";
    } else {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      data = normalizeResponse(await response.json());
      elements.connectionStatus.textContent = "API conectada";
    }

    contacts = data.map(normalizeContact);

    categories = [
      ...new Set(contacts.map(contact => contact.categoria).filter(Boolean))
    ].sort((a, b) => a.localeCompare(b, "es"));

    renderCategoryFilter();
    renderContacts();
  } catch (error) {
    elements.connectionStatus.textContent = "Error de conexión";
    contacts = [];
    categories = [];
    renderCategoryFilter();
    renderContacts();
    showNotice(
      `No fue posible cargar los contactos. ${error.message}`
    );
  }
}

function renderCategoryFilter() {
  const selected = elements.category.value;

  elements.category.innerHTML =
    '<option value="">Todas las categorías</option>' +
    categories.map(category =>
      `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
    ).join("");

  if (categories.includes(selected)) {
    elements.category.value = selected;
  }
}

function renderContacts() {
  const query = elements.search.value.trim().toLocaleLowerCase("es");
  const selectedCategory = elements.category.value;

  const filtered = contacts.filter(contact => {
    const searchable = [
      contact.nombre,
      contact.correo,
      contact.telefono
    ].join(" ").toLocaleLowerCase("es");

    const matchesSearch = searchable.includes(query);
    const matchesCategory =
      !selectedCategory || contact.categoria === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  elements.totalContacts.textContent = contacts.length;
  elements.totalCategories.textContent = categories.length;
  elements.resultsCount.textContent =
    `${filtered.length} ${filtered.length === 1 ? "contacto" : "contactos"}`;

  if (filtered.length === 0) {
    elements.body.innerHTML =
      '<tr><td colspan="5" class="empty-state">' +
      'No se encontraron contactos con esos criterios.</td></tr>';
    return;
  }

  elements.body.innerHTML = filtered.map(contact => `
    <tr>
      <td>
        <div class="contact-name">${escapeHTML(contact.nombre)}</div>
        <div class="contact-id">ID: ${escapeHTML(contact.id_contacto)}</div>
      </td>
      <td>${escapeHTML(contact.telefono || "No disponible")}</td>
      <td>${escapeHTML(contact.correo || "No disponible")}</td>
      <td><span class="category-tag">${escapeHTML(contact.categoria)}</span></td>
      <td>
        <button class="row-action" data-action="edit"
          data-id="${escapeHTML(contact.id_contacto)}">Editar</button>
        <button class="row-action" data-action="delete"
          data-id="${escapeHTML(contact.id_contacto)}">Eliminar</button>
      </td>
    </tr>
  `).join("");
}

async function deleteContact(id) {
  const contact = contacts.find(item =>
    String(item.id_contacto) === String(id)
  );

  if (!contact) return;

  const confirmed = confirm(
    `¿Deseas eliminar el contacto "${contact.nombre}"?`
  );

  if (!confirmed) return;

  if (USE_MOCK_DATA) {
    // Solo elimina de la vista durante esta sesión.
    contacts = contacts.filter(item =>
      String(item.id_contacto) !== String(id)
    );
    categories = [
      ...new Set(contacts.map(item => item.categoria).filter(Boolean))
    ].sort((a, b) => a.localeCompare(b, "es"));

    renderCategoryFilter();
    renderContacts();
    showNotice("Contacto eliminado de los datos de prueba.");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    await loadContacts();
    showNotice("Contacto eliminado correctamente.");
  } catch (error) {
    showNotice(`No fue posible eliminar el contacto: ${error.message}`);
  }
}

async function editContact(id) {
  const contact = contacts.find(item =>
    String(item.id_contacto) === String(id)
  );

  if (!contact) return;

  const newName = prompt("Nombre del contacto:", contact.nombre);

  if (newName === null || !newName.trim()) return;

  if (USE_MOCK_DATA) {
    contact.nombre = newName.trim();
    renderContacts();
    showNotice("Nombre actualizado en los datos de prueba.");
    return;
  }

  showNotice(
    "La edición requiere confirmar los campos y el formato PUT de la API."
  );
  // Integraremos aquí el PUT cuando confirmemos el contrato de la API.
}

elements.search.addEventListener("input", renderContacts);
elements.category.addEventListener("change", renderContacts);
elements.reload.addEventListener("click", loadContacts);

elements.body.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === "edit") {
    editContact(id);
  } else if (action === "delete") {
    deleteContact(id);
  }
});

loadContacts();
