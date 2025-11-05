# 🏥 Sistema Médico Completo - FocusMeet

## 📋 Resumen de Cambios Implementados

Se ha transformado FocusMeet en un sistema médico profesional con las siguientes mejoras:

### 1. ✅ Formato HPI/ROS + PE + A/P

**Reemplazado**: Formato "Estándar" 
**Por**: Formato HPI/ROS + PE + A/P (Historia, Examen Físico, Diagnóstico y Plan)

#### Componentes del Formato HPI/ROS:

**HPI (Historia de la Enfermedad Actual)**
- Descripción detallada del motivo de consulta
- Inicio de síntomas y evolución
- Factores agravantes/atenuantes
- Tratamientos previos

**ROS (Revisión por Sistemas)**
- General: Fiebre, pérdida de peso, fatiga
- Cardiovascular: Dolor torácico, palpitaciones, edema
- Respiratorio: Disnea, tos, sibilancias
- Gastrointestinal: Náuseas, vómitos, diarrea, dolor abdominal
- Genitourinario: Disuria, hematuria, frecuencia
- Musculoesquelético: Dolor articular, rigidez
- Neurológico: Cefalea, mareos, debilidad
- Psiquiátrico: Ánimo, sueño, ansiedad

**PE (Examen Físico)**
- Signos vitales
- Apariencia general
- Hallazgos por sistemas examinados

**A/P (Diagnóstico y Plan)**
- Impresión diagnóstica o diagnóstico diferencial
- Plan de tratamiento (medicamentos, procedimientos)
- Estudios complementarios solicitados
- Seguimiento programado

### 2. ✅ Selector de Paciente Obligatorio

**Ubicación**: Página principal (antes de subir archivo)

**Características**:
- ✅ Dropdown con lista de pacientes existentes
- ✅ Botón "+ Nuevo" para crear paciente
- ✅ Validación obligatoria antes de analizar
- ✅ Mensaje de error si no hay paciente seleccionado
- ✅ Redirección automática a la ficha del paciente después de guardar

**Flujo**:
1. Usuario selecciona paciente del dropdown
2. Si no existe, hace clic en "+ Nuevo" → va a `/pacientes`
3. Crea el paciente y vuelve
4. Selecciona el paciente recién creado
5. Sube archivo y analiza
6. El reporte queda asociado al paciente

### 3. ✅ Dos Formatos Médicos Disponibles

#### **SOAP** (Consultas de Seguimiento)
- **S** (Subjetivo): Síntomas del paciente
- **O** (Objetivo): Signos vitales, examen físico
- **A** (Análisis): Diagnóstico
- **P** (Plan): Tratamiento

**Ideal para**: Consultas de control, seguimiento de tratamientos

#### **HPI/ROS + PE + A/P** (Consultas Iniciales)
- Más detallado y exhaustivo
- Revisión completa por sistemas
- Documentación extensa de historia clínica

**Ideal para**: Primera consulta, evaluaciones complejas, especialidades

### 4. ✅ Estructura de Reportes Actualizada

Cada reporte ahora incluye:

```typescript
{
  createdAt: string,
  analysis: AnalysisResult,
  meta: object,
  userId: string,
  title: string,
  version: number,
  patientId: string,      // ← NUEVO (obligatorio)
  format: 'soap' | 'hpi_ros'  // ← NUEVO
}
```

### 5. ✅ Asociación Paciente-Reportes

**En Firestore**:
- Colección `reports` con campo `patientId`
- Permite filtrar todos los reportes de un paciente
- Base para agrupar sesiones en fichas

**En la UI**:
- Página de paciente muestra todos sus reportes
- Reportes agrupados por paciente
- Fácil navegación entre sesiones

## 📁 Archivos Modificados

### 1. `src/lib/audioAnalysis.ts`
```typescript
// Cambios principales:
- Tipo de formato: 'standard' → 'hpi_ros'
- Nuevo prompt detallado para HPI/ROS
- Instrucciones específicas para cada sección
- Documentación exhaustiva de ROS
```

### 2. `src/app/api/chat/analyze/route.ts`
```typescript
// Cambios:
- Acepta parámetro format: 'hpi_ros' | 'soap'
- Formato por defecto: 'soap'
- Pasa formato a analyzeTranscription()
```

