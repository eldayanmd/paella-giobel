const BASE_URL = (() => {
  const hostname = window.location.origin;
  
  // Desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5500';
  }
  
  // Producción - BACKEND en Railway
  return 'https://paella-giobel.onrender.com';
})();

console.log('BASE_URL configurada como:', BASE_URL);

// Nueva función para manejar rutas de imágenes
function getCorrectImagePath(imagePath) {
  if (!imagePath) return '/img/default-paella.jpg';
  
  // Normalizar la ruta
  let cleanPath = imagePath
    .replace(/^\/+/, '')       // Quita barras iniciales
    .replace(/^img\//, '')     // Quita prefijo img/
    .replace(/^client\//, ''); // Quita prefijo client/

  // Verificar si es una URL completa
  if (cleanPath.startsWith('http')) {
    return cleanPath;
  }

  // Para desarrollo y producción
  return `/img/${cleanPath}`;
}

function handleImageError(imgElement) {
  console.warn('Error al cargar imagen:', imgElement.src);
  imgElement.onerror = null; // Prevenir bucles
  
  // Solo intentar cargar default si no es ya la imagen por defecto
  if (!imgElement.src.includes('default-paella.jpg')) {
    imgElement.src = '/img/default-paella.jpg';
    imgElement.style.opacity = '0.8';
    imgElement.style.objectFit = 'cover';
  } else {
    imgElement.style.display = 'none';
    console.error('La imagen por defecto no está disponible');
  }
}

function showSuccess(message, elementId = 'comment-response') {
  const container = document.getElementById(elementId);
  if (container) {
    container.innerHTML = `
      <div class="alert alert-success">
        <i class="fas fa-check-circle"></i> ${message}
      </div>
    `;
    container.style.display = 'block';
  }
}


function showError(message, elementId = 'comment-response') {
  const container = document.getElementById(elementId);
  if (container) {
    container.innerHTML = `
      <div class="alert alert-error" style="
        padding: 15px;
        background: #ffebee;
        color: #c62828;
        border-radius: 4px;
        margin: 20px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: fadeIn 0.3s ease-in-out;
      ">
        <i class="fas fa-exclamation-circle"></i>
        <p style="margin: 0;">${message}</p>
      </div>
    `;
    container.style.display = 'block';
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
      container.style.animation = 'fadeOut 0.5s ease-in-out';
      setTimeout(() => {
        container.style.display = 'none';
      }, 500);
    }, 5000);
  }
  console.error(message);
}


  // Guardar la URL original antes de redirigir a Google Auth
document.querySelectorAll('.btn-social.google').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Guardar la URL actual antes de redirigir
        sessionStorage.setItem('originalUrl', window.location.pathname + window.location.search);
        window.location.href = `${BASE_URL}/api/auth/google`;
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        // Solo prevenir el comportamiento por defecto si el href es exactamente "#"
        if (href === '#') {
            e.preventDefault();
            return;
        }
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

function handleGoogleCallback() {
  console.log('🔄 Verificando callback de Google...');
  
  // Obtener el fragment (parte después del #)
  const fragment = window.location.hash.substring(1);
  console.log('🔍 Fragment completo:', fragment);
  
  // Parsear parámetros del fragment
  const fragmentParams = new URLSearchParams(fragment);
  const token = fragmentParams.get('token');
  const user = fragmentParams.get('user');

  console.log('📋 Parámetros del fragment:', {
    token: token ? `PRESENTE (${token.substring(0, 20)}...)` : 'AUSENTE',
    user: user || 'No definido',
    fragment: fragment
  });

  if (token) {
    console.log('✅ Token encontrado en fragment');
    
    // Guardar en localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userName', decodeURIComponent(user) || 'Usuario');
    
    console.log('💾 Token y usuario guardados en localStorage');
    
    // Limpiar el fragment de la URL
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    console.log('🔄 Recargando página...');
    window.location.reload();
    return true;
  }
  
  console.log('❌ No se encontró token en el fragment');
  return false;
}

function setupModals() {
  // Eliminar event listeners anteriores para evitar duplicados
  document.querySelectorAll('.modal-trigger').forEach(trigger => {
    const newTrigger = trigger.cloneNode(true);
    trigger.replaceWith(newTrigger);
  });

  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.replaceWith(newCloseBtn);
  });

  // Configurar nuevos event listeners para abrir modales
  document.querySelectorAll('.modal-trigger').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      const modalId = this.getAttribute('href');
      const modal = document.querySelector(modalId);
      
      if (modal) {
        // Cerrar todos los modales primero
        document.querySelectorAll('.modal').forEach(m => {
          if (m.classList.contains('product-modal-admin')) {
            // Para el modal de productos, usar la animación de cierre
            m.classList.add('closing');
            m.querySelector('.modal-dialog').addEventListener('animationend', function handler() {
              m.style.display = 'none';
              m.classList.remove('closing');
              this.removeEventListener('animationend', handler);
            });
          } else {
            m.style.display = 'none';
          }
        });
        
        // Abrir el modal solicitado
        modal.style.display = 'flex'; // Usar flex para centrar con CSS
        document.body.style.overflow = 'hidden';
        
        // Si es el modal de productos, añadir la clase de animación de entrada
        if (modal.classList.contains('product-modal-admin')) {
          modal.querySelector('.modal-content').classList.add('modal-animated-in');
        }

        const firstInput = modal.querySelector('input');
        if (firstInput) {
          firstInput.focus();
        }
      }
    });
  });

  // Cerrar modales
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        if (modal.classList.contains('product-modal-admin')) {
          modal.classList.add('closing');
          modal.querySelector('.modal-dialog').addEventListener('animationend', function handler() {
            modal.style.display = 'none';
            modal.classList.remove('closing');
            document.body.style.overflow = 'auto';
            this.removeEventListener('animationend', handler);
          });
        } else {
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
        }
      }
    });
  });

  // Cerrar al hacer clic fuera del contenido
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        if (modal.classList.contains('product-modal-admin')) {
          modal.classList.add('closing');
          modal.querySelector('.modal-dialog').addEventListener('animationend', function handler() {
            modal.style.display = 'none';
            modal.classList.remove('closing');
            document.body.style.overflow = 'auto';
            this.removeEventListener('animationend', handler);
          });
        } else {
          this.style.display = 'none';
          document.body.style.overflow = 'auto';
        }
      }
    });
  });
}


function setupCookies() {
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookiesBtn = document.getElementById('accept-cookies-btn');

    if (cookieBanner && acceptCookiesBtn) {
        // Si el usuario ya aceptó las cookies, ocultar el banner
        if (localStorage.getItem('cookies-accepted') === 'true') {
            cookieBanner.classList.remove('show');
        } else {
            // Si no ha aceptado, mostrar el banner con un pequeño retraso para el efecto
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, 1000); // Retraso de 1 segundo para que la página cargue primero
        }

        // Manejar el clic en "Aceptar"
        acceptCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('cookies-accepted', 'true');
            // No hay cookies de análisis separadas en el nuevo diseño, así que se elimina esa lógica
            cookieBanner.classList.remove('show');
        });
    }
}
function setupRegistrationForm(form) {
  console.log('🛠️ Configurando formulario de registro:', form.id);
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // ✅ USAR LOS IDs CORRECTOS de tu HTML
    const nombreInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email'); 
    const passwordInput = document.getElementById('register-password');
    
    console.log('🔍 Buscando inputs:', {
      nombre: nombreInput ? 'ENCONTRADO' : 'NO ENCONTRADO',
      email: emailInput ? 'ENCONTRADO' : 'NO ENCONTRADO',
      password: passwordInput ? 'ENCONTRADO' : 'NO ENCONTRADO'
    });
    
    const userData = {
      nombre: nombreInput?.value,
      email: emailInput?.value,
      password: passwordInput?.value
    };
    
    console.log('📝 Datos capturados del formulario:', userData);
    
    // Validaciones básicas
    if (!userData.nombre || !userData.email || !userData.password) {
      showError('Todos los campos son obligatorios');
      return;
    }
    
    if (userData.password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (!isValidEmail(userData.email)) {
      showError('Ingresa un email válido');
      return;
    }
    
    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando código...';
    submitBtn.disabled = true;
    
    try {
      const result = await sendVerificationCode(userData);
      
      if (result.success) {
        console.log('✅ Código enviado, mostrando modal de verificación');
        showVerificationModal(userData.email);
        form.reset();
      } else {
        showError(result.error);
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      showError('Error al procesar el registro');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

function setupPasswordValidation() {
    const passwordInput = document.getElementById('register-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const strengthBars = document.querySelectorAll('.strength-bar');
            const password = this.value;
            
            // Reset all bars
            strengthBars.forEach(bar => {
                bar.style.background = '#eee';
                bar.classList.remove('active'); // Eliminar clase active
            });

            if (password.length > 0) {
                // Calculate strength (0-3)
                let strength = 0;
                
                // Length check
                if (password.length >= 6) strength++;
                
                // Contains numbers
                if (/\d/.test(password)) strength++;
                
                // Contains special chars
                if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
                
                // Update bars
                const colors = ['#ff4d4f', '#faad14', '#52c41a']; // Rojo, Amarillo, Verde
                strengthBars.forEach((bar, index) => {
                    if (index < strength) {
                        bar.style.background = colors[index];
                        bar.classList.add('active'); // Añadir clase active
                    }
                });
            }
        });
    }
}

async function registerUser(userData) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
  method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en el registro');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en registro:', error);
        throw error;
    }
}
// Modifica el manejador del formulario para usar manualJWTDecode

document.getElementById('form-registro').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const responseDiv = document.getElementById('response-message');
  
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando código...';
  submitBtn.disabled = true;
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/send-verification`, {
  method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error enviando código');
    }
    
    // Mostrar paso 2
    document.getElementById('register-step1').style.display = 'none';
    document.getElementById('register-step2').style.display = 'block';
    document.getElementById('user-email').textContent = email;
    
    // Iniciar countdown
    startCountdown(15 * 60);
    
    // Configurar inputs de código
    setupCodeInputs();
    
  } catch (error) {
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>${error.message}</p>
      </div>
    `;
    responseDiv.className = 'error';
  } finally {
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar código';
    submitBtn.disabled = false;
  }
});
function setupCodeInputs() {
  const inputs = document.querySelectorAll('.code-input');
  
  inputs.forEach((input, index) => {
    // Manejar entrada
    input.addEventListener('input', (e) => {
      if (e.target.value) {
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        } else {
          document.getElementById('verification-form').dispatchEvent(new Event('submit'));
        }
      }
    });
    
    // Manejar borrado
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });
}

let countdownInterval;  // Variable global para controlar el intervalo

function startCountdown(seconds) {
    const countdownElement = document.querySelector('#countdown span');
    
    // Limpiar intervalo previo (si existe)
    if (countdownInterval) clearInterval(countdownInterval);

    let remaining = seconds;

    countdownInterval = setInterval(() => {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        countdownElement.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            countdownElement.textContent = '¡Tiempo agotado!';
            countdownElement.style.color = '#ff4d4f';
        } else {
            remaining--;
            
            // Cambiar color cuando quedan 2 minutos
            if (remaining === 120) {
                countdownElement.style.color = '#faad14';
            }
            
            // Parpadear cuando quedan 30 segundos
            if (remaining <= 30) {
                countdownElement.style.animation = 'pulse 0.5s infinite';
            }
        }
    }, 1000);
}
// Verificación del código
// Verificación del código
document.getElementById('verification-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const code = Array.from(document.querySelectorAll('.code-input'))
    .map(input => input.value)
    .join('');
  
  console.log('🔄 Iniciando verificación...', { email, code });
  
  // ✅ VERIFICAR QUE EL CÓDIGO ESTÉ COMPLETO (6 DÍGITOS)
  if (code.length !== 6) {
    console.log('❌ Código incompleto:', code.length, 'dígitos');
    
    // Mostrar mensaje de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Código incompleto. Ingresa los 6 dígitos.`;
    
    const form = document.getElementById('verification-form');
    // Remover errores anteriores
    const existingError = form.querySelector('.alert.error');
    if (existingError) existingError.remove();
    
    form.insertBefore(errorDiv, form.firstChild);
    return;
  }
  
  // ✅ PREVENIR MÚLTIPLES ENVÍOS
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn.disabled) {
    console.log('⚠️ Verificación ya en progreso...');
    return;
  }
  
  // Mostrar estado de carga
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
  submitBtn.disabled = true;

  // Variable para controlar si fue exitoso
  let verificationSuccess = false;

  try {
    console.log('📤 Enviando solicitud de verificación...');
    
    const response = await fetch(`${BASE_URL}/api/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    
    console.log('📥 Respuesta recibida, status:', response.status);
    
    const data = await response.json();
    console.log('📋 Datos de respuesta:', data);
    
    if (!response.ok) {
      throw new Error(data.error || 'Código inválido');
    }

    console.log('✅ Código verificado, procediendo con registro...');
    verificationSuccess = true;
    
    // Si el código es correcto, proceder con el registro
    completeRegistration(email);
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    
    // Mostrar mensaje de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
    
    const form = document.getElementById('verification-form');
    // Remover errores anteriores
    const existingError = form.querySelector('.alert.error');
    if (existingError) existingError.remove();
    
    form.insertBefore(errorDiv, form.firstChild);
    
    // Resetear inputs solo si el error no es de "código ya usado"
    if (!error.message.includes('usado') && !error.message.includes('No se encontró')) {
      document.querySelectorAll('.code-input').forEach(input => {
        input.value = '';
        input.style.borderColor = '#ff4d4f';
        setTimeout(() => input.style.borderColor = '#ddd', 1000);
      });
      document.querySelector('.code-input').focus();
    }
    
  } finally {
    console.log('🏁 Finalizando verificación...');
    
    // ✅ SOLO RE-HABILITAR SI NO FUE EXITOSO
    if (!verificationSuccess) {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    } else {
      // Si fue exitoso, mantener deshabilitado y cambiar texto
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verificado';
      submitBtn.style.backgroundColor = '#28a745';
    }
  }
});

// ✅ FUNCIÓN PARA MANEJAR EL AUTO-COMPLETE DE LOS INPUTS
function setupCodeInputs() {
  const codeInputs = document.querySelectorAll('.code-input');
  
  codeInputs.forEach((input, index) => {
    // Prevenir pegado
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text');
      if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
        const digits = pasteData.split('');
        codeInputs.forEach((input, i) => {
          if (digits[i]) input.value = digits[i];
        });
        codeInputs[5].focus();
      }
    });
    
    // Manejar entrada de teclado
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      
      // Solo permitir números
      if (value && !/^\d$/.test(value)) {
        e.target.value = '';
        return;
      }
      
      // Si se ingresó un dígito, mover al siguiente
      if (value && index < codeInputs.length - 1) {
        codeInputs[index + 1].focus();
      }
      
      // Si es el último dígito y está completo, NO enviar automáticamente
      // El usuario debe hacer clic en el botón
    });
    
    // Manejar tecla borrar
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        codeInputs[index - 1].focus();
      }
    });
  });
}

// Completar registro
function completeRegistration(email) {
  console.log('🚀 Iniciando registro completo para:', email);
  
  // Ocultar modal de verificación
  const verificationModal = document.getElementById('verification-modal');
  if (verificationModal) {
    verificationModal.style.display = 'none';
  }
  
  // Mostrar formulario de registro completo
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.style.display = 'block';
    // Pre-llenar el email si existe un campo
    const emailField = registerForm.querySelector('input[type="email"]');
    if (emailField) {
      emailField.value = email;
      emailField.readOnly = true;
    }
  }
  
  // O si el registro se completa automáticamente, mostrar mensaje de éxito
  showSuccess('✅ Código verificado correctamente. Ahora completa tu registro.');
  
  console.log('✅ Flujo de registro continuado');
}

async function sendVerificationCode(userData) {
  try {
    console.log('📤 Enviando datos al backend:', userData);
    console.log('📤 Contenido de userData:', {
      nombre: userData.nombre,
      email: userData.email,
      password: userData.password ? 'PRESENTE' : 'AUSENTE',
      passwordLength: userData.password?.length
    });
    
    const response = await fetch(`${BASE_URL}/api/auth/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    console.log('📥 Respuesta del servidor:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error enviando código:', error);
    return { success: false, error: 'Error de conexión' };
  }
}
async function sendVerificationCode(email) {
  try {
    console.log('📧 Enviando código a:', email);
    
    // Timeout de 15 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${BASE_URL}/api/auth/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    const result = await response.json();
    console.log('📧 Respuesta del servidor:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error enviando código:', error);
    
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout: El servidor tardó demasiado en responder' };
    }
    
    return { success: false, error: 'Error de conexión' };
  }
}
function setupGoogleAuth() {
  document.querySelectorAll('.btn-social.google').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      // Guardar URL actual antes de redirigir
      sessionStorage.setItem('originalUrl', window.location.pathname);
      window.location.href = `${BASE_URL}/api/auth/google`;
    });
  });
}

  // Configurar botón de login con Google
  const googleLoginBtn = document.getElementById('google-login-btn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = `${BASE_URL}/api/auth/google`;
    });
  }

