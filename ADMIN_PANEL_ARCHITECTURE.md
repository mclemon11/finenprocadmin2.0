# FINENPROC Admin Panel - Arquitectura MVP

## 1. ESTRUCTURA DE RUTAS

```
/admin                          → Dashboard (KPIs, alertas)
/admin/usuarios                 → Tabla de usuarios (gestión central)
/admin/usuarios/:uid            → Detalle usuario (perfil + wallet + inversiones + retiros)
/admin/operaciones/recargas    → Gestión de topups (global)
/admin/operaciones/retiros     → Gestión de withdrawals (global)
/admin/operaciones/inversiones → Gestión de investments (global)
/admin/proyectos               → CRUD de projects
/admin/configuracion/metodos   → Métodos de pago y recarga
/admin/configuracion/audit     → AuditLogs (solo lectura)
```

## 2. ESTRUCTURA DE COMPONENTES & RESPONSABILIDADES

### A. DASHBOARD (`/admin`)
**Propósito:** Vista ejecutiva, KPIs, alertas operativas

**Responsabilidades:**
- Mostrar totales: usuarios activos, inversiones vigentes, capital en circulación
- Alertas operativas: topups pendientes, retiros pendientes, inversiones vencidas
- Gráficos: flujo de capital, distribución de inversiones
- Accesos rápidos a módulos críticos

**Datos requeridos:**
- Usuarios: count by status
- Topups: count by status
- Withdrawals: count by status
- Investments: suma de amount, count by status
- Transactions: volumen diario/semanal

**Estructura:**
```
/admin-dashboard
  ├── AdminDashboard.jsx
  ├── AdminDashboard.css
  ├── components/
  │   ├── KPICard.jsx
  │   ├── AlertBanner.jsx
  │   └── QuickActions.jsx
```

---

### B. USUARIOS - MÓDULO CENTRAL (`/admin/usuarios`)
**Propósito:** Gestión integral de usuarios, punto de entrada para toda operación admin

**Responsabilidades principales:**
- Tabla filtrable y paginada de usuarios
- Búsqueda por email, displayName
- Filtros: status (active/inactive), rol (solo admins), fecha de registro
- Acciones rápidas: ver detalle, editar, deactivate
- Ver wallet, inversiones, historial de transacciones sin salir de esta vista

**Estructura:**
```
/admin-usuarios
  ├── AdminUsuarios.jsx          (contenedor + tabla)
  ├── AdminUsuarios.css
  ├── pages/
  │   ├── UsuariosListPage.jsx   (tabla + filtros)
  │   └── UsuarioDetailPage.jsx  (detalle completo)
  └── components/
      ├── UsuariosTable.jsx       (tabla con sorting/pagination)
      ├── UsuarioFilters.jsx      (filtros)
      ├── UsuarioDetailCard.jsx   (perfil + wallet)
      ├── UsuarioInversiones.jsx  (tabla inversiones con acciones)
      ├── UsuarioRecargas.jsx     (tabla recargas con acciones)
      ├── UsuarioRetiros.jsx      (tabla retiros con acciones)
      └── UsuarioTransacciones.jsx (historial transacciones)
```

**Flujo operativo:**
1. Admin abre `/admin/usuarios`
2. Ve tabla de todos los usuarios
3. Busca/filtra usuario
4. Clica en usuario → abre modal/drawer con detalle
5. En detalle ve: perfil, wallet, inversiones, recargas, retiros, transacciones
6. Puede aprobar/rechazar operaciones SIN cerrar el detalle

---

### C. OPERACIONES (`/admin/operaciones/*`)
**Propósito:** Gestión global de operaciones financieras

**Módulos:**

#### C1. RECARGAS (`/admin/operaciones/recargas`)
- Tabla global de topups con estado (pending/approved/rejected)
- Filtro por: estado, método, fecha, usuario
- Acción: aprobar/rechazar con nota
- Generación de auditLog en cada acción