### 3. `src/app/api/reports/route.ts`
```typescript
// Cambios:
- Validación obligatoria de patientId
- Nuevo campo format en payload
- Error 400 si falta patientId
```

### 4. `src/app/page.tsx`
```typescript
// Cambios principales:
- Nuevo estado: analysisFormat ('hpi_ros' | 'soap')
- Nuevo estado: patients, selectedPatientId
- Función loadPatients() para cargar lista
- Selector visual de formato
- Selector de paciente obligatorio
- Validación antes de subir archivo
- Envío de format y patientId al guardar
```

## 🎨 Interfaz de Usuario

### Página Principal

```
┌─────────────────────────────────────┐
│         FocusMeet                   │
├─────────────────────────────────────┤
│                                     │
│  Formato de análisis:               │
│  ┌──────────┬──────────────────┐   │
│  │   SOAP   │ HPI/ROS+PE+A/P   │   │
│  └──────────┴──────────────────┘   │
│                                     │
│  Descripción del formato...         │
│                                     │
│  Paciente *                         │
│  ┌─────────────────┬─────────┐     │
│  │ Selecciona...  ▼│ + Nuevo │     │
│  └─────────────────┴─────────┘     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   📤 Subir archivo          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Selector de Formato
- Toggle entre SOAP y HPI/ROS
- Descripción dinámica según selección
- Deshabilitado durante análisis

### Selector de Paciente
- Dropdown con todos los pacientes
- Botón "+ Nuevo" para crear
- Mensaje de ayuda si no hay selección
- Validación visual (asterisco rojo)

## 🔄 Flujo Completo de Uso

### Escenario 1: Usuario Nuevo

1. **Llega a la página principal**
2. **Ve que necesita seleccionar paciente**
3. **Hace clic en "+ Nuevo"**
4. **Va a `/pacientes`**
5. **Crea su primer paciente**
6. **Vuelve a la página principal**
7. **Selecciona el paciente del dropdown**
8. **Elige formato (SOAP o HPI/ROS)**
9. **Sube archivo de audio/video**
10. **Sistema analiza con el formato elegido**
11. **Guarda reporte asociado al paciente**
12. **Redirige a la ficha del paciente**

### Escenario 2: Usuario con Pacientes

1. **Llega a la página principal**
2. **Selecciona paciente del dropdown**
3. **Elige formato según tipo de consulta**
4. **Sube archivo**
5. **Analiza y guarda**
6. **Ve el reporte en la ficha del paciente**

## 📊 Casos de Uso por Formato

### Usar SOAP cuando:
- ✅ Consulta de seguimiento
- ✅ Control de tratamiento
- ✅ Evaluación rápida
- ✅ Paciente conocido
- ✅ Problema específico

### Usar HPI/ROS + PE + A/P cuando:
- ✅ Primera consulta
- ✅ Evaluación completa
- ✅ Caso complejo
- ✅ Múltiples síntomas
- ✅ Necesitas documentación exhaustiva
- ✅ Especialidades (cardiología, neurología, etc.)

## 🗂️ Agrupación de Sesiones

### Implementación Actual
- Reportes filtrados por `patientId`
- Vista en página de paciente individual
- Listado cronológico de sesiones

### Próximas Mejoras Sugeridas

#### 1. **Vista de Ficha Completa**
```
Paciente: Juan Pérez
├─ Datos Personales
├─ Sesiones (12)
│  ├─ 2024-11-04: Consulta inicial (HPI/ROS)
│  ├─ 2024-11-10: Seguimiento (SOAP)
│  └─ 2024-11-17: Control (SOAP)
├─ Diagnósticos Activos
└─ Tratamientos Actuales
```

#### 2. **Timeline de Evolución**
- Línea de tiempo visual
- Marcadores por tipo de consulta
- Filtros por formato
- Búsqueda por contenido

#### 3. **Resumen Consolidado**
- Diagnósticos recurrentes
- Medicamentos prescritos
- Estudios solicitados
- Evolución de síntomas

## 🔒 Validaciones Implementadas

### Frontend
- ✅ Paciente obligatorio antes de subir archivo
- ✅ Formato seleccionado (por defecto: SOAP)
- ✅ Tipo de archivo válido (mp3, mp4)

### Backend
- ✅ Token de autenticación válido
- ✅ PatientId presente en el request
- ✅ Analysis con contenido válido
- ✅ Formato válido ('soap' | 'hpi_ros')

## 📈 Mejoras de Base de Datos

### Estructura en Firestore

```
/reports/{reportId}
  - createdAt: timestamp
  - userId: string
  - patientId: string ← NUEVO (obligatorio)
  - format: string ← NUEVO ('soap' | 'hpi_ros')
  - title: string
  - analysis: object
  - meta: object
  - version: number