function decodeJWT(token) {
    if (!token) return null;
    
    try {
        // Dividir el token en sus partes
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        // Decodificar la parte del payload (base64url)
        const payload = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        // Añadir padding si es necesario
        const padLength = 4 - (payload.length % 4);
        const paddedPayload = payload + (padLength < 4 ? '='.repeat(padLength) : '');
        
        // Decodificar y parsear
        const decoded = JSON.parse(atob(paddedPayload));
        return decoded;
    } catch (e) {
        console.error('Error decodificando JWT:', e);
        return null;
    }
}
// Función para parsear JWT (movida fuera de setupCommentSystem para ser global)
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

// Función auxiliar para generar estrellas (movida fuera de setupCommentSystem)
function generateStarRating(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Función auxiliar para formatear fecha (movida fuera de setupCommentSystem)
function formatCommentDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Función auxiliar para colores aleatorios de avatar (movida fuera de setupCommentSystem)
function getRandomColor() {
    const colors = ['#e67e22', '#1d3557', '#e63946', '#457b9d', '#a8dadc', '#2a9d8f'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Función para actualizar estado de las flechas de navegación (movida fuera de setupCommentSystem)
function updateNavButtons() {
    const container = document.getElementById('comentarios-container');
    const prevBtn = document.getElementById('prev-comment');
    const nextBtn = document.getElementById('next-comment');
    
    if (!container || !prevBtn || !nextBtn) return;
    
    // Estado inicial
    prevBtn.disabled = container.scrollLeft <= 10;
    nextBtn.disabled = container.scrollLeft >= 
        (container.scrollWidth - container.clientWidth - 10);
    
    // Escuchar eventos de scroll
    container.addEventListener('scroll', () => {
        prevBtn.disabled = container.scrollLeft <= 10;
        nextBtn.disabled = container.scrollLeft >= 
            (container.scrollWidth - container.clientWidth - 10);
    });
}

// Cargar comentarios (movida fuera de setupCommentSystem para ser global)
async function loadComments() {
    try {
        const response = await fetch(`${BASE_URL}/api/comentarios`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.comentarios) {
            renderComments(data.comentarios);
        } else {
            showError('No se pudieron cargar los comentarios');
        }
    } catch (error) {
        showError('Error al cargar comentarios. Por favor intenta más tarde.');
        console.error('Error cargando comentarios:', error);
    }
}

// Mostrar comentarios (movida fuera de setupCommentSystem para ser global)
function renderComments(comentarios) {
    const comentariosContainer = document.getElementById('comentarios-container');
    if (!comentariosContainer) return;
    
    // Si no hay comentarios, mostrar mensaje
    if (!comentarios || comentarios.length === 0) {
        comentariosContainer.innerHTML = `
            <div style="
                flex: 0 0 100%;
                text-align: center;
                padding: 40px;
                color: #666;
                font-size: 1.1rem;
            ">
                <i class="fas fa-comment-slash" style="font-size: 2rem; margin-bottom: 15px; display: block; color: #e67e22;"></i>
                No hay comentarios aún. ¡Sé el primero en compartir tu experiencia!
            </div>
        `;
        // Actualizar el promedio de estrellas a 0 si no hay comentarios
        updateAverageRating(0);
        return;
    }

    // Generar HTML para cada comentario
    comentariosContainer.innerHTML = comentarios.map(comentario => `
        <div class="testimonial-card" data-id="${comentario.id}">
            <div class="testimonial-header">
                ${comentario.imagen_usuario ? 
                    `<img src="${comentario.imagen_usuario}" class="user-avatar-comment" alt="${comentario.nombre_usuario}">` : 
                    `<div class="user-avatar-comment" style="background-color: ${getRandomColor()}">
                        ${comentario.nombre_usuario.charAt(0).toUpperCase()}
                    </div>`
                }
                <div class="user-info-comment">
                    <div class="user-name-comment">${comentario.nombre_usuario}</div>
                    <div class="comment-date">
                        ${formatCommentDate(comentario.created_at || comentario.fecha_creacion)}
                    </div>
                </div>
            </div>
            <div class="stars">${generateStarRating(comentario.estrellas)}</div>
            <div class="comment-text">${comentario.comentario}</div>
        </div>
    `).join('');

    // Actualizar estado de las flechas de navegación
    updateNavButtons();
    // Calcular y mostrar el promedio de estrellas
    calculateAndDisplayAverageRating(comentarios);
}

function setupCommentSystem() {
    const addCommentBtn = document.getElementById('add-comment-btn');
    const addCommentContainer = document.getElementById('add-comment-container');
    const commentModal = document.getElementById('comment-modal');
    const commentForm = document.getElementById('comment-form');
    const starsInput = document.getElementById('estrellas');
    const starRating = document.querySelectorAll('.star-rating i');
    const commentResponse = document.getElementById('comment-response');
    const modalClose = document.querySelector('#comment-modal .modal-close');

    // Verificar autenticación para comentarios
   function checkAuthForComments() {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const userData = parseJwt(token);
            if (userData && userData.id) {
                addCommentContainer.style.display = 'block';
                console.log('Usuario autenticado, mostrando botón de comentarios');
                return;
            }
        } catch (e) {
            console.error('Error verificando token:', e);
        }
    }
    addCommentContainer.style.display = 'none';
    console.log('Usuario NO autenticado, ocultando botón de comentarios');
}
    
    // Sistema de estrellas
    starRating.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            starsInput.value = rating;
            
            starRating.forEach(s => {
                s.style.color = '#ddd';
                if (s.getAttribute('data-rating') <= rating) {
                    s.style.color = '#FFD700';
                }
            });
        });
        
        star.addEventListener('mouseover', function() {
            const rating = this.getAttribute('data-rating');
            starRating.forEach(s => {
                if (s.getAttribute('data-rating') <= rating) {
                    s.style.color = '#FFD700';
                }
            });
        });
        
        star.addEventListener('mouseout', function() {
            const currentRating = starsInput.value || 0;
            starRating.forEach(s => {
                if (s.getAttribute('data-rating') > currentRating) {
                    s.style.color = '#ddd';
                }
            });
        });
    });
    
    // Abrir modal
    if (addCommentBtn) {
        addCommentBtn.addEventListener('click', function() {
            commentModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Enviar comentario
    if (commentForm) {
        let isSubmitting = false; // Bandera para evitar doble envío

       commentForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
  if (isSubmitting) return;
  isSubmitting = true;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  const comentario = document.getElementById('comentario').value.trim();
  const estrellas = starsInput.value;
  
  // Resetear mensajes anteriores
  const errorDiv = document.getElementById('comment-response');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }

  // Validación robusta
  const errors = [];
  if (!estrellas || estrellas < 1 || estrellas > 5) {
    errors.push('Por favor selecciona una calificación entre 1 y 5 estrellas');
  }
  if (!comentario || comentario.length < 10) {
    errors.push('El comentario debe tener al menos 10 caracteres');
  }
  
  if (errors.length > 0) {
    showError(errors.join('<br>'));
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    isSubmitting = false;
    return;
  }
    

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;
            
            const token = localStorage.getItem('authToken');
            
            if (!token || isTokenExpired(token)) {
                showError('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                isSubmitting = false;
                logout();
                return;
            }

           try {
    const token = localStorage.getItem('authToken');
    const userData = parseJwt(token);
    
    if (!userData || !userData.id) {
        throw new Error('Error al verificar tu sesión');
    }

                const response = await fetch(`${BASE_URL}/api/comentarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            estrellas: parseInt(estrellas),
            comentario: comentario,
            nombre_usuario: userData.nombre,
            user_id: userData.id,
            ...(userData.picture && { imagen_usuario: userData.picture })
        })
    });


                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Error al enviar comentario');
                }

                showSuccess('¡Gracias por tu opinión! Será visible después de aprobación.');
                
                // Resetear formulario
                commentForm.reset();
                starRating.forEach(s => s.style.color = '#ddd');
                starsInput.value = '';
                
                // Recargar comentarios después de 2 segundos
                setTimeout(() => {
                    loadComments();
                    commentModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }, 2000);
                
            } catch (error) {
                console.error('Error:', error);
                showError(error.message);
                
                // Si es error 401, cerrar sesión
                if (error.message.includes('401') || error.message.includes('no autorizado')) {
                    logout();
                }
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                isSubmitting = false;
            }
        });
    }




    // Cerrar modal
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            commentModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    // Cerrar al hacer clic fuera del modal
    commentModal.addEventListener('click', function(e) {
        if (e.target === commentModal) {
            commentModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Mostrar mensaje de éxito
    function showSuccess(message) {
        const container = document.getElementById('comment-response');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> ${message}
                </div>
            `;
            container.style.display = 'block';
        }
    }



    // Inicializar
    function init() {
        checkAuthForComments();
        loadComments();
    }

    init();
}

// Función para calcular y mostrar el promedio de estrellas
function calculateAndDisplayAverageRating(comentarios) {
  const averageRatingDisplay = document.getElementById('average-rating-value');
  if (!averageRatingDisplay) return;

  if (!comentarios || comentarios.length === 0) {
    updateAverageRating(0);
    return;
  }

  const totalStars = comentarios.reduce((sum, comentario) => sum + comentario.estrellas, 0);
  const average = totalStars / comentarios.length;
  updateAverageRating(average);
}

// Función para actualizar el elemento HTML del promedio de estrellas
function updateAverageRating(average) {
  const averageRatingValueElement = document.getElementById('average-rating-value');
  if (averageRatingValueElement) {
    averageRatingValueElement.textContent = average.toFixed(1); // Mostrar con un decimal
  }
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM cargado - iniciando configuración');
  
  // Configuración básica esencial
  setupModals();
  setupPasswordValidation();
  setupGoogleAuth();
  checkAuth();
  setupGallery();
  setupCommentSystem();
  setupAdminLogin();
  setupImageErrorHandling();
  loadProducts();
  setupGalleryManagement(); // Configurar la gestión de galería
  setupAccountManagement(); // Nuevo: Configurar la gestión de cuentas
  loadContactAccounts(); // Cargar las cuentas de contacto dinámicamente
  setupCookies(); // Inicializar la lógica de cookies
  setupProductFormListeners(); 
   if (handleGoogleCallback()) {
    return; // Si hubo token, se recargará la página
  }// Asegurarse de que los listeners del formulario de producto se configuren

  // Configurar el botón de gestión de comentarios si no existe
  const addCommentContainer = document.getElementById('add-comment-container');
  if (addCommentContainer && !document.getElementById('gestion-comentarios-btn')) {
    const gestionBtn = document.createElement('button');
    gestionBtn.id = 'gestion-comentarios-btn';
    gestionBtn.className = 'btn-submit';
    gestionBtn.style.display = 'none';
    gestionBtn.style.marginTop = '10px';
    gestionBtn.innerHTML = '<i class="fas fa-cog"></i> Gestionar Comentarios';
    gestionBtn.onclick = function() {
      document.querySelector('#modal-gestion-comentarios').style.display = 'block';
      cargarComentariosPendientes();
    };
    addCommentContainer.appendChild(gestionBtn);
  }

  // Lógica para los botones de gestión de comentarios (Pendientes/Eliminar)
  const btnVerPendientes = document.getElementById('btn-ver-pendientes');
  const btnEliminarComentarios = document.getElementById('btn-eliminar-comentarios');
  const listaComentariosPendientes = document.getElementById('lista-comentarios-pendientes');
  const listaTodosComentarios = document.getElementById('lista-todos-comentarios');

  if (btnVerPendientes && btnEliminarComentarios && listaComentariosPendientes && listaTodosComentarios) {
    btnVerPendientes.addEventListener('click', () => {
      listaComentariosPendientes.style.display = 'block';
      listaTodosComentarios.style.display = 'none';
      btnVerPendientes.classList.add('active');
      btnEliminarComentarios.classList.remove('active');
      cargarComentariosPendientes();
    });

    btnEliminarComentarios.addEventListener('click', () => {
      listaComentariosPendientes.style.display = 'none';
      listaTodosComentarios.style.display = 'block';
      btnEliminarComentarios.classList.add('active');
      btnVerPendientes.classList.remove('active');
      cargarTodosLosComentarios();
    });
  }

  // Configurar el botón de reenvío de código
  const resendBtn = document.getElementById('resend-code');
  if (resendBtn) {
    resendBtn.addEventListener('click', function(e) {
      e.preventDefault();
      resendVerificationCode();
    });
  }

  // Configurar formulario de login directamente
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const responseDiv = document.getElementById('login-response');
      responseDiv.style.display = 'block';
      responseDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Iniciando sesión...</div>';
      responseDiv.className = 'loading';

      try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
          })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Error en credenciales');
        
        // Guardar token y actualizar UI
        localStorage.setItem('authToken', data.token);
        updateUserUI(data.user);
        
        // Mostrar mensaje de éxito
        responseDiv.innerHTML = `
          <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <p>¡Bienvenido ${data.user.nombre}!</p>
          </div>
        `;
        responseDiv.className = 'success';

        // Cerrar modal después de 1.5 segundos
        setTimeout(() => {
          document.querySelector('#modal-login').style.display = 'none';
        }, 1500);

      } catch (error) {
        responseDiv.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${error.message}</p>
          </div>
        `;
        responseDiv.className = 'error';
      }
    });
  }
  
  // Configuración de scroll suave
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  
  // Lógica de navegación de comentarios (ya existente)
  const comentariosContainer = document.getElementById('comentarios-container');
  const prevBtn = document.getElementById('prev-comment');
  const nextBtn = document.getElementById('next-comment');

  if (comentariosContainer && prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      comentariosContainer.scrollBy({
        left: -300, // Mismo valor que el ancho de las tarjetas
        behavior: 'smooth'
      });
    });

    nextBtn.addEventListener('click', () => {
      comentariosContainer.scrollBy({
        left: 300, // Mismo valor que el anfo de las tarjetas
        behavior: 'smooth'
      });
    });

    // Actualizar estado de los botones según la posición del scroll
    comentariosContainer.addEventListener('scroll', () => {
      prevBtn.disabled = comentariosContainer.scrollLeft <= 10;
      nextBtn.disabled = comentariosContainer.scrollLeft >= 
        (comentariosContainer.scrollWidth - comentariosContainer.clientWidth - 10);
    });

    // Estado inicial de los botones
    prevBtn.disabled = true;
  }
});

// Nueva función para configurar los listeners del formulario de producto
function setupProductFormListeners() {
  const modernProductForm = document.getElementById('modern-product-form');
  const productImageModern = document.getElementById('product-image-modern');
  const imagePreviewModern = document.getElementById('image-preview-modern');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const productFormResponse = document.getElementById('modern-form-response');

  if (modernProductForm) {
    modernProductForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      submitBtn.disabled = true;
      
      const productId = this.querySelector('#product-id-modern').value;
      const isEditMode = productId !== '';
      const url = isEditMode 
        ? `${BASE_URL}/api/products/${productId}` 
        : `${BASE_URL}/api/products`;
      const method = isEditMode ? 'PUT' : 'POST';

      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No autenticado');

        const response = await fetch(url, {
          method: method,
          headers: {
            'Authorization': `Bearer ${token}`
            // FormData no necesita 'Content-Type' si no se especifica, el navegador lo hace
          },
          body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al guardar el producto');
        }
        
        showSuccess(isEditMode ? 'Producto actualizado exitosamente' : 'Producto guardado exitosamente', 'modern-form-response');
        loadProducts(); // Recargar productos en la vista principal
        
        // Resetear el formulario y volver al menú principal después de 1.5 segundos
       setTimeout(() => {
          resetProductForm();
          document.getElementById('add-product-view').style.display = 'none';
          document.getElementById('product-admin-nav').style.display = 'block';
        }, 1500);
      } catch (error) {
        showError(error.message, 'modern-form-response');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Configurar carga de imagen para el formulario moderno
  if (productImageModern && imagePreviewModern && removeImageBtn) {
    const modernUploadArea = document.getElementById('modern-upload-area');

    modernUploadArea.addEventListener('click', () => productImageModern.click());
    modernUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      modernUploadArea.style.borderColor = 'var(--primary-color)';
      modernUploadArea.style.backgroundColor = 'rgba(160, 82, 45, 0.1)';
    });
    modernUploadArea.addEventListener('dragleave', () => {
      modernUploadArea.style.borderColor = 'var(--accent-color)';
      modernUploadArea.style.backgroundColor = 'rgba(255, 215, 0, 0.08)';
    });
    modernUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      modernUploadArea.style.borderColor = 'var(--accent-color)';
      modernUploadArea.style.backgroundColor = 'rgba(255, 215, 0, 0.08)';
      if (e.dataTransfer.files.length) {
        productImageModern.files = e.dataTransfer.files;
        handleProductImagePreview(productImageModern.files[0]);
      }
    });

    productImageModern.addEventListener('change', () => {
      if (productImageModern.files.length) {
        handleProductImagePreview(productImageModern.files[0]);
      }
    });

    removeImageBtn.addEventListener('click', () => {
      productImageModern.value = ''; // Limpiar el input de archivo
      imagePreviewModern.innerHTML = '';
      imagePreviewModern.style.display = 'none';
      modernUploadArea.style.display = 'flex'; // Mostrar el área de carga
    });

    function handleProductImagePreview(file) {
      if (!file.type.match('image.*')) {
        showError('Por favor selecciona un archivo de imagen válido', 'modern-form-response');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        // Asegurarse de que imagePreviewModern esté visible antes de buscar su contenido
        imagePreviewModern.style.display = 'block';
        modernUploadArea.style.display = 'none'; // Ocultar el área de carga

        imagePreviewModern.innerHTML = `<img src="${e.target.result}" alt="Preview de imagen de producto" style="max-width: 100%; max-height: 200px; object-fit: contain;">`;
      };
      reader.readAsDataURL(file);
    }
  }
}

// Función para resetear el formulario de producto
function resetProductForm() {
  const modernProductForm = document.getElementById('modern-product-form');
  const productImageModern = document.getElementById('product-image-modern');
  const imagePreviewModern = document.getElementById('image-preview-modern');
  const modernUploadArea = document.getElementById('modern-upload-area');
  const productFormTitle = document.getElementById('product-form-title');
  const saveProductBtn = document.getElementById('save-product-btn');
  const productIdInput = document.getElementById('product-id-modern');
  const productFormResponse = document.getElementById('modern-form-response');

  if (modernProductForm) modernProductForm.reset();
  if (productImageModern) productImageModern.value = '';
  if (imagePreviewModern) {
    imagePreviewModern.innerHTML = '';
    imagePreviewModern.style.display = 'none';
  }
  if (modernUploadArea) modernUploadArea.style.display = 'flex'; // Asegurarse de que el área de carga esté visible
  if (productFormTitle) productFormTitle.textContent = 'Agregar Nuevo Producto';
  if (saveProductBtn) saveProductBtn.querySelector('span').textContent = 'Guardar Producto';
  if (productIdInput) productIdInput.value = ''; // Limpiar ID del producto
  if (productFormResponse) { // Limpiar mensajes de respuesta
    productFormResponse.style.display = 'none';
    productFormResponse.innerHTML = '';
  }
}

// Función para cargar productos para las vistas de gestión (editar/eliminar)
async function loadProductsForManagement() {
  const editProductsGrid = document.getElementById('edit-products-grid');
  const deleteProductsGrid = document.getElementById('delete-products-grid');

  if (!editProductsGrid || !deleteProductsGrid) return;

  editProductsGrid.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando productos para edición...</p>
    </div>
  `;
  deleteProductsGrid.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando productos para eliminación...</p>
    </div>
  `;

  try {
    const response = await fetch(`${BASE_URL}/api/products`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const data = await response.json();
    const products = data.products || data;

    if (!Array.isArray(products)) throw new Error('Los productos no son un array');

    renderProductsForEdit(products);
    renderProductsForDelete(products);

  } catch (error) {
    console.error('Error cargando productos para gestión:', error);
    const errorMessage = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error cargando productos: ${error.message}</p>
        <button onclick="loadProductsForManagement()" class="btn-retry">
          <i class="fas fa-sync-alt"></i> Reintentar
        </button>
      </div>
    `;
    editProductsGrid.innerHTML = errorMessage;
    deleteProductsGrid.innerHTML = errorMessage;
  }
}