#### C2. RETIROS (`/admin/operaciones/retiros`)
- Tabla global de withdrawals
- Filtro por: estado, método, fecha, usuario
- Validación antes de aprobar (suficiente balance)
- Acción: aprobar/rechazar/procesar con nota

#### C3. INVERSIONES (`/admin/operaciones/inversiones`)
- Tabla global de investments
- Filtro por: estado, proyecto, usuario, fecha
- Indicadores: ROI esperado, fecha de vencimiento
- Acción: ver detalle, marcar como completada

**Estructura:**
```
/admin-operaciones
  ├── AdminOperaciones.jsx
  ├── AdminOperaciones.css
  ├── pages/
  │   ├── RecargarPage.jsx
  │   ├── RetirosPage.jsx
  │   └── InversionesPage.jsx
  └── components/
      ├── TopupsTable.jsx
      ├── WithdrawalsTable.jsx
      ├── InvestmentsTable.jsx
      └── ActionModal.jsx (aprobar/rechazar)
```

---

### D. PROYECTOS (`/admin/proyectos`)
**Propósito:** CRUD de productos financieros

**Responsabilidades:**
- Listar proyectos activos/inactivos
- Crear nuevo proyecto (nombre, descripción, ROI esperado, plazo)
- Editar datos del proyecto
- Cambiar estado (activo/inactivo)
- Ver inversiones vigentes en cada proyecto

**Estructura:**
```
/admin-proyectos
  ├── AdminProyectos.jsx
  ├── AdminProyectos.css
  ├── pages/
  │   ├── ProyectosListPage.jsx
  │   └── ProyectoFormPage.jsx
  └── components/
      ├── ProyectosTable.jsx
      └── ProyectoForm.jsx
```

---

### E. CONFIGURACIÓN (`/admin/configuracion/*`)

#### E1. MÉTODOS DE PAGO (`/admin/configuracion/metodos`)
- Tabla de paymentMethods y rechargeMethods
- Crear/editar/deactivate método
- Estado: activo/inactivo
- Notas de configuración

#### E2. AUDITORÍA (`/admin/configuracion/audit`)
- Tabla inmutable de auditLogs
- Filtro por: usuario, acción, fecha, resultado
- Solo lectura (generate logs, no edit)
- Exportar a CSV/PDF

**Estructura:**
```
/admin-configuracion
  ├── AdminConfiguracion.jsx
  ├── AdminConfiguracion.css
  └── pages/
      ├── MetodosPage.jsx
      ├── AuditLogsPage.jsx
      └── SettingsPage.jsx
```

---

## 3. HOOKS NECESARIOS (Data Layer)

### Usuarios
```javascript
useAdminUsers()
  → { users[], loading, error, refetch }
  → Query: users collection con filters

useUserDetail(uid)
  → { user, wallet, investments, topups, withdrawals, error, loading }
  → Query: documento users/{uid} + subcollections

useUserWallet(uid)
  → { wallet, loading, error }
  → Query: users/{uid}/wallets/{uid}
```

### Operaciones
```javascript
useAdminTopups(filters)
  → { topups[], loading, total, error }
  → Query: topups collection con filtros

useAdminWithdrawals(filters)
  → { withdrawals[], loading, total, error }
  → Query: withdrawals collection

useAdminInvestments(filters)
  → { investments[], loading, total, error }
  → Query: investments collection
```

### Acciones (Mutations)
```javascript
useApproveTopup(topupId, adminUid)
  → { approve(), loading, error }
  → Mutation: topups/{id} status: 'approved' + auditLog

useRejectTopup(topupId, reason, adminUid)
  → { reject(), loading, error }
  → Mutation: topups/{id} status: 'rejected' + auditLog

useApproveWithdrawal(withdrawalId, adminUid)
  → validar balance suficiente primero
  → Mutation: withdrawals/{id} status: 'approved' + auditLog

useCreateProject(projectData, adminUid)
  → { create(), loading, error }
  → Mutation: projects collection + auditLog
```

