# 🔄 Cambiar de Cuenta de Google

## Problema Resuelto

Ahora cuando uses "Continuar con Google", **siempre te pedirá que selecciones una cuenta**, incluso si ya iniciaste sesión antes.

## ✅ Cambios Implementados

### 1. **Selección de Cuenta Forzada**
- Cada vez que hagas clic en "Continuar con Google"
- Google te mostrará todas tus cuentas disponibles
- Podrás elegir cualquier cuenta o agregar una nueva
- Ya no te loguea automáticamente con la última cuenta usada

### 2. **Botón de Cerrar Sesión Mejorado**
- **Desktop**: Botón "Salir" con ícono en el navbar superior derecho
- **Mobile**: Botón "Cerrar Sesión" rojo en el menú móvil
- Muestra tu nombre/email cuando estás logueado
- Notificación de confirmación al cerrar sesión

## 🎯 Cómo Usar

### Para Cambiar de Cuenta:

1. **Opción 1: Cerrar sesión primero**
   - Haz clic en el botón "Salir" en el navbar
   - Ve a Login
   - Haz clic en "Continuar con Google"
   - Selecciona la cuenta que quieras

2. **Opción 2: Directamente desde login**
   - Si ya estás logueado, cierra sesión
   - En la página de login, haz clic en "Continuar con Google"
   - Google te mostrará todas tus cuentas
   - Selecciona la que prefieras

### Para Usar Otra Cuenta Sin Cerrar Sesión:

Si quieres probar con otra cuenta sin cerrar la actual:
1. Abre una ventana de incógnito/privada
2. Ve a `http://localhost:3000/login`
3. Haz clic en "Continuar con Google"
4. Selecciona otra cuenta

## 🔍 Detalles Técnicos

### Parámetro `prompt: 'select_account'`

Este parámetro le dice a Google que:
- Siempre muestre el selector de cuentas
- No use la cuenta previamente seleccionada automáticamente
- Permita agregar nuevas cuentas

### Código Implementado

```typescript
export function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  // Forzar selección de cuenta cada vez
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  return provider;
}
```

## 📱 Interfaz Mejorada

### Navbar Desktop
```
[FocusMeet] [Inicio] [Reportes] [Pacientes] [Feedback] | [tu@email.com] [🚪 Salir]
```

### Navbar Mobile
```
☰ Menú
├─ Inicio
├─ Reportes
├─ Pacientes
├─ Feedback
└─ Conectado como:
   tu@email.com
   [🚪 Cerrar Sesión]
```

## 🎨 Mejoras Visuales

1. **Botón de Salir**
   - Hover rojo para indicar acción de cierre
   - Ícono de salida (🚪)
   - Transición suave

2. **Información del Usuario**
   - Muestra tu nombre o email
   - Truncado si es muy largo
   - Fondo azul claro en móvil

3. **Notificaciones**
   - "Sesión cerrada exitosamente" al salir
   - Toast elegante en la esquina superior derecha

## 🧪 Probar los Cambios

1. **Reinicia el servidor** (si está corriendo):
   ```bash
   # Ctrl + C para detener
   npm run dev
   ```

2. **Prueba el flujo completo**:
   - Ve a `/login`
   - Haz clic en "Continuar con Google"
   - Verás el selector de cuentas de Google
   - Selecciona una cuenta
   - Una vez logueado, verás tu email en el navbar
   - Haz clic en "Salir"
   - Verás la notificación de sesión cerrada

3. **Prueba con otra cuenta**:
   - Después de cerrar sesión
   - Ve a `/login` nuevamente
   - Haz clic en "Continuar con Google"
   - Selecciona una cuenta diferente

## ⚙️ Otras Opciones de `prompt`

Si en el futuro quieres cambiar el comportamiento:

```typescript
// Siempre pedir consentimiento (útil si cambias permisos)
prompt: 'consent'

// Pedir selección de cuenta + consentimiento
prompt: 'select_account consent'

// Sin forzar nada (comportamiento por defecto)
// No incluir setCustomParameters
```

## 🔐 Seguridad

- Cada cuenta tiene su propia sesión independiente
- Los datos de cada usuario están separados en Firestore
- No hay riesgo de mezclar datos entre cuentas
- Firebase maneja la autenticación de forma segura

## 📊 Ventajas

✅ Puedes usar múltiples cuentas de Google  
✅ Fácil cambiar entre cuentas  
✅ Botón de cerrar sesión visible y claro  
✅ Notificaciones de confirmación  
✅ Interfaz intuitiva en desktop y móvil  

---

**¡Listo!** Ahora puedes usar cualquier cuenta de Google sin que se quede "pegada" una cuenta específica.