// Función para renderizar productos en la vista de edición
function renderProductsForEdit(products) {
  const editProductsGrid = document.getElementById('edit-products-grid');
  if (!editProductsGrid) return;

  if (products.length === 0) {
    editProductsGrid.innerHTML = `
      <div class="no-products">
        <i class="fas fa-utensils"></i>
        <p>No hay productos para editar.</p>
      </div>
    `;
    return;
  }

  editProductsGrid.innerHTML = products.map(product => `
    <div class="product-card" data-id="${product.id}">
      <img src="${getCorrectImagePath(product.imagen)}" alt="${product.nombre}" onerror="handleImageError(this)">
      <div class="product-info">
        <h3>${escapeHtml(product.nombre)}</h3>
        <p>$${convertToNumber(product.precio).toFixed(2)}</p>
        <div class="product-actions">
          <button onclick="editProduct('${product.id}')" class="btn-edit">
            <i class="fas fa-pencil-alt"></i> Editar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Función para renderizar productos en la vista de eliminación
function renderProductsForDelete(products) {
  const deleteProductsGrid = document.getElementById('delete-products-grid');
  if (!deleteProductsGrid) return;

  if (products.length === 0) {
    deleteProductsGrid.innerHTML = `
      <div class="no-products">
        <i class="fas fa-utensils"></i>
        <p>No hay productos para eliminar.</p>
      </div>
    `;
    return;
  }

  deleteProductsGrid.innerHTML = products.map(product => `
    <div class="product-card" data-id="${product.id}">
      <img src="${getCorrectImagePath(product.imagen)}" alt="${product.nombre}" onerror="handleImageError(this)">
      <div class="product-info">
        <h3>${escapeHtml(product.nombre)}</h3>
        <p>$${convertToNumber(product.precio).toFixed(2)}</p>
        <div class="product-actions">
          <button onclick="deleteProduct('${product.id}')" class="btn-delete">
            <i class="fas fa-trash-alt"></i> Eliminar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Función para cargar un producto en el formulario de edición
async function editProduct(productId) {
  try {
    const response = await fetch(`${BASE_URL}/api/products/${productId}`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const data = await response.json();
    const product = data.product;

    if (!product) throw new Error('Producto no encontrado');

    // Rellenar el formulario
    document.getElementById('product-id-modern').value = product.id;
    document.getElementById('product-name-modern').value = product.nombre;
    document.getElementById('product-price-modern').value = convertToNumber(product.precio);
    document.getElementById('product-type-modern').value = product.tipo;
    document.getElementById('product-description-modern').value = product.descripcion;

    // Mostrar la imagen actual
    const imagePreviewModern = document.getElementById('image-preview-modern');
    const modernUploadArea = document.getElementById('modern-upload-area');
    if (product.imagen) {
      imagePreviewModern.innerHTML = `<img src="${getCorrectImagePath(product.imagen)}" alt="${product.nombre}" style="max-width: 100%; max-height: 200px; object-fit: contain;">`;
      imagePreviewModern.style.display = 'block';
      modernUploadArea.style.display = 'none';
    } else {
      imagePreviewModern.style.display = 'none';
      modernUploadArea.style.display = 'flex';
    }

    // Cambiar el título del formulario y el texto del botón
    document.getElementById('product-form-title').textContent = 'Editar Producto';
    document.getElementById('save-product-btn').querySelector('span').textContent = 'Actualizar Producto';

    // Mostrar la vista de agregar/editar producto ANTES de rellenar el formulario
    document.getElementById('edit-product-view').style.display = 'none';
    document.getElementById('add-product-view').style.display = 'block';

    // Ahora que la vista está visible, los elementos deberían estar en el DOM
    // y accesibles.

  } catch (error) {
    console.error('Error al cargar producto para edición:', error);
    showError(error.message, 'modern-form-response');
  }
}

// Función para eliminar un producto
async function deleteProduct(productId) {
  showConfirmModal('¿Eliminar producto?', 'Esta acción eliminará el producto permanentemente.', async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No autenticado');

      const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el producto');
      }

      showSuccess('Producto eliminado exitosamente', 'delete-products-grid');
      loadProductsForManagement(); // Recargar la lista de productos para gestión
      loadProducts(); // Recargar productos en la vista principal
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      showError(error.message, 'delete-products-grid');
    }
  });
}

// Modificar el listener del botón "Administrar Productos" para abrir el modal principal
document.addEventListener('DOMContentLoaded', function() {
    const manageProductsBtn = document.getElementById('manage-products-btn');
    if (manageProductsBtn) {
        manageProductsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('product-management-modal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Asegurarse de que el panel de navegación principal esté visible
            document.getElementById('product-admin-nav').style.display = 'block';
            document.getElementById('add-product-view').style.display = 'none';
            document.getElementById('edit-product-view').style.display = 'none';
            document.getElementById('delete-product-view').style.display = 'none';
        });
    }

    // Configurar los botones de navegación dentro del modal de gestión de productos
    const productAdminNav = document.getElementById('product-admin-nav');
    if (productAdminNav) {
        const adminOptionCards = productAdminNav.querySelectorAll('.admin-option-card');
        adminOptionCards.forEach(card => {
            card.addEventListener('click', function() {
                const targetViewId = this.getAttribute('data-target');
                const targetView = document.getElementById(targetViewId);

                if (targetView) {
                    productAdminNav.style.display = 'none';
                    targetView.style.display = 'block';
                    
                    // Si es la vista de agregar, resetear el formulario
                    if (targetViewId === 'add-product-view') {
                        resetProductForm();
                    } else if (targetViewId === 'edit-product-view' || targetViewId === 'delete-product-view') {
                        loadProductsForManagement();
                    }
                }
            });
        });
    }

    const backToMainMenuButtons = document.querySelectorAll('.back-to-main-menu');
    backToMainMenuButtons.forEach(button => {
        button.addEventListener('click', function() {
            const adminPanels = document.querySelectorAll('.admin-panel');
            adminPanels.forEach(panel => {
                panel.style.display = 'none';
            });
            
            if (productAdminNav) {
                productAdminNav.style.display = 'block';
            }
        });
    });
});


function setupGoogleRegisterButton() {
  const googleBtn = document.getElementById('google-register-btn');
  
  if (googleBtn) {
    // Remover cualquier listener previo
    googleBtn.replaceWith(googleBtn.cloneNode(true));
    const newBtn = document.getElementById('google-register-btn');
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log("Redirigiendo a Google Auth...");
      window.location.href = `${BASE_URL}/api/auth/google`;
    });
  }
}


function setupRegistrationFormHandlers() {
  const form = document.getElementById('form-registro');
  if (form) {
    form.addEventListener('submit', handleRegistration);
  }
}