---

## 4. FLUJOS OPERATIVOS CLAVE

### Flujo 1: APROBAR UNA RECARGA
```
1. Admin en /admin/operaciones/recargas
2. Ve tabla de topups pendientes
3. Clica "Aprobar" en una recarga
4. Modal: confirma monto, método, usuario
5. Admin clica "Confirmar"
6. Hook useApproveTopup():
   - Valida que usuario exista
   - Actualiza topups/{id}: { status: 'approved', approvedAt, approvedBy }
   - Crea documento en auditLogs: { action: 'APPROVE_TOPUP', userId, topupId, admin, timestamp }
   - Actualiza users/{uid}/wallets/{uid} balance (suma monto)
   - Envía notificación al usuario
7. UI actualiza tabla, muestra toast "Recarga aprobada"
```

### Flujo 2: RECHAZAR UN RETIRO CON RAZÓN
```
1. Admin en /admin/operaciones/retiros
2. Selecciona un retiro pendiente
3. Clica "Rechazar"
4. Modal: pide razón de rechazo
5. Admin escribe razón, clica "Rechazar"
6. Hook useRejectWithdrawal():
   - Valida que withdrawal exista
   - Actualiza withdrawals/{id}: { status: 'rejected', rejectedAt, rejectedBy, reason }
   - Crea auditLog
   - Envía notificación al usuario
7. UI muestra toast con confirmación
```

### Flujo 3: VER DETALLE COMPLETO DE UN USUARIO
```
1. Admin en /admin/usuarios
2. Busca/filtra usuario
3. Clica en fila
4. Hook useUserDetail(uid):
   - Carga users/{uid}
   - Carga users/{uid}/wallets/{uid}
   - Carga investments (where userId === uid)
   - Carga topups (where userId === uid)
   - Carga withdrawals (where userId === uid)
5. Drawer/Modal abre con tabs:
   - Perfil (email, status, createdAt)
   - Wallet (saldo, histórico)
   - Inversiones (tabla con acciones)
   - Recargas (tabla con acciones)
   - Retiros (tabla con acciones)
   - Transacciones (historial completo)
6. Admin puede aprobar/rechazar operaciones pendientes SIN cerrar drawer
```

---

## 5. SEGURIDAD & AUDITORÍA

### Validaciones obligatorias en CADA operación:
```javascript
// Antes de cualquier mutation admin
1. Verificar: isAdmin (auth + Firestore role)
2. Verificar: documento existe en Firestore
3. Verificar: estado actual es válido para la acción
4. Crear auditLog ANTES de ejecutar la acción
5. Si mutation falla: registrar error en auditLog
```

### Estructura de auditLog:
```javascript
{
  id: auto-generated,
  action: 'APPROVE_TOPUP' | 'REJECT_WITHDRAWAL' | 'CREATE_PROJECT' | etc,
  adminUid: current user.uid,
  adminEmail: current user.email,
  targetUserId: uid del usuario afectado (si aplica),
  targetId: id del documento afectado (topupId, withdrawalId, etc),
  status: 'SUCCESS' | 'FAILED',
  reason: razón opcional (para rechazos),
  metadata: {
    beforeState: estado anterior,
    afterState: estado nuevo,
    amount: monto (si aplica),
    method: método de pago (si aplica)
  },
  timestamp: new Date(),
  ipAddress: (opcional) para trazabilidad
}
```

---

## 6. REGLAS DE FIRESTORE ESPERADAS

```firestore
// Dashboard & Usuarios (read)
users/{uid} → admin can read all, investors can read self

// Operaciones (read + write)
topups/{id} → admin can read all, can update status only
withdrawals/{id} → admin can read all, can update status only
investments/{id} → admin can read all, can update status only

// Projects (read + write admin)
projects/{id} → admin read/write, investor read

// Methods (read admin)
paymentMethods/{id} → admin read/write
rechargeMethods/{id} → admin read/write

// Audit (read + write admin, immutable)
auditLogs/{id} → admin can read all, admin can create, NOBODY can update/delete
```

