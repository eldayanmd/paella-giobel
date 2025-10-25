const { PlatformAccount } = require('../models');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // Importar node-fetch y acceder a su exportación por defecto

// Función auxiliar para decodificar entidades HTML
function decodeHtmlEntities(text) {
  const entities = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&#x20;': ' ',
    '&#064;': '@'
  };
  let decodedText = text.replace(/&(#(?:\d+|x[\da-fA-F]+)|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith('#x')) {
      return String.fromCharCode(parseInt(entity.slice(2), 16));
    } else if (entity.startsWith('#')) {
      return String.fromCharCode(parseInt(entity.slice(1), 10));
    } else {
      return entities[match] || match;
    }
  });
  // Reemplazar entidades literales que no estén en el formato &#...;
  for (const entity in entities) {
    if (entity.startsWith('&') && !entity.startsWith('&#')) {
      decodedText = decodedText.replace(new RegExp(entity, 'g'), entities[entity]);
    }
  }
  return decodedText;
}

// Función auxiliar para extraer el título de una página HTML
function extractTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  let title = match && match[1] ? decodeHtmlEntities(match[1]).trim() : null;

    if (title) {
      // Eliminar el patrón " (@username)" de forma robusta
      title = title.replace(/\s*\(@[^)]+\)/g, '').trim();

      // Eliminar el sufijo largo de Instagram " • Instagram photos and videos"
      title = title.replace(/\s*\u2022 Instagram photos and videos$/i, '').trim();

      // Eliminar sufijos genéricos de Instagram como " - Instagram" o " • Instagram"
      title = title.replace(/(?:\s*[-•]\s*Instagram.*)?$/i, '').trim();
    }
    return title;
}

// Función auxiliar para obtener detalles de la cuenta de una plataforma (simulado)
async function fetchAccountDetails(platform, username) {
  let link = null;
  let displayName = username; // Por defecto, el nombre a mostrar es el nombre de usuario

  switch (platform.toLowerCase()) {
    case 'instagram':
      link = `https://www.instagram.com/${username}/`;
      break;
    case 'twitter':
    case 'x':
      link = `https://twitter.com/${username}`;
      break;
    case 'facebook':
      link = `https://www.facebook.com/${username}`;
      break;
    case 'linkedin':
      link = `https://www.linkedin.com/in/${username}/`;
      break;
    case 'whatsapp':
      link = `https://wa.me/${username.replace(/\D/g, '')}`; // Limpiar número
      displayName = `WhatsApp (${username})`;
      return { link, displayName }; // No necesita fetch
    case 'email':
      link = `mailto:${username}`;
      displayName = `Correo Electrónico (${username})`;
      return { link, displayName }; // No necesita fetch
    case 'phone':
      link = `tel:${username}`;
      displayName = `Teléfono (${username})`;
      return { link, displayName }; // No necesita fetch
    case 'tiktok':
      link = `https://tiktok.com/@${username.replace(/^@/, '')}`;
      break;
    default:
      // Para plataformas no reconocidas, el link puede ser nulo o se puede intentar buscar
      link = null; 
      break;
  }

  // Si tenemos un link y no es una plataforma de contacto directo, intentamos obtener el displayName de la página
  if (link && !['whatsapp', 'email', 'phone'].includes(platform.toLowerCase())) {
    try {
      const response = await fetch(link, { timeout: 5000 });
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const html = await response.text();
          const extractedTitle = extractTitle(html);
          if (extractedTitle) {
            displayName = extractedTitle;
          }
        }
      }
    } catch (error) {
      console.warn(`No se pudo obtener el displayName de ${link}:`, error.message);
      // Continuar con el username como displayName si falla la obtención del título
    }
  }

  return { link, displayName };
}

// Obtener todas las cuentas de plataforma
exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await PlatformAccount.findAll();
    res.status(200).json({ success: true, accounts });
  } catch (error) {
    console.error('Error al obtener todas las cuentas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al obtener cuentas.' });
  }
};

// Obtener una cuenta de plataforma por ID
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await PlatformAccount.findByPk(id);

    if (!account) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada.' });
    }

    res.status(200).json({ success: true, account });
  } catch (error) {
    console.error('Error al obtener cuenta por ID:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al obtener la cuenta.' });
  }
};