function setupLoginForm() {
  const loginForm = document.getElementById('form-login');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const responseDiv = document.getElementById('login-response');
      responseDiv.style.display = 'block';
      responseDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Iniciando sesión...</div>';
      responseDiv.className = 'loading';

      try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error en el inicio de sesión');
        }

        // Guardar token y actualizar UI
        localStorage.setItem('authToken', data.token);
        updateUserUI(data.user);
        
        // Mostrar mensaje de éxito
        responseDiv.innerHTML = `
          <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <h3>¡Bienvenido!</h3>
            <p>${data.user.nombre}</p>
          </div>
        `;
        responseDiv.className = 'success';

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          document.querySelector('#modal-login').style.display = 'none';
          document.body.style.overflow = 'auto';
        }, 2000);

      } catch (error) {
        console.error('Error en login:', error);
        responseDiv.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${error.message}</p>
          </div>
        `;
        responseDiv.className = 'error';
      }
    });
  }
}
function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
        return;
      }
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}

function checkAuth() {
  const token = localStorage.getItem('authToken') || new URLSearchParams(window.location.search).get('token');
  
  if (token) {
    try {
      const decoded = parseJwt(token);
      if (decoded) {
        updateUserUI({
          id: decoded.id,
          nombre: decoded.nombre,
          email: decoded.email,
          picture: decoded.picture
        });
        
        // Limpiar token de la URL si existe
        if (window.location.search.includes('token')) {
          const url = new URL(window.location);
          url.searchParams.delete('token');
          window.history.replaceState({}, '', url);
        }
        return true;
      }
    } catch (e) {
      console.error('Error verificando token:', e);
    }
  }
  return false;
}

function manualJWTDecode(token) {
  if (!token || typeof token !== 'string') {
    console.error('[Auth] Token no válido');
    return null;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[Auth] Formato de token incorrecto');
      return null;
    }
    
    const payloadBase64 = parts[1];
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = 4 - (base64.length % 4);
    const paddedBase64 = padLength < 4 ? base64 + '='.repeat(padLength) : base64;
    
    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[Auth] Error decodificando JWT:', error);
    return null;
  }
}



function showWelcomeMessage(nombre) {
    console.log('[UI] Mostrando mensaje de bienvenida para:', nombre);
    const toast = document.createElement('div');
    toast.className = 'welcome-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i> 
        ¡Bienvenido/a, ${nombre}!
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error parsing JWT:', e);
            return null;
        }
    }
  function isTokenExpired(token) {
        try {
            const decoded = parseJwt(token);
            if (!decoded.exp) return false;
            return Date.now() >= decoded.exp * 1000;
        } catch (e) {
            return true;
        }
    }

function clearAuthData() {
  console.log('[Auth] Limpiando datos de autenticación');
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
  updateUserUI(null);
}




function logout() {
  // 1. Mostrar mensaje de despedida
  const toast = document.createElement('div');
  toast.className = 'welcome-toast';
  toast.innerHTML = `
    <i class="fas fa-sign-out-alt"></i> 
    ¡Hasta pronto! Cerrando sesión...
  `;
  document.body.appendChild(toast);
  
  // 2. Limpiar datos de autenticación
  localStorage.removeItem('authToken');
  sessionStorage.clear();
  
  // 3. Cerrar todos los modales abiertos
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
  
  // 4. Deshabilitar temporalmente los botones para evitar acciones durante el logout
  document.querySelectorAll('button').forEach(btn => {
    btn.disabled = true;
  });
  
  // 5. Ocultar el toast después de 1.5 segundos
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 500);
    
    // 6. Recargar la página para limpiar el estado
    setTimeout(() => {
      window.location.href = `${BASE_URL}/index.html`;
      window.location.reload(true); // Recarga forzada
    }, 500);
  }, 1500);
}
function checkAdminStatus(userData) {
  return userData && userData.email === 'paellagiobel@gmail.com';
}


// Función para cargar todos los comentarios (aprobados y pendientes)
async function cargarTodosLosComentarios() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No autenticado');

    const response = await fetch(`${BASE_URL}/api/comentarios/todos`, { // Nueva ruta para todos los comentarios
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const data = await response.json();
    mostrarTodosLosComentarios(data.comentarios);
  } catch (error) {
    console.error('Error al cargar todos los comentarios:', error);
    document.getElementById('lista-todos-comentarios').innerHTML = `
      <div class="alert alert-error">
        <i class="fas fa-exclamation-circle"></i> ${error.message}
      </div>
    `;
  }
}

// Función para mostrar todos los comentarios en el modal con opción de eliminar
function mostrarTodosLosComentarios(comentarios) {
  const contenedor = document.getElementById('lista-todos-comentarios');
  
  if (comentarios.length === 0) {
    contenedor.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #666;">
        <i class="fas fa-comment-slash" style="color: var(--dark-color);"></i>
        No hay comentarios para eliminar.
      </div>
    `;
    return;
  }
  
  contenedor.innerHTML = comentarios.map(comentario => `
    <div class="comentario-gestion-item" id="comentario-gestion-${comentario.id}" style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px;
      border-bottom: 1px solid #eee;
      background-color: white;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    ">
      <div style="display: flex; align-items: center; flex-grow: 1;">
        ${comentario.imagen_usuario ? 
          `<img src="${comentario.imagen_usuario}" class="user-avatar-comment" alt="${comentario.nombre_usuario}"
               style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 15px; border: 2px solid #a8dadc;">` : 
          `<div class="user-avatar-comment" style="width: 50px; height: 50px; border-radius: 50%; background-color: #a8dadc; color: white; 
               display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">
            ${comentario.nombre_usuario.charAt(0).toUpperCase()}
          </div>`
        }
        <div class="comentario-user-info">
          <div class="user-name-comment" style="font-weight: 600; color: #333; margin-bottom: 3px;">${comentario.nombre_usuario}</div>
          <div class="comment-date" style="font-size: 0.85rem; color: #777;">
            ${new Date(comentario.created_at).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}
            ${comentario.aprobado ? '<span style="color: #52c41a; margin-left: 10px;"><i class="fas fa-check-circle"></i> Aprobado</span>' : '<span style="color: #faad14; margin-left: 10px;"><i class="fas fa-hourglass-half"></i> Pendiente</span>'}
          </div>
          <div class="comment-text" style="color: #555; font-size: 0.95rem; margin-top: 5px;">
            ${comentario.comentario.substring(0, 70)}${comentario.comentario.length > 70 ? '...' : ''}
          </div>
        </div>
      </div>
      <div class="comentario-acciones">
        <button class="btn-eliminar-comentario" onclick="eliminarComentarioAdmin(${comentario.id})"
                style="padding: 8px 15px; background-color: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
          <i class="fas fa-trash-alt"></i> Eliminar
        </button>
      </div>
    </div>
  `).join('');
}

window.eliminarComentarioAdmin = async function(id) {
  showConfirmModal('¿Eliminar comentario?', 'Esta acción eliminará el comentario permanentemente.', async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No autenticado');

      const response = await fetch(`${BASE_URL}/api/comentarios/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el comentario');
      }

      // Eliminar el comentario de la UI
      const comentarioElement = document.getElementById(`comentario-gestion-${id}`);
      if (comentarioElement) {
        comentarioElement.remove();
      }
      
      showSuccess('Comentario eliminado exitosamente', 'lista-todos-comentarios'); // Mostrar éxito en la lista
      cargarTodosLosComentarios(); // Recargar la lista para actualizar el estado
      updatePendingCommentsCount(); // Actualizar el contador de pendientes
      loadComments(); // Recargar los comentarios en la sección de opiniones
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      showError(error.message, 'lista-todos-comentarios');
    }
  });
};


// Actualizar contador de comentarios pendientes
async function updatePendingCommentsCount() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch(`${BASE_URL}/api/comentarios/pendientes`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const data = await response.json();
    const badge = document.getElementById('pending-comments-badge');
    
    if (badge && data.comentarios) {
      badge.textContent = data.comentarios.length;
      badge.style.display = data.comentarios.length > 0 ? 'inline-block' : 'none';
      
      // Actualizar también el contador del modal
      const contadorModal = document.getElementById('contador-comentarios');
      if (contadorModal) {
        contadorModal.textContent = `${data.comentarios.length} comentarios por revisar`;
      }
    }
  } catch (error) {
    console.error('Error al actualizar contador:', error);
  }
}


async function loginUser(credentials) {
  try {
    console.log('Credenciales enviadas:', credentials);
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Detalles del error:', errorData);
      throw new Error(errorData.error || 'Error en autenticación');
    }

    return await response.json();
  } catch (error) {
    console.error('Error completo:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}
// Asegúrate que el formulario envía los datos correctamente
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const responseDiv = document.getElementById('login-response');
  responseDiv.style.display = 'block';
  responseDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Iniciando sesión...</div>';
  responseDiv.className = 'loading';

  try {
    const credentials = {
      email: document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value
    };

    // Verifica que las credenciales sean las correctas
    console.log('Intentando login con:', credentials); // ← Añade esto para debug
    
    const response = await loginUser(credentials);
    
    // Guardar el token en localStorage
    localStorage.setItem('authToken', response.token);
    
    // Mostrar mensaje de éxito
    responseDiv.innerHTML = `
      <div class="success-message">
        <i class="fas fa-check-circle"></i>
        <h3>¡Bienvenido de nuevo!</h3>
        <p>${response.user.nombre}</p>
      </div>
    `;
    responseDiv.className = 'success';
    
    // Actualizar la UI
    updateUserUI(response.user);
    
    // Cerrar el modal después de 2 segundos
    setTimeout(() => {
      document.querySelector('#modal-login').style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 2000);

  } catch (error) {
    console.error('Error en login:', error);
    responseDiv.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>${error.message}</p>
      </div>
    `;
    responseDiv.className = 'error';
  }
});


function updateUserUI(userData) {
  const userNav = document.getElementById('user-nav');
  if (!userNav) return;

  // Limpiar contenedor
  userNav.innerHTML = '';

  if (userData) {
    const isAdmin = checkAdminStatus(userData);
    
    // Crear contenedor principal para el usuario
    const userContainer = document.createElement('div');
    userContainer.className = 'user-container';
    userContainer.style.display = 'flex';
    userContainer.style.alignItems = 'center';
    userContainer.style.gap = '10px';
    userContainer.style.position = 'relative';

    // Avatar del usuario
    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.style.width = '40px';
    avatar.style.height = '40px';
    avatar.style.borderRadius = '50%';
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.fontWeight = 'bold';
    avatar.style.cursor = 'pointer';
    avatar.style.transition = 'all 0.3s ease';

    if (userData.picture) {
      avatar.innerHTML = `<img src="${userData.picture}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Avatar">`;
    } else {
      const initials = userData.nombre ? userData.nombre.charAt(0).toUpperCase() : 'U';
      avatar.textContent = initials;
      avatar.style.backgroundColor = isAdmin ? '#e63946' : '#1d3557';
      avatar.style.color = 'white';
    }

    // Nombre del usuario
    const userName = document.createElement('span');
    userName.className = 'user-name';
    userName.textContent = isAdmin ? 'Administrador' : userData.nombre;
    userName.style.fontWeight = '600';
    userName.style.transition = 'all 0.3s ease';
    
    if (isAdmin) {
      userName.style.color = '#e63946';
      userName.style.textShadow = '0 0 5px rgba(230, 57, 70, 0.3)';
    }

    // Botón de cerrar sesión (visible junto al nombre)
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.id = 'logout-btn';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
    logoutBtn.style.marginLeft = '10px';
    logoutBtn.style.color = '#e63946';
    logoutBtn.style.textDecoration = 'none';
    logoutBtn.style.transition = 'all 0.3s ease';
    logoutBtn.style.fontSize = '1.1rem';

    // Efecto hover para el botón de logout
    logoutBtn.addEventListener('mouseenter', () => {
      logoutBtn.style.transform = 'scale(1.2)';
    });
    logoutBtn.addEventListener('mouseleave', () => {
      logoutBtn.style.transform = 'scale(1)';
    });

    // Evento para cerrar sesión
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });

    // Agregar elementos al contenedor
    userContainer.appendChild(avatar);
    userContainer.appendChild(userName);
    userContainer.appendChild(logoutBtn);
    userNav.appendChild(userContainer);

    // Actualizar UI de comentarios
    updateCommentButtons(isAdmin);
    updateAdminButtonVisibility(isAdmin); // Pasar isAdmin
    updateGalleryAdminButtonVisibility(isAdmin); // Asegurarse de que se llama
    updateAccountsAdminButtonVisibility(isAdmin); // Nuevo: Asegurarse de que se llama

    // Mostrar mensaje especial si es admin
    if (isAdmin) {
      showAdminWelcome();
    }
    
  } else {
    // Estado no autenticado - mostrar botones de login/registro
    userNav.innerHTML = `
      <a href="#modal-login" class="btn-login modal-trigger">
        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
      </a>
      <span style="margin: 0 5px; color: rgba(29, 53, 87, 0.3);">|</span>
      <a href="#modal-registro" class="btn-registro modal-trigger">
        <i class="fas fa-user-plus"></i> Registrarse
      </a>
    `;
    
    // Ocultar botones de administración
    updateAdminButtonVisibility(false); // Pasar false
    updateCommentButtons(false);
    updateGalleryAdminButtonVisibility(false); // Asegurarse de que se llama
  }
  setupModals();
}

// Función auxiliar para mostrar bienvenida a admin
function showAdminWelcome() {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = '#e63946';
  toast.style.color = 'white';
  toast.style.padding = '15px 25px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
  toast.style.zIndex = '10000';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.animation = 'slideIn 0.5s forwards';
  toast.innerHTML = `
    <i class="fas fa-crown" style="font-size: 1.2rem;"></i>
    <div>
      <strong>Modo Administrador</strong>
      <div style="font-size: 0.9rem;">Tienes acceso completo al sistema</div>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.5s forwards';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function updateCommentButtons(isAdmin) {
  const addCommentContainer = document.getElementById('add-comment-container');
  if (!addCommentContainer) return;

  // Limpiar contenedor
  addCommentContainer.innerHTML = '';
  addCommentContainer.style.display = 'none';

  if (isAdmin) {
    // Botón de gestión para admin
    const gestionBtn = document.createElement('button');
    gestionBtn.id = 'gestion-comentarios-btn';
    gestionBtn.className = 'btn-submit';
    gestionBtn.innerHTML = `
      <i class="fas fa-tasks"></i> Gestionar Comentarios
      <span class="badge" id="pending-comments-badge" style="
        background-color: #e63946;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 0.8rem;
        margin-left: 5px;
        display: none;
      "></span>
    `;
    
    gestionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('#modal-gestion-comentarios').style.display = 'block';
      // Por defecto, cargar comentarios pendientes al abrir el modal
      document.getElementById('lista-comentarios-pendientes').style.display = 'block';
      document.getElementById('lista-todos-comentarios').style.display = 'none';
      document.getElementById('btn-ver-pendientes').classList.add('active');
      document.getElementById('btn-eliminar-comentarios').classList.remove('active');
      cargarComentariosPendientes();
    });
    
    addCommentContainer.appendChild(gestionBtn);
    addCommentContainer.style.display = 'block';
    updatePendingCommentsCount();
  } else if (localStorage.getItem('authToken')) {
    // Botón normal para usuarios autenticados
    const addCommentBtn = document.createElement('button');
    addCommentBtn.id = 'add-comment-btn';
    addCommentBtn.className = 'btn-submit';
    addCommentBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Comparte tu experiencia';
    addCommentBtn.addEventListener('click', () => {
      document.getElementById('comment-modal').style.display = 'block';
    });
    
    addCommentContainer.appendChild(addCommentBtn);
    addCommentContainer.style.display = 'block';
  }
}

// Función para cargar todos los comentarios (aprobados y pendientes)
async function cargarTodosLosComentarios() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No autenticado');

    const response = await fetch(`${BASE_URL}/api/comentarios/todos`, { // Nueva ruta para todos los comentarios
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const data = await response.json();
    mostrarTodosLosComentarios(data.comentarios);
  } catch (error) {
    console.error('Error al cargar todos los comentarios:', error);
    document.getElementById('lista-todos-comentarios').innerHTML = `
      <div class="alert alert-error">
        <i class="fas fa-exclamation-circle"></i> ${error.message}
      </div>
    `;
  }
}

// Función para mostrar todos los comentarios en el modal con opción de eliminar
function mostrarTodosLosComentarios(comentarios) {
  const contenedor = document.getElementById('lista-todos-comentarios');
  
  if (comentarios.length === 0) {
    contenedor.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #666;">
        <i class="fas fa-comment-slash" style="color: var(--dark-color);"></i>
        No hay comentarios para eliminar.
      </div>
    `;
    return;
  }
  
  contenedor.innerHTML = comentarios.map(comentario => `
    <div class="comentario-gestion-item" id="comentario-gestion-${comentario.id}" style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px;
      border-bottom: 1px solid #eee;
      background-color: white;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    ">
      <div style="display: flex; align-items: center; flex-grow: 1;">
        ${comentario.imagen_usuario ? 
          `<img src="${comentario.imagen_usuario}" class="user-avatar-comment" alt="${comentario.nombre_usuario}"
               style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 15px; border: 2px solid #a8dadc;">` : 
          `<div class="user-avatar-comment" style="width: 50px; height: 50px; border-radius: 50%; background-color: #a8dadc; color: white; 
               display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">
            ${comentario.nombre_usuario.charAt(0).toUpperCase()}
          </div>`
        }
        <div class="comentario-user-info">
          <div class="user-name-comment" style="font-weight: 600; color: #333; margin-bottom: 3px;">${comentario.nombre_usuario}</div>
          <div class="comment-date" style="font-size: 0.85rem; color: #777;">
            ${new Date(comentario.created_at).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}
            ${comentario.aprobado ? '<span style="color: #52c41a; margin-left: 10px;"><i class="fas fa-check-circle"></i> Aprobado</span>' : '<span style="color: #faad14; margin-left: 10px;"><i class="fas fa-hourglass-half"></i> Pendiente</span>'}
          </div>
          <div class="comment-text" style="color: #555; font-size: 0.95rem; margin-top: 5px;">
            ${comentario.comentario.substring(0, 70)}${comentario.comentario.length > 70 ? '...' : ''}
          </div>
        </div>
      </div>
      <div class="comentario-acciones">
        <button class="btn-eliminar-comentario" onclick="eliminarComentarioAdmin(${comentario.id})"
                style="padding: 8px 15px; background-color: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
          <i class="fas fa-trash-alt"></i> Eliminar
        </button>
      </div>
    </div>
  `).join('');
}

window.eliminarComentarioAdmin = async function(id) {
  showConfirmModal('¿Eliminar comentario?', 'Esta acción eliminará el comentario permanentemente.', async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No autenticado');

      const response = await fetch(`${BASE_URL}/api/comentarios/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el comentario');
      }

      // Eliminar el comentario de la UI
      const comentarioElement = document.getElementById(`comentario-gestion-${id}`);
      if (comentarioElement) {
        comentarioElement.remove();
      }
      
      showSuccess('Comentario eliminado exitosamente', 'lista-todos-comentarios'); // Mostrar éxito en la lista
      cargarTodosLosComentarios(); // Recargar la lista para actualizar el estado
      updatePendingCommentsCount(); // Actualizar el contador de pendientes
      loadComments(); // Recargar los comentarios en la sección de opiniones
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      showError(error.message, 'lista-todos-comentarios');
    }
  });
};