---

## 7. DATA FLOW & STATE MANAGEMENT

### Global State (Context/Zustand):
```javascript
AdminContext:
  - currentAdmin: { uid, email, role }
  - isAdmin: boolean
  - canAccessModule: (moduleName) → boolean
```

### Local State (per component):
```javascript
- filtros activos
- usuario seleccionado
- modal abierto/cerrado
- tabla: sort, pagination, loading
```

### Mutations (side effects):
```javascript
- useApproveTopup
- useRejectTopup
- useApproveWithdrawal
- useRejectWithdrawal
- useCreateProject
- useEditProject
- useCreatePaymentMethod
- etc.
```

---

## 8. CHECKLIST IMPLEMENTACIÓN (MVP)

### FASE 1: CORE (Semana 1-2)
- [ ] Estructura de rutas completa
- [ ] Hook `useAdminUsers` + componente UsuariosTable
- [ ] Hook `useUserDetail` + componente UsuarioDetailDrawer
- [ ] Hook `useApproveTopup` + ActionModal
- [ ] Tabla de recargas (`/admin/operaciones/recargas`)
- [ ] Generación básica de auditLogs

### FASE 2: OPERACIONES (Semana 2-3)
- [ ] Tabla de retiros + aprobar/rechazar
- [ ] Tabla de inversiones + view detalle
- [ ] Validaciones de balance antes de aprobar retiro
- [ ] Tabla de transacciones por usuario

### FASE 3: PROYECTOS & CONFIG (Semana 3-4)
- [ ] CRUD proyectos
- [ ] Tabla métodos de pago
- [ ] Tabla auditLogs (read-only)
- [ ] Dashboard con KPIs

### FASE 4: POLISH (Semana 4)
- [ ] Filtros avanzados
- [ ] Exportar a CSV
- [ ] Notificaciones en tiempo real (opcional)
- [ ] Responsive design

---

## 9. CONVENCIONES DE CÓDIGO

### Naming:
```
useAdmin[Recurso] → hooks que leen datos admin
use[Accion][Recurso] → mutations (useApproveTopup, useRejectWithdrawal)
[Recurso]Table → componentes de tabla
[Recurso]Detail → componentes de detalle
[Recurso]Form → formularios de creación/edición
```

### Folder Structure:
```
src/admin/
  ├── hooks/
  │   ├── useAdminUsers.js
  │   ├── useUserDetail.js
  │   ├── useAdminTopups.js
  │   └── mutations/
  │       ├── useApproveTopup.js
  │       ├── useRejectTopup.js
  │       └── ...
  ├── pages/
  │   ├── Dashboard.jsx
  │   ├── Usuarios/
  │   ├── Operaciones/
  │   ├── Proyectos/
  │   └── Configuracion/
  ├── components/
  │   ├── tables/
  │   ├── forms/
  │   ├── modals/
  │   └── shared/
  └── context/
      └── AdminContext.jsx
```

---

## 10. NOTAS IMPORTANTES

1. **NO hacer fetch manual en componentes** → siempre usar hooks
2. **Toda escritura genera auditLog** → inmutable, nunca editar/borrar
3. **Validar rol ANTES de renderizar** → componente AdminGuard global
4. **Drawer/Modal para detalles** → NO salir de la página principal
5. **Pagination & search** → query eficiente a Firestore
6. **Error handling** → mostrar toast, no crashes silenciosos
7. **Loading states** → skeleton loaders en tablas
8. **Responsive first** → mobile-friendly desde diseño

---

## SIGUIENTE PASO

Una vez validada esta arquitectura:
1. Crear estructura de carpetas
2. Implementar FASE 1 (usuarios + recargas)
3. Establecer patrón de datos + auditoría
4. Escalar con FASE 2, 3, 4

¿Aprobado? ¿Cambios a la arquitectura?