```

### Índices Recomendados

```javascript
// Firestore indexes
reports:
  - userId + createdAt (desc)
  - patientId + createdAt (desc) ← NUEVO
  - userId + patientId + createdAt (desc) ← NUEVO
```

## 🎯 Beneficios del Sistema

### Para el Médico
1. **Documentación Completa**: HPI/ROS captura toda la información
2. **Flexibilidad**: Elige formato según tipo de consulta
3. **Organización**: Todos los reportes agrupados por paciente
4. **Trazabilidad**: Historial completo de cada paciente
5. **Eficiencia**: Análisis automático ahorra tiempo

### Para el Paciente
1. **Mejor Seguimiento**: Historial médico completo
2. **Continuidad**: Información disponible en cada consulta
3. **Transparencia**: Acceso a sus reportes
4. **Calidad**: Documentación profesional y detallada

## 🚀 Próximos Pasos Recomendados

### Corto Plazo
1. ✅ Implementar filtros en página de reportes por paciente
2. ✅ Agregar búsqueda de reportes
3. ✅ Exportar reportes a PDF
4. ✅ Compartir reportes con pacientes

### Mediano Plazo
1. ⏳ Vista de timeline de evolución
2. ⏳ Resumen consolidado por paciente
3. ⏳ Alertas de seguimiento
4. ⏳ Plantillas personalizadas de formatos

### Largo Plazo
1. 📅 Integración con agenda médica
2. 📅 Recordatorios automáticos
3. 📅 Análisis de tendencias
4. 📅 Sugerencias de diagnóstico con IA

## 🧪 Testing

### Casos de Prueba

#### Test 1: Crear Reporte sin Paciente
```
Entrada: Subir archivo sin seleccionar paciente
Esperado: Error "Debes seleccionar un paciente"
Estado: ✅ Implementado
```

#### Test 2: Crear Reporte con Formato SOAP
```
Entrada: Paciente + Archivo + Formato SOAP
Esperado: Reporte con estructura SOAP
Estado: ✅ Implementado
```

#### Test 3: Crear Reporte con Formato HPI/ROS
```
Entrada: Paciente + Archivo + Formato HPI/ROS
Esperado: Reporte con secciones HPI, ROS, PE, A/P
Estado: ✅ Implementado
```

#### Test 4: Ver Reportes de un Paciente
```
Entrada: Ir a ficha de paciente
Esperado: Lista de todos sus reportes
Estado: ✅ Ya existía
```

## 📚 Documentación de Referencia

### Formato SOAP
- [SOAP Note - Wikipedia](https://en.wikipedia.org/wiki/SOAP_note)
- Estándar médico internacional
- Usado en atención primaria

### Formato HPI/ROS
- Historia y Examen Físico Completo
- Usado en especialidades
- Documentación exhaustiva

## ✅ Checklist de Implementación

- [x] Reemplazar formato Estándar por HPI/ROS
- [x] Actualizar prompts de IA
- [x] Agregar selector de formato en UI
- [x] Agregar selector de paciente obligatorio
- [x] Validar paciente antes de analizar
- [x] Guardar patientId en reportes
- [x] Guardar format en reportes
- [x] Actualizar estructura de base de datos
- [x] Redirección a ficha de paciente
- [x] Documentación completa

---

**Fecha de implementación**: Noviembre 2024  
**Versión**: 3.0.0  
**Estado**: ✅ Completado y listo para usar

## 🎉 Resultado Final

FocusMeet ahora es un **sistema médico profesional** que:
- ✅ Documenta consultas con estándares médicos (SOAP y HPI/ROS)
- ✅ Organiza información por paciente
- ✅ Permite elegir el nivel de detalle según el tipo de consulta
- ✅ Mantiene historial completo de cada paciente
- ✅ Automatiza la documentación clínica
- ✅ Ahorra tiempo al médico
- ✅ Mejora la calidad de atención

**¡El sistema está listo para usarse en consultas reales!** 🏥