async function handleLogin(credentials) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            updateUserUI(data.user);  // Actualiza la UI inmediatamente
            setupCommentSystem();      // Vuelve a configurar el sistema de comentarios
            return true;
        } else {
            throw new Error(data.error || 'Error en el login');
        }
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}





function setupGoogleLogin() {
  const googleLoginBtn = document.getElementById('google-login-btn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Cierra el modal de login
      document.querySelector('#modal-login').style.display = 'none';
      // Redirige a la autenticación de Google
      window.location.href = '${BASE_URL}/api/auth/google';
    });
  }
}
async function resendVerificationCode() {
    const email = document.getElementById('email').value;
    const resendBtn = document.getElementById('resend-code');
    const countdownElement = document.querySelector('#countdown span');

    if (!email) {
        alert('Por favor, ingresa tu correo electrónico primero.');
        return;
    }

    // Deshabilitar el botón temporalmente para evitar spam
    resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    resendBtn.disabled = true;

    try {
        const response = await fetch(`${BASE_URL}/api/auth/send-verification`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Request-Source': 'web-client'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al reenviar el código');
        }

        // Reiniciar el contador
        startCountdown(15 * 60);

        // Mostrar mensaje de éxito
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert success';
        alertDiv.innerHTML = `<i class="fas fa-check-circle"></i> ¡Código reenviado! Revisa tu correo.`;
        document.getElementById('verification-form').prepend(alertDiv);

        // Ocultar mensaje después de 3 segundos
        setTimeout(() => alertDiv.remove(), 3000);

    } catch (error) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert error';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
        document.getElementById('verification-form').prepend(alertDiv);
    } finally {
        // Restaurar el botón después de 30 segundos (para evitar spam)
        setTimeout(() => {
            resendBtn.innerHTML = '<i class="fas fa-redo"></i> No recibí el código, reenviar';
            resendBtn.disabled = false;
        }, 30000); // 30 segundos de cooldown
    }
}


class VerificationSystem {
  constructor() {
    this.registrationData = {};
    this.timer = null;
    
    document.getElementById('register-form').addEventListener('submit', this.handleRegisterSubmit.bind(this));
    document.getElementById('verification-form').addEventListener('submit', this.handleVerificationSubmit.bind(this));
   document.getElementById('resend-code')?.addEventListener('click', (e) => {
    e.preventDefault();
    resendVerificationCode();
});
  }
  // ... (eliminar todo el resto de la clase)
}

// Función para cargar y configurar la galería
async function setupGallery() {
  const galleryGrid = document.querySelector('.gallery-grid');
  if (!galleryGrid) return;

  try {
    const response = await fetch(`${BASE_URL}/api/gallery`);
    if (!response.ok) throw new Error('Error al cargar imágenes de la galería');
    
    const data = await response.json();
    const images = data.images || [];

    if (images.length === 0) {
      galleryGrid.innerHTML = `
        <div class="no-images" style="text-align: center; padding: 40px; color: #666; width: 100%;">
          <i class="fas fa-image" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
          No hay imágenes en la galería.
        </div>
      `;
      return;
    }

    galleryGrid.innerHTML = images.map(image => `
      <div class="gallery-item">
        <img src="${getCorrectImagePath('gallery/' + image.filename)}" alt="${image.caption || 'Imagen de galería'}" data-full="${getCorrectImagePath('gallery/' + image.filename)}">
        <div class="gallery-overlay">
          <button class="gallery-view" aria-label="Ver imagen ampliada"><i class="fas fa-expand"></i></button>
          <button class="gallery-download" aria-label="Descargar imagen"><i class="fas fa-download"></i></button>
          <button class="gallery-share" aria-label="Compartir imagen"><i class="fas fa-share-alt"></i></button>
        </div>
        <div class="gallery-caption">${escapeHtml(image.caption || 'Sin título')}</div>
      </div>
    `).join('');

    // Re-adjuntar listeners para la funcionalidad del modal de galería
    setupGalleryModalListeners();

  } catch (error) {
    console.error('Error cargando galería:', error);
    galleryGrid.innerHTML = `
      <div class="alert alert-error" style="text-align: center; padding: 20px; width: 100%;">
        <i class="fas fa-exclamation-circle"></i> Error al cargar la galería.
      </div>
    `;
  }
}

function setupGalleryModalListeners() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-image');
    const modalCaption = document.getElementById('modal-caption');
    const closeBtn = document.querySelector('#gallery-modal .modal-close');
    const downloadBtn = document.getElementById('download-btn');
    const shareBtn = document.getElementById('share-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    let currentIndex = 0;
    let images = [];
    
    // Recopilar todas las imágenes
    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        images.push({
            src: img.getAttribute('data-full'),
            alt: img.getAttribute('alt')
        });
        
        // Configurar clic para abrir modal
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('gallery-view') && 
                !e.target.classList.contains('gallery-download') && 
                !e.target.classList.contains('gallery-share')) {
                openModal(index);
            }
        });
        
        // Botones de acción en miniatura
        const viewBtn = item.querySelector('.gallery-view');
        const downloadBtnThumb = item.querySelector('.gallery-download');
        const shareBtnThumb = item.querySelector('.gallery-share');
        
        if (viewBtn) viewBtn.addEventListener('click', () => openModal(index));
        if (downloadBtnThumb) downloadBtnThumb.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadImage(img.src, img.alt);
        });
        if (shareBtnThumb) shareBtnThumb.addEventListener('click', (e) => {
            e.stopPropagation();
            shareImage(img.src, img.alt);
        });
    });
    
    // Abrir modal
    function openModal(index) {
        currentIndex = index;
        modal.style.display = 'block';
        modalImg.src = images[index].src;
        modalImg.alt = images[index].alt;
        modalCaption.textContent = images[index].alt;
        document.body.style.overflow = 'hidden';
    }
    
    // Cerrar modal
    if (closeBtn) closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Cerrar al hacer clic fuera
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Navegación
    function showImage(index) {
        if (index >= 0 && index < images.length) {
            currentIndex = index;
            modalImg.src = images[index].src;
            modalImg.alt = images[index].alt;
            modalCaption.textContent = images[index].alt;
            modalImg.style.animation = 'none';
            setTimeout(() => {
                modalImg.style.animation = 'zoomIn 0.3s';
            }, 10);
        }
    }
    
    if (prevBtn) prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
    
    // Teclado
    document.addEventListener('keydown', (e) => {
        if (modal && modal.style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                showImage(currentIndex - 1);
            } else if (e.key === 'ArrowRight') {
                showImage(currentIndex + 1);
            } else if (e.key === 'Escape') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
    });
    
    // Descargar imagen
    if (downloadBtn) downloadBtn.addEventListener('click', () => {
        downloadImage(images[currentIndex].src, images[currentIndex].alt);
    });
    
    function downloadImage(src, alt) {
        const link = document.createElement('a');
        link.href = src;
        link.download = `paella-giobel-${alt.toLowerCase().replace(/\s+/g, '-')}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Compartir imagen
    if (shareBtn) shareBtn.addEventListener('click', () => {
        shareImage(images[currentIndex].src, images[currentIndex].alt);
    });
    
    function shareImage(src, alt) {
        if (navigator.share) {
            navigator.share({
                title: `Paella Giobel - ${alt}`,
                text: 'Mira esta deliciosa paella de Paella Giobel',
                url: src
            }).catch(err => {
                console.log('Error al compartir:', err);
                fallbackShare(src);
            });
        } else {
            fallbackShare(src);
        }
    }
    
    function fallbackShare(src) {
        // Copiar al portapapeles
        navigator.clipboard.writeText(src).then(() => {
            alert('Enlace de la imagen copiado al portapapeles');
        }).catch(err => {
            console.error('Error al copiar:', err);
            prompt('Copie este enlace para compartir:', src);
        });
    }
}


let isAdminLoggedIn = false;


function setupAdminLogin() {
  const adminLoginForm = document.getElementById('form-admin-login');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const usuario = document.getElementById('admin-usuario').value;
      const password = document.getElementById('admin-password').value;
      const responseDiv = document.getElementById('admin-login-response');
      
      // Validación simple (en producción usa autenticación segura)
      if (usuario === 'giobel' && password === 'giobel') {
        isAdminLoggedIn = true;
        responseDiv.style.display = 'block';
        responseDiv.innerHTML = `
          <div class="alert alert-success">
            <i class="fas fa-check-circle"></i> Acceso concedido
          </div>
        `;
        
        // Cerrar modal después de 1 segundo
        setTimeout(() => {
          document.querySelector('#modal-admin-login').style.display = 'none';
          updateAdminButtonVisibility();
        }, 1000);
      } else {
        isAdminLoggedIn = false;
        responseDiv.style.display = 'block';
        responseDiv.innerHTML = `
          <div class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i> Credenciales incorrectas
          </div>
        `;
      }
    });
  }
}

// Función para cargar comentarios pendientes
async function cargarComentariosPendientes() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch(`${BASE_URL}/api/comentarios/pendientes`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const data = await response.json();
    mostrarComentariosPendientes(data.comentarios);
    
    // Actualizar contador
    const badge = document.getElementById('pending-comments-badge');
    if (badge) {
      badge.textContent = data.comentarios.length;
      badge.style.display = data.comentarios.length > 0 ? 'inline-block' : 'none';
    }
    
    const contadorModal = document.getElementById('contador-comentarios');
    if (contadorModal) {
      contadorModal.textContent = `${data.comentarios.length} comentarios por revisar`;
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('lista-comentarios-pendientes').innerHTML = `
      <div class="alert alert-error">
        <i class="fas fa-exclamation-circle"></i> ${error.message}
      </div>
    `;
  }
}

// Función para mostrar comentarios pendientes en el modal
function mostrarComentariosPendientes(comentarios) {
  const contenedor = document.getElementById('lista-comentarios-pendientes');
  const contador = document.getElementById('contador-comentarios');
  
  contador.textContent = `${comentarios.length} comentarios por revisar`;
  
  if (comentarios.length === 0) {
    contenedor.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #666;">
        <i class="fas fa-check-circle" style="color: #52c41a;"></i>
        No hay comentarios pendientes
      </div>
    `;
    return;
  }
  
  contenedor.innerHTML = comentarios.map(comentario => `
    <div class="comentario-pendiente" id="comentario-${comentario.id}">
      <div class="comentario-header">
        ${comentario.imagen_usuario ? 
          `<img src="${comentario.imagen_usuario}" class="user-avatar-comment" alt="${comentario.nombre_usuario}"
               style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 15px; border: 2px solid #e67e22;">` : 
          `<div class="user-avatar-comment" style="width: 50px; height: 50px; border-radius: 50%; background-color: #e67e22; color: white; 
               display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">
            ${comentario.nombre_usuario.charAt(0).toUpperCase()}
          </div>`
        }
        <div class="comentario-user-info">
          <div class="user-name-comment" style="font-weight: 600; color: #333; margin-bottom: 3px;">${comentario.nombre_usuario}</div>
          <div class="comment-date" style="font-size: 0.85rem; color: #777;">
            ${new Date(comentario.created_at).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}
          </div>
        </div>
      </div>
      <div class="stars" style="color: #FFD700; margin: 10px 0;">
        ${'★'.repeat(comentario.estrellas)}${'☆'.repeat(5 - comentario.estrellas)}
      </div>
      <div class="comentario-texto" style="color: #333; line-height: 1.6;">
        ${comentario.comentario}
      </div>
      <div class="comentario-acciones" style="margin-top: 15px;">
        <button class="btn-aprobar" onclick="aprobarComentario(${comentario.id})" 
                style="padding: 8px 15px; background-color: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
          <i class="fas fa-check"></i> Aprobar
        </button>
        <button class="btn-rechazar" onclick="rechazarComentario(${comentario.id})"
                style="padding: 8px 15px; background-color: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer;">
          <i class="fas fa-times"></i> Rechazar
        </button>
      </div>
    </div>
  `).join('');
}
window.aprobarComentario = async function(id) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No autenticado');

    const response = await fetch(`${BASE_URL}/api/comentarios/${id}/aprobar`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al aprobar');
    }

    // Actualizar la lista de comentarios aprobados
    const comentarioAprobado = data.comentario;
    const comentariosContainer = document.getElementById('comentarios-container');
    
    // Crear el nuevo elemento de comentario
    const nuevoComentario = document.createElement('div');
    nuevoComentario.className = 'testimonial-card';
    nuevoComentario.innerHTML = `
      <div class="testimonial-header">
        ${comentarioAprobado.imagen_usuario ? 
          `<img src="${comentarioAprobado.imagen_usuario}" class="user-avatar-comment" alt="${comentarioAprobado.nombre_usuario}"
               style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 15px; border: 2px solid #e67e22;">` : 
          `<div class="user-avatar-comment" style="width: 50px; height: 50px; border-radius: 50%; background-color: #e67e22; color: white; 
               display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px;">
            ${comentarioAprobado.nombre_usuario.charAt(0).toUpperCase()}
          </div>`
        }
        <div class="user-info-comment">
          <div class="user-name-comment" style="font-weight: 600; color: #333; margin-bottom: 3px;">${comentarioAprobado.nombre_usuario}</div>
          <div class="comment-date" style="font-size: 0.85rem; color: #777;">
            ${new Date(comentarioAprobado.created_at).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}
          </div>
        </div>
      </div>
      <div class="stars" style="color: #FFD700; font-size: 1.1rem; margin: 10px 0;">
        ${'★'.repeat(comentarioAprobado.estrellas)}${'☆'.repeat(5 - comentarioAprobado.estrellas)}
      </div>
      <div class="comment-text" style="color: #333; line-height: 1.6;">
        ${comentarioAprobado.comentario}
      </div>
    `;

    // Agregar el comentario al inicio de la lista
    comentariosContainer.insertBefore(nuevoComentario, comentariosContainer.firstChild);

    // Actualizar la lista de comentarios pendientes
    if (data.pendientes) {
      mostrarComentariosPendientes(data.pendientes);
    }

    // Actualizar contador
    updatePendingCommentsCount();
    // Recalcular y mostrar el promedio de estrellas
    loadComments(); // Esto recargará los comentarios y actualizará el promedio

  } catch (error) {
    console.error('Error al aprobar comentario:', error);
    alert(error.message);
  }
};

async function loadApprovedComments() {
  try {
    const response = await fetch(`${BASE_URL}/api/comentarios`);
    if (!response.ok) throw new Error('Error al cargar comentarios');
    
    const data = await response.json();
    renderComments(data.comentarios);
    calculateAndDisplayAverageRating(data.comentarios); // Asegurar que se actualiza el promedio
  } catch (error) {
    console.error('Error:', error);
  }
}
window.rechazarComentario = async function(id) {
  // Crear modal de confirmación personalizado
  const confirmModal = document.createElement('div');
  confirmModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 400px;
    text-align: center;
  `;
  
  modalContent.innerHTML = `
    <h3 style="margin-top: 0;">¿Rechazar comentario?</h3>
    <p>Esta acción no se puede deshacer</p>
    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
      <button id="confirm-rechazar" style="padding: 8px 15px; background: #e63946; color: white; border: none; border-radius: 4px;">Sí, rechazar</button>
      <button id="cancel-rechazar" style="padding: 8px 15px; background: #ddd; border: none; border-radius: 4px;">Cancelar</button>
    </div>
  `;
  
  confirmModal.appendChild(modalContent);
  document.body.appendChild(confirmModal);
  
  // Manejar confirmación
  document.getElementById('confirm-rechazar').addEventListener('click', async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BASE_URL}/api/comentarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Error al rechazar');
      
      // Actualizar UI
      const comentario = document.getElementById(`comentario-${id}`);
      comentario.classList.add('rechazado');
      
      setTimeout(() => {
        comentario.remove();
        updatePendingCommentsCount();
        actualizarContador();
        document.body.removeChild(confirmModal);
        loadComments(); // Recargar los comentarios para actualizar el promedio
      }, 500);
      
    } catch (error) {
      alert(error.message);
      document.body.removeChild(confirmModal);
    }
  });
  
  // Manejar cancelación
  document.getElementById('cancel-rechazar').addEventListener('click', () => {
    document.body.removeChild(confirmModal);
  });
};