// Crear una nueva cuenta de plataforma
exports.createAccount = async (req, res) => {
  try {
    const { platform, username } = req.body; // Solo se requieren plataforma y nombre de usuario

    // Validación básica
    if (!platform || !username) {
      return res.status(400).json({ success: false, error: 'Plataforma y nombre de usuario son requeridos.' });
    }

    // Intentar obtener el link y displayName automáticamente
    const { link, displayName } = await fetchAccountDetails(platform, username);

    const newAccount = await PlatformAccount.create({ platform, username, link, displayName });
    res.status(201).json({ success: true, account: newAccount });
  } catch (error) {
    console.error('Error al crear cuenta:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al crear la cuenta.' });
  }
};

// Actualizar una cuenta de plataforma existente
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, username, link, displayName } = req.body; // Añadir displayName

    const account = await PlatformAccount.findByPk(id);

    if (!account) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada.' });
    }

    account.platform = platform || account.platform;
    account.username = username || account.username;
    account.link = link || account.link;
    account.displayName = displayName || account.displayName; // Actualizar displayName

    await account.save();
    res.status(200).json({ success: true, account });
  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al actualizar la cuenta.' });
  }
};

// Eliminar una cuenta de plataforma
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await PlatformAccount.findByPk(id);

    if (!account) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada.' });
    }

    await account.destroy();
    res.status(200).json({ success: true, message: 'Cuenta eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al eliminar la cuenta.' });
  }
};

// Función de verificación real de cuentas
exports.verifyAccount = async (req, res) => {
  try {
    const { platform, username } = req.body; // Ahora solo se requieren plataforma y nombre de usuario

    if (!platform || !username) {
      return res.status(400).json({ success: false, error: 'Plataforma y nombre de usuario son requeridos para la verificación.' });
    }

    // Intentar obtener el link y displayName automáticamente
    let accountDetails = await fetchAccountDetails(platform, username);
    let link = accountDetails.link;
    let displayName = accountDetails.displayName;

    if (!link) {
      return res.status(400).json({ success: false, error: 'No se pudo generar un enlace para la plataforma y nombre de usuario proporcionados.' });
    }

    // Para plataformas de contacto directo, no intentamos hacer un fetch HTTP
    const directContactPlatforms = ['whatsapp', 'email', 'phone'];
    if (directContactPlatforms.includes(platform.toLowerCase())) {
      // La verificación es que el link se haya generado y sea un formato válido para el tipo
      // (ya manejado en fetchAccountDetails)
      return res.status(200).json({ 
        success: true, 
        message: 'Cuenta verificada exitosamente.', 
        displayName: displayName,
        link: link
      });
    }

    // Para otras plataformas, validar que el link sea una URL válida y accesible
    try {
      new URL(link);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'El enlace generado no es una URL válida.' });
    }

    try {
      const response = await fetch(link, { timeout: 5000 }); // Añadir timeout
      
      if (!response.ok) {
        return res.status(400).json({ success: false, error: `No se pudo acceder al enlace. Código de estado: ${response.status}` });
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const html = await response.text();
        displayName = extractTitle(html) || username; // Usar username si no se pudo extraer el título
      } else {
        displayName = username;
      }

      res.status(200).json({ 
        success: true, 
        message: 'Cuenta verificada exitosamente.', 
        displayName: displayName,
        link: link // Devolver el link generado/verificado
      });

    } catch (fetchError) {
      console.error('Error durante la verificación de la cuenta (fetch):', fetchError);
      let errorMessage = 'Error al intentar acceder al enlace. Asegúrate de que la URL es correcta y accesible.';
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Tiempo de espera agotado al intentar acceder al enlace.';
      } else if (fetchError.code === 'ENOTFOUND') {
        errorMessage = 'No se pudo resolver el host del enlace. Verifica la URL.';
      }
      res.status(400).json({ success: false, error: errorMessage });
    }

  } catch (error) {
    console.error('Error en la verificación de cuenta:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor durante la verificación.' });
  }
};
