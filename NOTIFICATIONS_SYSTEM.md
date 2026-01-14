# 🔔 Sistema de Notificaciones Automáticas - Documentación Técnica

## 📐 Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE NOTIFICACIONES                   │
└─────────────────────────────────────────────────────────────┘

Admin Panel (Drawer)
  │
  ├─ Tab: Timeline
  │   └─ Formulario evento
  │       ├─ type: milestone | update | notice | system
  │       ├─ visibility: admin | investors | all
  │       ├─ title
  │       └─ description
  │
  ↓ Submit
  │
useProjectTimeline.addEvent()
  │
  ├─ 1. Crear documento en Firestore
  │   ↓ projects/{projectId}/timeline/{eventId}
  │
  ├─ 2. Check visibilidad
  │   ↓ if (visibility === 'investors' || 'all')
  │
  └─ 3. Auto-notificar inversionistas
      ↓ createInvestorNotifications()
      │
      ├─ Query: investments where projectId === X
      ├─ Filter: status === 'active' || 'completed'
      ├─ Extract: unique userIds (Set)
      └─ Create: notifications/{notificationId}
          ├─ userId
          ├─ projectId
          ├─ eventId
          ├─ type: 'project_update'
          ├─ title
          ├─ message
          ├─ read: false
          └─ createdAt
```

---

## 🎯 Reglas de Visibilidad

| Visibilidad | Admin Ve | Inversionistas Ven | Genera Notificaciones | Uso Principal |
|-------------|----------|--------------------|-----------------------|---------------|
| **admin** | ✅ | ❌ | ❌ | Logs internos, cambios de estado |
| **investors** | ✅ | ✅ | ✅ | Actualizaciones del proyecto |
| **all** | ✅ | ✅ | ✅ | Anuncios públicos, milestones |

---

## 💾 Modelo de Datos

### Timeline Event (Subcollection)
```javascript
// Path: projects/{projectId}/timeline/{eventId}
{
  type: 'milestone' | 'update' | 'notice' | 'system',
  title: string,              // "Proyecto alcanzó 50% de funding"
  description: string | null, // Descripción extendida (opcional)
  visibility: 'admin' | 'investors' | 'all',
  createdBy: string,          // adminId
  createdAt: Timestamp,       // serverTimestamp()
  metadata: object | null     // Data adicional (opcional)
}
```

### Notification (Collection)
```javascript
// Path: notifications/{notificationId}
{
  userId: string,             // Inversionista que recibe la notificación
  projectId: string,          // Proyecto origen del evento
  eventId: string,            // ID del evento en timeline (referencia)
  type: 'project_update',     // Tipo de notificación
  title: string,              // Título del evento
  message: string,            // Descripción o título (si no hay descripción)
  read: boolean,              // false por defecto
  createdAt: Timestamp        // serverTimestamp()
}
```

---

## 🔧 Implementación Técnica

### useProjectTimeline.js (Hook)

```javascript
const createInvestorNotifications = async (projectId, eventId, eventData) => {
  try {
    // 1. Query todas las inversiones
    const investmentsRef = collection(db, 'investments');
    const investmentsSnap = await getDocs(investmentsRef);
    
    // 2. Filtrar inversionistas del proyecto (status activo/completado)
    const investors = new Set();
    investmentsSnap.docs.forEach((doc) => {
      const inv = doc.data();
      if (
        inv.projectId === projectId && 
        (inv.status === 'active' || inv.status === 'completed')
      ) {
        investors.add(inv.userId);
      }
    });
    
    // 3. Si no hay inversionistas, salir
    if (investors.size === 0) return;
    
    // 4. Crear notificación para cada inversionista único
    const notificationsRef = collection(db, 'notifications');
    const promises = Array.from(investors).map((userId) =>
      addDoc(notificationsRef, {
        userId,
        projectId,
        eventId,
        type: 'project_update',
        title: eventData.title,
        message: eventData.description || eventData.title,
        read: false,
        createdAt: serverTimestamp(),
      })
    );
    
    // 5. Ejecutar en paralelo
    await Promise.all(promises);
    
    console.log(`✅ ${investors.size} notificaciones creadas para proyecto ${projectId}`);
  } catch (err) {
    console.error('Error creando notificaciones:', err);
    throw err;
  }
};
```

---

## 🚀 Flujo de Uso (Paso a Paso)

### Escenario: Admin publica actualización del proyecto

**Contexto:**
- Proyecto "Fondo Inmobiliario A" tiene 5 inversionistas activos
- Admin quiere notificar a todos sobre un nuevo hito

**Paso 1: Admin abre drawer**
```javascript
// ProyectosPage.jsx
<button onClick={() => openDetail(project)}>Ver detalle</button>