// Función para actualizar el contador visual
function actualizarContador() {
  const pendientes = document.querySelectorAll('.comentario-pendiente:not(.aprobado):not(.rechazado)').length;
  const contadorElement = document.getElementById('contador-comentarios');
  const badgeElement = document.getElementById('pending-comments-badge');
  
  if (contadorElement) {
    contadorElement.textContent = `${pendientes} comentarios por revisar`;
  }
  
  if (badgeElement) {
    badgeElement.textContent = pendientes;
    badgeElement.style.display = pendientes > 0 ? 'inline-block' : 'none';
  }
}


// Función para cargar productos desde la API
// script.js - Función loadProducts corregida
async function loadProducts() {
  const productGrid = document.getElementById('dynamic-products-container');
  if (!productGrid) return;

  try {
    // Mostrar estado de carga
    productGrid.innerHTML = `
      <div class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando productos...</p>
      </div>
    `;

    const response = await fetch(`${BASE_URL}/api/products`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // Validar estructura de datos
    if (!data || (!data.products && !Array.isArray(data))) {
      throw new Error('Formato de datos inválido');
    }

    // Manejar tanto {products: [...]} como [...]
    const products = data.products || data;
    
    if (!Array.isArray(products)) {
      throw new Error('Los productos no son un array');
    }

    renderProducts(products);
    
  } catch (error) {
    console.error('Error cargando productos:', error);
    showError('No se pudieron cargar los productos. Intente recargar la página.');
    
    productGrid.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error cargando productos</p>
        <button onclick="loadProducts()" class="btn-retry">
          <i class="fas fa-sync-alt"></i> Reintentar
        </button>
      </div>
    `;
  }
}
async function renderProducts(products) {
  const productGrid = document.getElementById('dynamic-products-container');
  if (!productGrid) {
    console.error('Contenedor de productos no encontrado');
    return;
  }

  // Limpiar contenedor
  productGrid.innerHTML = '';

  if (!products || products.length === 0) {
    productGrid.innerHTML = `
      <div class="no-products">
        <i class="fas fa-utensils"></i>
        <p>No hay productos disponibles</p>
      </div>
    `;
    return;
  }

  // Crear fragmento para mejor performance
  const fragment = document.createDocumentFragment();

  products.forEach(product => {
    try {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.dataset.id = product.id || '';

      // Convertir precio a número seguro
      const precio = convertToNumber(product.precio);
      
      // Crear elemento de imagen con manejo seguro
      const img = new Image();
      img.alt = product.nombre || 'Imagen de producto';
      img.loading = 'lazy';
      img.onerror = () => {
        img.src = '/img/default-paella.jpg';
        img.style.opacity = '0.8';
        img.onerror = null; // Prevenir bucles
      };
      img.src = getCorrectImagePath(product.imagen);

      productCard.innerHTML = `
        <div class="product-image-container"></div>
        <div class="product-info">
          <h3>${escapeHtml(product.nombre || 'Producto sin nombre')}</h3>
          <p>${escapeHtml(product.descripcion?.substring(0, 100) || '')}${product.descripcion?.length > 100 ? '...' : ''}</p>
          <div class="product-meta">
            <span class="product-price">$${precio.toFixed(2)}</span>
            <span class="product-type">${getTypeName(product.tipo)}</span>
          </div>
        </div>
      `;

      // Insertar la imagen configurada
      productCard.querySelector('.product-image-container').appendChild(img);
      fragment.appendChild(productCard);
    } catch (error) {
      console.error('Error renderizando producto:', product, error);
    }
  });

  productGrid.appendChild(fragment);
  animateProductCards();
}

// Función auxiliar para convertir a número seguro
function convertToNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}


// Función para escapar HTML
function escapeHtml(unsafe) {
  return unsafe?.toString()?.replace(/[&<>"']/g, '') || '';
}


// Función para manejar errores de imágenes
function setupImageErrorHandling() {
  document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
      const img = e.target;
      // Solo manejar si no es ya la imagen por defecto
      if (!img.src.includes('default-paella.jpg')) {
        img.src = 'client/img/default-paella.jpg';
        img.style.opacity = '0.8';
        // Remover el listener para prevenir bucles
        img.onerror = null;
      } else {
        img.style.display = 'none';
      }
    }
  }, true); // Usar captura para manejar todos los errores
}

function animateProductCards() {
  const cards = document.querySelectorAll('.product-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `all 0.5s ease ${index * 0.1}s`;
    
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 50);
  });
}
// Efecto al pasar el ratón sobre las acciones
function setupProductHoverEffects() {
  document.querySelectorAll('.product-actions button').forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
  });
}
function getTypeName(type) {
  const typeNames = {
    'tradicional': 'Tradicional',
    'vegetariana': 'Vegetariana',
    'mariscos': 'De Mariscos',
    'carne': 'De Carne'
  };
  return typeNames[type] || type;
}

// Función para verificar si el usuario es admin
function isAdmin() {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  
  try {
    const userData = parseJwt(token);
    return userData && userData.email === 'paellagiobel@gmail.com';
  } catch (e) {
    console.error('Error verificando admin:', e);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', function() {
    const productAdminNav = document.getElementById('product-admin-nav');
    if (productAdminNav) {
        const adminOptionCards = productAdminNav.querySelectorAll('.admin-option-card');
        adminOptionCards.forEach(card => {
            card.addEventListener('click', function() {
                const targetViewId = this.getAttribute('data-target');
                const targetView = document.getElementById(targetViewId);

                if (targetView) {
                    // Ocultar el panel de navegación principal
                    productAdminNav.style.display = 'none';
                    
                    // Mostrar la vista seleccionada
                    targetView.style.display = 'block';
                }
            });
        });
    }

    const backToMainMenuButtons = document.querySelectorAll('.back-to-main-menu');
    backToMainMenuButtons.forEach(button => {
        button.addEventListener('click', function() {
            const adminPanels = document.querySelectorAll('.admin-panel');
            adminPanels.forEach(panel => {
                panel.style.display = 'none';
            });
            
            if (productAdminNav) {
                productAdminNav.style.display = 'block';
            }
        });
    });
});

// Función para mostrar/ocultar el botón de gestión de productos
function updateAdminButtonVisibility(isAdmin) { // Añadir isAdmin como parámetro
  const manageProductsBtn = document.getElementById('manage-products-btn');
  const adminContainer = document.getElementById('admin-products-container');
  
  if (!manageProductsBtn || !adminContainer) {
    console.error('Elementos del admin no encontrados');
    return;
  }

  if (isAdmin) { // Usar isAdmin del parámetro
    manageProductsBtn.style.display = 'inline-block';
    adminContainer.style.display = 'block';
  } else {
    manageProductsBtn.style.display = 'none';
    adminContainer.style.display = 'none';
  }
}

// Nueva función para mostrar/ocultar el botón de gestión de galería
function updateGalleryAdminButtonVisibility(isAdmin) {
  const manageGalleryBtn = document.getElementById('manage-gallery-btn');
  const adminGalleryContainer = document.getElementById('admin-gallery-container'); // Obtener el contenedor

  if (!manageGalleryBtn || !adminGalleryContainer) {
    console.error('Elementos del admin de galería no encontrados');
    return;
  }

  if (isAdmin) {
    adminGalleryContainer.style.display = 'block'; // Mostrar el contenedor
    manageGalleryBtn.style.display = 'inline-block';
    if (!manageGalleryBtn._clickConfigured) {
      manageGalleryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openGalleryManagementModal('list');
      });
      manageGalleryBtn._clickConfigured = true;
    }
  } else {
    adminGalleryContainer.style.display = 'none'; // Ocultar el contenedor
    manageGalleryBtn.style.display = 'none';
  }
}

window.logout = logout;
window.updateUserUI = updateUserUI;
window.showConfirmModal = showConfirmModal; // Exponer para uso global
window.openGalleryManagementModal = openGalleryManagementModal; // Exponer para uso global
window.editGalleryImage = editGalleryImage; // Exponer para uso global
window.deleteGalleryImage = deleteGalleryImage; // Exponer para uso global
window.openAccountManagementModal = openAccountManagementModal; // Nuevo: Exponer para uso global
window.editAccount = editAccount; // Nuevo: Exponer para uso global
window.deleteAccount = deleteAccount; // Nuevo: Exponer para uso global

// Nueva función para la gestión de galería
function setupGalleryManagement() {
  const addImageBtn = document.getElementById('add-new-gallery-image-btn');
  const backToListBtn = document.getElementById('back-to-gallery-list-btn-form');
  const galleryForm = document.getElementById('gallery-form');
  const galleryImageFileInput = document.getElementById('gallery-image-file');
  const galleryImageUploadArea = document.getElementById('gallery-image-upload-area');
  const galleryImagePreview = document.getElementById('gallery-image-preview');

  if (addImageBtn) {
    addImageBtn.addEventListener('click', () => {
      openGalleryManagementModal('create');
    });
  }

  if (backToListBtn) {
    backToListBtn.addEventListener('click', () => {
      openGalleryManagementModal('list');
    });
  }

  if (galleryForm) {
    galleryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(galleryForm);
      const submitBtn = galleryForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      submitBtn.disabled = true;
      
      const isEditMode = galleryForm.dataset.imageId;
      const url = isEditMode 
        ? `${BASE_URL}/api/gallery/${isEditMode}` 
        : `${BASE_URL}/api/gallery`;
      const method = isEditMode ? 'PUT' : 'POST';

      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No autenticado');

        const response = await fetch(url, {
          method: method,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al guardar la imagen');
        }
        
        showSuccess(isEditMode ? 'Imagen actualizada exitosamente' : 'Imagen guardada exitosamente', 'gallery-form-response');
        
        // Resetear formulario y volver a la lista
        setTimeout(() => {
          resetGalleryForm();
          openGalleryManagementModal('list');
          setupGallery(); // Actualizar la galería principal
        }, 1500);

      } catch (error) {
        showError(error.message, 'gallery-form-response');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Configurar carga de imagen para el formulario de galería
  if (galleryImageUploadArea && galleryImageFileInput && galleryImagePreview) {
    galleryImageUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      galleryImageUploadArea.style.background = 'rgba(168, 218, 220, 0.3)';
      galleryImageUploadArea.style.borderColor = '#1d3557';
    });

    galleryImageUploadArea.addEventListener('dragleave', () => {
      galleryImageUploadArea.style.background = 'rgba(168, 218, 220, 0.1)';
      galleryImageUploadArea.style.borderColor = '#a8dadc';
    });

    galleryImageUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      galleryImageUploadArea.style.background = 'rgba(168, 218, 220, 0.1)';
      galleryImageUploadArea.style.borderColor = '#a8dadc';
      
      if (e.dataTransfer.files.length) {
        galleryImageFileInput.files = e.dataTransfer.files;
        handleGalleryImagePreview(galleryImageFileInput.files[0]);
      }
    });

    // Eliminar el listener de click directo en galleryImageUploadArea
    // galleryImageUploadArea.addEventListener('click', () => {
    //   galleryImageFileInput.click();
    // });

    // El input de tipo file ya es clickeable por sí mismo.
    // Asegurarse de que el input esté visible o se active correctamente.
    // Para evitar el doble click, el input de archivo debe ser el objetivo directo del click.
    // Si el uploadArea es un label para el input, esto se maneja automáticamente.
    // Si no, el input debe ser el elemento clickeable.

    galleryImageFileInput.addEventListener('change', () => {
      if (galleryImageFileInput.files.length) {
        handleGalleryImagePreview(galleryImageFileInput.files[0]);
      }
    });

    function handleGalleryImagePreview(file) {
      if (!file.type.match('image.*')) {
        showError('Por favor selecciona un archivo de imagen válido', 'gallery-form-response');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        galleryImagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview de imagen de galería">`;
        galleryImagePreview.style.display = 'flex';
        
        galleryImagePreview.querySelector('img').style.opacity = '0';
        setTimeout(() => {
          galleryImagePreview.querySelector('img').style.opacity = '1';
          galleryImagePreview.querySelector('img').style.transition = 'opacity 0.5s ease';
        }, 10);
      };
      reader.readAsDataURL(file);
    }
  }
}

// Función para abrir el modal de gestión de galería
async function openGalleryManagementModal(mode = 'list', imageId = null) {
  const modal = document.getElementById('gallery-management-modal');
  const modalTitle = modal.querySelector('.modal-title');
  const galleryListView = document.getElementById('gallery-management-list');
  const galleryFormView = document.getElementById('gallery-form-view');
  const addImageBtn = document.getElementById('add-new-gallery-image-btn');
  const backToListBtnForm = document.getElementById('back-to-gallery-list-btn-form');
  const galleryFormResponse = document.getElementById('gallery-form-response'); // Obtener el elemento de respuesta

  // Limpiar mensajes de respuesta al abrir el modal
  if (galleryFormResponse) {
    galleryFormResponse.style.display = 'none';
    galleryFormResponse.innerHTML = '';
  }

  if (mode === 'list') {
    modalTitle.innerHTML = '<i class="fas fa-images"></i> Gestión de Galería';
    galleryListView.style.display = 'block';
    galleryFormView.style.display = 'none';
    if (addImageBtn) addImageBtn.style.display = 'inline-block';
    if (backToListBtnForm) backToListBtnForm.style.display = 'none';
    await loadGalleryImagesManagementList();
  } else if (mode === 'create') {
    modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Agregar Nueva Imagen';
    galleryListView.style.display = 'none';
    galleryFormView.style.display = 'block';
    if (addImageBtn) addImageBtn.style.display = 'none';
    if (backToListBtnForm) backToListBtnForm.style.display = 'inline-block';
    resetGalleryForm();
    const galleryForm = document.getElementById('gallery-form');
    if (galleryForm) {
      galleryForm.dataset.imageId = '';
      galleryForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Guardar Imagen';
      const imageFileInput = document.getElementById('gallery-image-file');
      if (imageFileInput) imageFileInput.required = true; // Hacer requerido para nuevas imágenes
    }
  } else if (mode === 'edit' && imageId) {
    modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Imagen';
    galleryListView.style.display = 'none';
    galleryFormView.style.display = 'block';
    if (addImageBtn) addImageBtn.style.display = 'none';
    if (backToListBtnForm) backToListBtnForm.style.display = 'inline-block';
    resetGalleryForm();
    const galleryForm = document.getElementById('gallery-form');
    if (galleryForm) {
      galleryForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Actualizar Imagen';
      const imageFileInput = document.getElementById('gallery-image-file');
      if (imageFileInput) imageFileInput.required = false; // No requerido para edición
      await loadGalleryImageData(imageId);
    }
  }
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Función para cargar la lista de imágenes en el modal de gestión
async function loadGalleryImagesManagementList() {
  const galleryManagementList = document.getElementById('gallery-management-list');
  if (!galleryManagementList) return;

  galleryManagementList.innerHTML = `
    <div class="loading-spinner" style="text-align: center; padding: 20px;">
      <i class="fas fa-spinner fa-spin"></i> Cargando imágenes...
    </div>
  `;

  try {
    const response = await fetch(`${BASE_URL}/api/gallery`);
    if (!response.ok) throw new Error('Error al cargar imágenes de la galería');
    
    const data = await response.json();
    const images = data.images || [];

    if (images.length === 0) {
      galleryManagementList.innerHTML = `
        <div class="no-images" style="text-align: center; padding: 20px; color: #666;">
          <i class="fas fa-image" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
          No hay imágenes en la galería.
        </div>
      `;
      return;
    }

    galleryManagementList.innerHTML = images.map(image => `
      <div class="gallery-management-item" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px;
        border-bottom: 1px solid #eee;
        background-color: white;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      ">
        <div style="display: flex; align-items: center; flex-grow: 1;">
          <img src="${getCorrectImagePath('gallery/' + image.filename)}" alt="${image.caption || 'Imagen de galería'}" 
               style="width: 80px; height: 60px; object-fit: cover; border-radius: 5px; margin-right: 15px;">
          <div>
            <h4 style="margin: 0; font-size: 1.1rem; color: var(--dark-color);">${escapeHtml(image.caption || 'Sin título')}</h4>
            <p style="margin: 5px 0 0; font-size: 0.9rem; color: #777;">Orden: ${image.order}</p>
          </div>
        </div>
        <div class="gallery-actions">
          <button onclick="editGalleryImage('${String(image.id)}')" class="btn-action-small" style="
            background-color: var(--accent-color);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-left: 10px;
            transition: background-color 0.3s ease;
          ">
            <i class="fas fa-pencil-alt"></i> Editar
          </button>
          <button onclick="deleteGalleryImage('${String(image.id)}')" class="btn-action-small" style="
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-left: 10px;
            transition: background-color 0.3s ease;
          ">
            <i class="fas fa-trash-alt"></i> Eliminar
          </button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error cargando lista de gestión de galería:', error);
    galleryManagementList.innerHTML = `
      <div class="alert alert-error" style="text-align: center; padding: 20px;">
        <i class="fas fa-exclamation-circle"></i> Error al cargar imágenes para gestión.
      </div>
    `;
  }
}

// Función para cargar datos de la imagen en el formulario de galería
async function loadGalleryImageData(imageId) {
  try {
    const response = await fetch(`${BASE_URL}/api/gallery/${imageId}`);
    const data = await response.json();
    
    if (data.success && data.image) {
      const image = data.image;
      
      document.getElementById('gallery-image-caption').value = image.caption || '';
      document.getElementById('gallery-image-order').value = image.order;
      
      const imagePreview = document.getElementById('gallery-image-preview');
      imagePreview.innerHTML = `<img src="${getCorrectImagePath('gallery/' + image.filename)}" alt="${image.caption || 'Imagen de galería'}">`;
      imagePreview.style.display = 'flex';
      
      document.getElementById('gallery-form').dataset.imageId = String(imageId);
    }
  } catch (error) {
    console.error('Error al cargar imagen de galería:', error);
    showError('Error al cargar los datos de la imagen', 'gallery-form-response');
  }
}

// Función para editar imagen de galería
function editGalleryImage(imageId) {
  openGalleryManagementModal('edit', String(imageId));
}

// Función para eliminar imagen de galería
async function deleteGalleryImage(imageId) {
  showConfirmModal('¿Estás seguro de eliminar esta imagen?', 'Esta acción eliminará la imagen permanentemente.', async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No autenticado');

      const response = await fetch(`${BASE_URL}/api/gallery/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar la imagen');
      }
      
      showSuccess('Imagen eliminada exitosamente', 'gallery-form-response');
      loadGalleryImagesManagementList(); // Recargar la lista de gestión
      setupGallery(); // Recargar la galería principal
    } catch (error) {
      console.error('Error al eliminar imagen de galería:', error);
      showError(error.message, 'gallery-form-response');
    }
  });
}

// Función para resetear el formulario de galería
function resetGalleryForm() {
  const galleryForm = document.getElementById('gallery-form');
  const imageFileInput = document.getElementById('gallery-image-file');
  const imagePreview = document.getElementById('gallery-image-preview');

  if (galleryForm) galleryForm.reset();
  if (imagePreview) {
    imagePreview.innerHTML = '';
    imagePreview.style.display = 'none';
  }
  if (imageFileInput) imageFileInput.value = '';

  delete galleryForm.dataset.imageId;
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}
// ...
// Exponer para uso global
window.closeModal = closeModal;

// Nueva función para mostrar/ocultar el botón de gestión de cuentas
function updateAccountsAdminButtonVisibility(isAdmin) {
  const manageAccountsBtn = document.getElementById('manage-accounts-btn');
  const adminAccountsContainer = document.getElementById('admin-accounts-container');

  if (!manageAccountsBtn || !adminAccountsContainer) {
    console.error('Elementos del admin de cuentas no encontrados');
    return;
  }

  if (isAdmin) {
    adminAccountsContainer.style.display = 'block';
    manageAccountsBtn.style.display = 'inline-block';
    if (!manageAccountsBtn._clickConfigured) {
      manageAccountsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAccountManagementModal('list');
      });
      manageAccountsBtn._clickConfigured = true;
    }
  } else {
    adminAccountsContainer.style.display = 'none';
    manageAccountsBtn.style.display = 'none';
  }
}

// Función para abrir el modal de gestión de cuentas
async function openAccountManagementModal(mode = 'list', accountId = null) {
  const modal = document.getElementById('account-management-modal');
  const modalTitle = modal.querySelector('.modal-title');
  const accountsListView = document.getElementById('accounts-management-list');
  const accountFormView = document.getElementById('account-form-view');
  const addNewAccountBtn = document.getElementById('add-new-account-btn');
  const backToAccountsListBtnForm = document.getElementById('back-to-accounts-list-btn-form');
  const accountVerificationResponse = document.getElementById('account-verification-response');

  // Limpiar mensajes de respuesta al abrir el modal
  if (accountVerificationResponse) {
    accountVerificationResponse.style.display = 'none';
    accountVerificationResponse.innerHTML = '';
  }

  if (mode === 'list') {
    modalTitle.innerHTML = '<i class="fas fa-users-cog"></i> Gestión de Cuentas';
    accountsListView.style.display = 'block';
    accountFormView.style.display = 'none';
    if (addNewAccountBtn) addNewAccountBtn.style.display = 'inline-block';
    if (backToAccountsListBtnForm) backToAccountsListBtnForm.style.display = 'none';
    await loadAccountsManagementList();
  } else if (mode === 'create') {
    modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Agregar Nueva Cuenta';
    accountsListView.style.display = 'none';
    accountFormView.style.display = 'block';
    if (addNewAccountBtn) addNewAccountBtn.style.display = 'none';
    if (backToAccountsListBtnForm) backToAccountsListBtnForm.style.display = 'inline-block';
    resetAccountForm();
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
      accountForm.dataset.accountId = '';
      accountForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Guardar Cuenta';
    }
  } else if (mode === 'edit' && accountId) {
    modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Cuenta';
    accountsListView.style.display = 'none';
    accountFormView.style.display = 'block';
    if (addNewAccountBtn) addNewAccountBtn.style.display = 'none';
    if (backToAccountsListBtnForm) backToAccountsListBtnForm.style.display = 'inline-block';
    resetAccountForm();
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
      accountForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Actualizar Cuenta';
      await loadAccountData(accountId);
    }
  }
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Función para cargar la lista de cuentas en el modal de gestión
async function loadAccountsManagementList() {
  const accountsManagementList = document.getElementById('accounts-management-list');
  if (!accountsManagementList) return;

  accountsManagementList.innerHTML = `
    <div class="loading-spinner" style="text-align: center; padding: 20px;">
      <i class="fas fa-spinner fa-spin"></i> Cargando cuentas...
    </div>
  `;

  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No autenticado');

    const response = await fetch(`${BASE_URL}/api/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cargar cuentas');
    }
    
    const data = await response.json();
    const accounts = data.accounts || [];

    if (accounts.length === 0) {
      accountsManagementList.innerHTML = `
        <div class="no-accounts" style="text-align: center; padding: 20px; color: #666;">
          <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
          No hay cuentas para gestionar.
        </div>
      `;
      return;
    }

    accountsManagementList.innerHTML = accounts.map(account => `
      <div class="account-management-item" id="account-item-${account.id}" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px;
        border-bottom: 1px solid #eee;
        background-color: white;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      ">
        <div style="display: flex; align-items: center; flex-grow: 1;">
          <i class="fab fa-${account.platform}" style="font-size: 2rem; margin-right: 15px; color: var(--dark-color);"></i>
          <div>
            <h4 style="margin: 0; font-size: 1.1rem; color: var(--dark-color);">${escapeHtml(account.platform)}</h4>
            <p style="margin: 5px 0 0; font-size: 0.9rem; color: #777;">Nombre: ${escapeHtml(account.displayName || account.username)}</p>
            <p style="margin: 0; font-size: 0.8rem; color: #999;">Usuario: ${escapeHtml(account.username)}</p>
            ${account.link ? `<a href="${account.link}" target="_blank" style="font-size: 0.85rem; color: var(--primary-color); text-decoration: none;">Ver perfil</a>` : ''}
          </div>
        </div>
        <div class="account-actions">
          <button onclick="editAccount('${String(account.id)}')" class="btn-action-small" style="
            background-color: var(--accent-color);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-left: 10px;
            transition: background-color 0.3s ease;
          ">
            <i class="fas fa-pencil-alt"></i> Editar
          </button>
          <button onclick="deleteAccount('${String(account.id)}')" class="btn-action-small" style="
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-left: 10px;
            transition: background-color 0.3s ease;
          ">
            <i class="fas fa-trash-alt"></i> Eliminar
          </button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error cargando lista de gestión de cuentas:', error);
    accountsManagementList.innerHTML = `
      <div class="alert alert-error" style="text-align: center; padding: 20px;">
        <i class="fas fa-exclamation-circle"></i> Error al cargar cuentas para gestión.
      </div>
    `;
  }
}