// Estado cambia
setSelectedProject(project);
setIsDrawerOpen(true);
```

**Paso 2: Admin navega a tab Timeline**
```javascript
<button onClick={() => setActiveTab('timeline')}>Timeline</button>
```

**Paso 3: Admin completa formulario**
```javascript
// ProjectTimeline.jsx (formulario inline)
<form onSubmit={handleSubmit}>
  <select value={form.type}>
    <option value="milestone">Hito (Milestone)</option>
    <option value="update">Actualización</option>
    <option value="notice">Aviso</option>
  </select>
  
  <select value={form.visibility}>
    <option value="investors">Inversionistas</option> ← SELECCIONADO
    <option value="all">Todos</option>
  </select>
  
  <input 
    type="text" 
    placeholder="Título" 
    value="Proyecto alcanzó 50% de funding"
  />
  
  <textarea 
    placeholder="Descripción"
    value="El día de hoy alcanzamos el 50% del capital objetivo..."
  />
</form>
```

**Paso 4: Admin envía formulario**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  await addEvent({
    type: 'milestone',
    title: 'Proyecto alcanzó 50% de funding',
    description: 'El día de hoy alcanzamos el 50% del capital objetivo...',
    visibility: 'investors', // ← TRIGGER
    createdBy: adminData.uid,
  });
  
  refetch(); // Recargar timeline
};
```

**Paso 5: Hook procesa evento**
```javascript
// useProjectTimeline.js
const addEvent = async (eventData) => {
  // A. Crear evento en timeline
  const eventRef = await addDoc(timelineRef, {
    type: 'milestone',
    title: 'Proyecto alcanzó 50% de funding',
    description: 'El día de hoy alcanzamos el 50% del capital objetivo...',
    visibility: 'investors',
    createdBy: 'admin123',
    createdAt: serverTimestamp(),
  });
  
  // B. Check visibilidad
  if (eventData.visibility === 'investors' || eventData.visibility === 'all') {
    // C. Auto-crear notificaciones
    await createInvestorNotifications(projectId, eventRef.id, eventData);
  }
  
  return eventRef.id;
};
```

**Paso 6: Sistema detecta inversionistas**
```javascript
// Query Firestore
const investmentsSnap = await getDocs(investmentsRef);

// Filtrar
const investors = new Set();
investmentsSnap.docs.forEach((doc) => {
  const inv = doc.data();
  
  // Ejemplo de inversión válida:
  // {
  //   userId: 'user456',
  //   projectId: 'project789', ← MATCH
  //   status: 'active',        ← VÁLIDO
  //   amount: 50000
  // }
  
  if (inv.projectId === 'project789' && 
      (inv.status === 'active' || inv.status === 'completed')) {
    investors.add('user456'); // Añadir al Set (evita duplicados)
  }
});

// Resultado: Set(['user456', 'user789', 'user012', 'user345', 'user678'])
// Total: 5 inversionistas únicos
```

**Paso 7: Crear notificaciones en paralelo**
```javascript
const promises = Array.from(investors).map((userId) =>
  addDoc(notificationsRef, {
    userId,                    // 'user456', 'user789', etc.
    projectId: 'project789',
    eventId: 'event_abc123',   // ID del evento recién creado
    type: 'project_update',
    title: 'Proyecto alcanzó 50% de funding',
    message: 'El día de hoy alcanzamos el 50% del capital objetivo...',
    read: false,
    createdAt: serverTimestamp(),
  })
);

await Promise.all(promises); // Ejecuta 5 writes en paralelo
```

**Paso 8: Confirmación visual**
```javascript
// Timeline se actualiza automáticamente
refetch();

// Admin ve el nuevo evento en la lista
// Badge: "Inversionistas" (orange)
// Estado: "5 notificaciones enviadas" (en consola)
```

---

## 🎯 Casos de Uso

### Caso 1: Milestone Público
```javascript
{
  type: 'milestone',
  title: 'Proyecto completamente fondeado',
  visibility: 'all', // ← Visible para todos, notifica a inversionistas
}
// Resultado: Evento en timeline + 10 notificaciones (si hay 10 inversionistas)
```

### Caso 2: Actualización Interna
```javascript
{
  type: 'system',
  title: 'Proyecto actualizado: ROI esperado cambió de 12% a 15%',
  visibility: 'admin', // ← Solo admin
}
// Resultado: Evento en timeline, NO se crean notificaciones
```