// Función para cargar datos de la cuenta en el formulario
async function loadAccountData(accountId) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No autenticado');

    const response = await fetch(`${BASE_URL}/api/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (data.success && data.account) {
      const account = data.account;
      
      document.getElementById('account-platform').value = account.platform;
      document.getElementById('account-username').value = account.username;
      document.getElementById('account-link').value = account.link || '';
      document.getElementById('account-display-name').value = account.displayName || ''; // Cargar displayName
      
      document.getElementById('account-form').dataset.accountId = String(accountId);
      
      // Si la cuenta ya tiene un displayName, asumimos que está verificada y habilitamos el botón de guardar
      if (account.displayName) {
        document.getElementById('account-display-name').dataset.isVerified = 'true';
        document.getElementById('account-form').querySelector('button[type="submit"]').disabled = false;
      } else {
        document.getElementById('account-display-name').dataset.isVerified = 'false';
        document.getElementById('account-form').querySelector('button[type="submit"]').disabled = true;
      }
    }
  } catch (error) {
    console.error('Error al cargar cuenta:', error);
    showError('Error al cargar los datos de la cuenta', 'account-verification-response');
  }
}

// Función para editar cuenta
function editAccount(accountId) {
  openAccountManagementModal('edit', String(accountId));
}

// Función para eliminar cuenta
async function deleteAccount(accountId) {
  showConfirmModal('¿Estás seguro de eliminar esta cuenta?', 'Esta acción eliminará la cuenta permanentemente.', async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No autenticado');

      const response = await fetch(`${BASE_URL}/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar la cuenta');
      }
      
      showSuccess('Cuenta eliminada exitosamente', 'account-verification-response');
      loadAccountsManagementList(); // Recargar la lista de gestión
      loadContactAccounts(); // Actualizar la sección de contacto
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      showError(error.message, 'account-verification-response');
    }
  });
}

// Función para resetear el formulario de cuenta
function resetAccountForm() {
  const accountForm = document.getElementById('account-form');
  if (accountForm) {
    accountForm.reset();
    delete accountForm.dataset.accountId;
    document.getElementById('account-display-name').value = ''; // Limpiar displayName
    document.getElementById('account-display-name').dataset.isVerified = 'false'; // Resetear estado de verificación
    document.getElementById('account-form').querySelector('button[type="submit"]').disabled = true; // Deshabilitar botón de guardar
  }
}

// Función para cargar datos de la cuenta en el formulario
async function loadAccountData(accountId) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No autenticado');

    const response = await fetch(`${BASE_URL}/api/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (data.success && data.account) {
      const account = data.account;
      
      document.getElementById('account-platform').value = account.platform;
      document.getElementById('account-username').value = account.username;
      document.getElementById('account-link').value = account.link || '';
      document.getElementById('account-display-name').value = account.displayName || ''; // Cargar displayName
      
      document.getElementById('account-form').dataset.accountId = String(accountId);
      
      // Si la cuenta ya tiene un displayName, asumimos que está verificada y habilitamos el botón de guardar
      if (account.displayName) {
        document.getElementById('account-display-name').dataset.isVerified = 'true';
        document.getElementById('account-form').querySelector('button[type="submit"]').disabled = false;
      } else {
        document.getElementById('account-display-name').dataset.isVerified = 'false';
        document.getElementById('account-form').querySelector('button[type="submit"]').disabled = true;
      }
    }
  } catch (error) {
    console.error('Error al cargar cuenta:', error);
    showError('Error al cargar los datos de la cuenta', 'account-verification-response');
  }
}

// Configuración de la gestión de cuentas
function setupAccountManagement() {
  const addNewAccountBtn = document.getElementById('add-new-account-btn');
  const backToAccountsListBtnForm = document.getElementById('back-to-accounts-list-btn-form');
  const accountForm = document.getElementById('account-form');
  const verifyAccountBtn = document.getElementById('verify-account-btn');
  const accountDisplayNameInput = document.getElementById('account-display-name');
  const accountPlatformInput = document.getElementById('account-platform');
  const accountUsernameInput = document.getElementById('account-username');
  const accountLinkInput = document.getElementById('account-link');
  const saveAccountBtn = accountForm.querySelector('button[type="submit"]');

  // Hacer el campo displayName editable
  if (accountDisplayNameInput) {
    accountDisplayNameInput.readOnly = false; // Permitir edición
  }


  if (addNewAccountBtn) {
    addNewAccountBtn.addEventListener('click', () => {
      openAccountManagementModal('create');
    });
  }

  if (backToAccountsListBtnForm) {
    backToAccountsListBtnForm.addEventListener('click', () => {
      openAccountManagementModal('list');
    });
  }

  if (accountForm) {
    // Deshabilitar el botón de guardar por defecto
    saveAccountBtn.disabled = true;

    accountForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const originalText = saveAccountBtn.innerHTML;
      
      // Solo permitir guardar si la cuenta ha sido verificada
      if (accountDisplayNameInput.dataset.isVerified !== 'true') {
        showError('Por favor, verifica la cuenta antes de guardar.', 'account-verification-response');
        return;
      }

      saveAccountBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      saveAccountBtn.disabled = true;
      
      const isEditMode = accountForm.dataset.accountId;
      const url = isEditMode 
        ? `${BASE_URL}/api/accounts/${isEditMode}` 
        : `${BASE_URL}/api/accounts`;
      const method = isEditMode ? 'PUT' : 'POST';

      const accountData = {
        platform: accountPlatformInput.value,
        username: accountUsernameInput.value,
        link: accountLinkInput.value.trim() || null,
        displayName: accountDisplayNameInput.value.trim() // Incluir displayName
      };

      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No autenticado');

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(accountData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al guardar la cuenta');
        }
        
        showSuccess(isEditMode ? 'Cuenta actualizada exitosamente' : 'Cuenta guardada exitosamente', 'account-verification-response');
        
        setTimeout(() => {
          resetAccountForm();
          openAccountManagementModal('list');
          loadContactAccounts(); // Recargar las cuentas en la sección de contacto
        }, 1500);

      } catch (error) {
        showError(error.message, 'account-verification-response');
      } finally {
        saveAccountBtn.innerHTML = originalText;
        saveAccountBtn.disabled = false;
      }
    });
  }

  if (verifyAccountBtn) {
    verifyAccountBtn.addEventListener('click', async () => {
      const platform = accountPlatformInput.value;
      const username = accountUsernameInput.value;
      // El link ahora es opcional para la verificación inicial
      const link = accountLinkInput.value.trim(); 

      if (!platform || !username) {
        showError('Por favor, selecciona una plataforma y escribe un usuario/identificador.', 'account-verification-response');
        return;
      }

      const originalText = verifyAccountBtn.innerHTML;
      verifyAccountBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
      verifyAccountBtn.disabled = true;
      saveAccountBtn.disabled = true; // Deshabilitar guardar durante la verificación

      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No autenticado');

        const response = await fetch(`${BASE_URL}/api/accounts/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ platform, username, ...(link && { link }) }) // Enviar link solo si existe
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al verificar la cuenta');
        }

        showSuccess(data.message, 'account-verification-response');
        accountDisplayNameInput.value = data.displayName || username; // Rellenar displayName
        accountLinkInput.value = data.link || link || ''; // Rellenar link si se devuelve o usar el original
        accountDisplayNameInput.dataset.isVerified = 'true'; // Marcar como verificado
        saveAccountBtn.disabled = false; // Habilitar botón de guardar
        accountDisplayNameInput.readOnly = false; // Asegurarse de que sea editable después de la verificación

      } catch (error) {
        showError(error.message, 'account-verification-response');
        accountDisplayNameInput.value = ''; // Limpiar displayName en caso de error
        accountDisplayNameInput.dataset.isVerified = 'false'; // Resetear estado de verificación
        saveAccountBtn.disabled = true; // Mantener deshabilitado
      } finally {
        verifyAccountBtn.innerHTML = originalText;
        verifyAccountBtn.disabled = false;
      }
    });
  }
}

// Función para cargar y renderizar las cuentas de contacto en la sección "Contáctanos"
async function loadContactAccounts() {
  const container = document.getElementById('dynamic-contact-accounts-container');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner" style="text-align: center; padding: 20px; width: 100%;">
      <i class="fas fa-spinner fa-spin"></i> Cargando cuentas de contacto...
    </div>
  `;

  try {
    const response = await fetch(`${BASE_URL}/api/accounts`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cargar cuentas de contacto');
    }
    
    const data = await response.json();
    const accounts = data.accounts || [];

    if (accounts.length === 0) {
      container.innerHTML = `
        <div class="no-accounts" style="text-align: center; padding: 40px; color: #666; width: 100%;">
          <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
          No hay cuentas de contacto configuradas.
        </div>
      `;
      return;
    }

    container.innerHTML = accounts.map(account => {
      let iconClass = '';
      let platformName = '';
      let buttonText = '';
      let defaultLink = '#'; // Enlace por defecto si no hay link

      switch (account.platform) {
        case 'whatsapp':
          iconClass = 'fab fa-whatsapp';
          platformName = 'WhatsApp';
          buttonText = 'Chatear ahora';
          defaultLink = `https://wa.me/${account.username.replace(/\D/g, '')}`; // Limpiar número
          break;
        case 'instagram':
          iconClass = 'fab fa-instagram';
          platformName = 'Instagram';
          buttonText = 'Seguir cuenta';
          defaultLink = `https://instagram.com/${account.username.replace(/^@/, '')}`; // Limpiar @
          break;
        case 'facebook':
          iconClass = 'fab fa-facebook-f';
          platformName = 'Facebook';
          buttonText = 'Visitar página';
          defaultLink = `https://facebook.com/${account.username}`;
          break;
        case 'twitter':
          iconClass = 'fab fa-twitter';
          platformName = 'Twitter';
          buttonText = 'Seguir';
          defaultLink = `https://twitter.com/${account.username.replace(/^@/, '')}`;
          break;
        case 'tiktok':
          iconClass = 'fab fa-tiktok';
          platformName = 'TikTok';
          buttonText = 'Ver perfil';
          defaultLink = `https://tiktok.com/@${account.username.replace(/^@/, '')}`;
          break;
        case 'email':
          iconClass = 'fas fa-envelope';
          platformName = 'Correo Electrónico';
          buttonText = 'Enviar correo';
          defaultLink = `mailto:${account.username}`;
          break;
        case 'phone':
          iconClass = 'fas fa-phone-alt';
          platformName = 'Teléfono';
          buttonText = 'Llamar ahora';
          defaultLink = `tel:${account.username}`;
          break;
        default:
          iconClass = 'fas fa-globe';
          platformName = account.platform;
          buttonText = 'Visitar';
          defaultLink = account.link || '#';
      }

      const displayLink = account.link && account.link !== '' ? account.link : defaultLink;

      return `
        <div class="contact-card ${account.platform}">
          <div class="icon">
            <i class="${iconClass}"></i>
          </div>
          <h3>${platformName}</h3>
          <p>${escapeHtml(account.displayName || account.username)}</p> <!-- Usar displayName -->
          <a href="${displayLink}" target="_blank" class="btn-contact">${buttonText}</a>
        </div>
      `;
    }).join('');

    // También renderizar en el footer
    renderFooterSocialLinks(accounts);

  } catch (error) {
    console.error('Error cargando cuentas de contacto:', error);
    container.innerHTML = `
      <div class="alert alert-error" style="text-align: center; padding: 20px; width: 100%;">
        <i class="fas fa-exclamation-circle"></i> Error al cargar las cuentas de contacto.
      </div>
    `;
  }
}

// Nueva función para renderizar los enlaces sociales en el footer
function renderFooterSocialLinks(accounts) {
  const footerSocialLinksContainer = document.getElementById('footer-social-links');
  if (!footerSocialLinksContainer) return;

  footerSocialLinksContainer.innerHTML = ''; // Limpiar enlaces existentes

  accounts.forEach(account => {
    let iconClass = '';
    let defaultLink = '#';

    switch (account.platform) {
      case 'whatsapp':
        iconClass = 'fab fa-whatsapp';
        defaultLink = `https://wa.me/${account.username.replace(/\D/g, '')}`;
        break;
      case 'instagram':
        iconClass = 'fab fa-instagram';
        defaultLink = `https://instagram.com/${account.username.replace(/^@/, '')}`;
        break;
      case 'facebook':
        iconClass = 'fab fa-facebook-f';
        defaultLink = `https://facebook.com/${account.username}`;
        break;
      case 'twitter':
        iconClass = 'fab fa-twitter';
        defaultLink = `https://twitter.com/${account.username.replace(/^@/, '')}`;
        break;
      case 'tiktok':
        iconClass = 'fab fa-tiktok';
        defaultLink = `https://tiktok.com/@${account.username.replace(/^@/, '')}`;
        break;
      case 'email':
        iconClass = 'fas fa-envelope';
        defaultLink = `mailto:${account.username}`;
        break;
      case 'phone':
        iconClass = 'fas fa-phone-alt';
        defaultLink = `tel:${account.username}`;
        break;
      default:
        iconClass = 'fas fa-globe';
        defaultLink = account.link || '#';
    }

    const displayLink = account.link && account.link !== '' ? account.link : defaultLink;

    const linkElement = document.createElement('a');
    linkElement.href = displayLink;
    linkElement.target = '_blank';
    linkElement.rel = 'noopener noreferrer'; // Buenas prácticas de seguridad
    linkElement.innerHTML = `<i class="${iconClass}"></i>`;
    
    footerSocialLinksContainer.appendChild(linkElement);
  });
}

// Función para mostrar un modal de confirmación personalizado
function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById('confirm-delete-modal');
  if (!modal) {
    console.error('Modal de confirmación no encontrado.');
    return;
  }

  const modalTitle = modal.querySelector('.modal-header h2');
  const modalMessage = modal.querySelector('#confirm-delete-message');
  const confirmBtn = modal.querySelector('#confirm-delete-action-btn');
  const cancelBtn = modal.querySelector('#cancel-delete-btn');
  const closeBtn = modal.querySelector('.modal-close');

  modalTitle.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${title}`;
  modalMessage.textContent = message;

  // Limpiar listeners anteriores para evitar duplicados
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  const newCancelBtn = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

  // Configurar nuevos listeners
  newConfirmBtn.addEventListener('click', () => {
    onConfirm();
    closeModal('confirm-delete-modal');
  });

  newCancelBtn.addEventListener('click', () => {
    closeModal('confirm-delete-modal');
  });

  newCloseBtn.addEventListener('click', () => {
    closeModal('confirm-delete-modal');
  });

  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  modal.style.zIndex = '10001'; // Asegurar que el modal de confirmación esté por encima de otros
}