### Caso 3: Aviso a Inversionistas
```javascript
{
  type: 'notice',
  title: 'Recordatorio: Documentos pendientes',
  description: 'Por favor completa tu KYC antes del 31 de enero.',
  visibility: 'investors', // ← Solo inversionistas
}
// Resultado: Evento en timeline + notificaciones para inversionistas
```

---

## ⚠️ Consideraciones Técnicas

### Performance
- **Query completo de inversiones**: Puede ser costoso con muchos proyectos
- **Solución futura**: Usar composite index `(projectId, status)`
- **Alternativa**: Mantener array `investorIds` en documento del proyecto (desnormalización)

### Idempotencia
- **Problema**: Si `addEvent()` se ejecuta dos veces, crea duplicados
- **Solución**: Usar `eventId` como idempotency key en notificaciones
- **Implementación futura**:
  ```javascript
  const notificationId = `${projectId}_${eventId}_${userId}`;
  await setDoc(doc(db, 'notifications', notificationId), {...});
  ```

### Escalabilidad
- **Límite**: Firestore permite max 500 writes/segundo
- **Si >500 inversionistas**: Dividir en batches
- **Firestore Batched Writes**:
  ```javascript
  const batch = writeBatch(db);
  investors.forEach(userId => {
    const ref = doc(notificationsRef);
    batch.set(ref, {...});
  });
  await batch.commit();
  ```

### Seguridad (Firestore Rules)
```javascript
// Regla para timeline (escribir solo admin)
match /projects/{projectId}/timeline/{eventId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.role == 'admin';
}

// Regla para notificaciones (leer/escribir solo el usuario)
match /notifications/{notificationId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}
```

---

## 📊 Monitoring y Debug

### Logs Útiles
```javascript
console.log(`✅ Evento creado: ${eventRef.id}`);
console.log(`📧 ${investors.size} notificaciones enviadas`);
console.log(`Inversionistas notificados:`, Array.from(investors));
```

### Verificación en Firestore Console
1. **Check timeline**: `projects/{projectId}/timeline/{eventId}`
2. **Check notifications**: `notifications` where `projectId == X && createdAt > timestamp`
3. **Count**: Debe haber 1 notificación por cada inversionista único

### Testing en Dev
```javascript
// Crear proyecto de prueba con 2 inversiones del mismo usuario
// Verificar que solo se cree 1 notificación (Set previene duplicados)

const testInvestments = [
  { userId: 'user123', projectId: 'project789', status: 'active', amount: 10000 },
  { userId: 'user123', projectId: 'project789', status: 'completed', amount: 5000 }
];

// Resultado esperado: 1 notificación (no 2)
```

---

## ✅ Checklist de Implementación

- [x] Hook `useProjectTimeline` con función `addEvent()`
- [x] Función `createInvestorNotifications()` implementada
- [x] Query de inversiones con filtro por `projectId` y `status`
- [x] Set para prevenir notificaciones duplicadas
- [x] Promise.all para writes paralelos
- [x] Vinculación `projectId` + `eventId` en notificaciones
- [x] Componente `ProjectTimeline` con formulario de eventos
- [x] Selector de visibilidad (admin/investors/all)
- [x] Integración en `ProjectDetailDrawer` (Tab Timeline)
- [x] Callback `onTimelineEvent` para eventos del sistema
- [x] Tab "Actividad" para filtrar eventos admin-only

---

## 🚀 Futuras Mejoras

### Dashboard Inversionista
```javascript
// Página: /dashboard/notifications
useNotifications(userId) → query where userId == current
// Renderizar lista de notificaciones con link a proyecto
<NotificationItem
  title={notification.title}
  message={notification.message}
  projectId={notification.projectId}
  eventId={notification.eventId}
  onRead={() => markAsRead(notification.id)}
/>
```

### Email Notifications (Firebase Extensions)
```javascript
// Trigger al crear notificación
onCreate(notification) → sendEmail({
  to: getUserEmail(notification.userId),
  subject: notification.title,
  body: notification.message,
  link: `https://finenproc.com/projects/${notification.projectId}`
});
```

### Push Notifications (FCM)
```javascript
// Almacenar FCM token en perfil de usuario
user.fcmToken = 'fcm_token_abc123';

// Al crear notificación
await admin.messaging().send({
  token: user.fcmToken,
  notification: {
    title: notification.title,
    body: notification.message,
  },
  data: {
    projectId: notification.projectId,
    eventId: notification.eventId,
  }
});
```

---

**Fecha:** 14 de enero de 2026  
**Versión:** Admin Panel Finenproc 2.0  
**Status:** ✅ Sistema de notificaciones automáticas 100% funcional
