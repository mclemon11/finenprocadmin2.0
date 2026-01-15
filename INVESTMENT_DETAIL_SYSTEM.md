# Investment Detail System - Arquitectura

## Visión General

Sistema completo de detalle y control de inversiones para el admin panel, con trazabilidad total, control financiero fino y UX profesional tipo fintech.

## Componentes Implementados

### 1. Hook: `useInvestmentDetail` 
**Archivo:** `src/admin/hooks/useInvestmentDetail.js`

**Responsabilidad:** Carga todos los datos relacionados con una inversión en contexto.

**Datos que carga:**
- **Inversión:** Estado, monto, retornos esperados/realizados
- **Usuario (inversionista):** Email, nombre, datos de contacto
- **Proyecto:** Metadatos, riesgo, estado, capital total
- **Timeline del Proyecto:** Eventos que impactan la inversión
- **Audit Log:** Historial completo de cambios en la inversión

**Enriquecimiento de datos:**
- Cálculo de ROI esperado y real
- Cálculo de porcentaje del proyecto (% de capital total)
- Cálculo de ganancia/pérdida esperada y realizada

```javascript
{
  investment: { ...data, expectedROI, actualROI, projectionOfTotal, expectedGain, actualGain },
  user: { ...userData },
  project: { ...projectData },
  projectEvents: [ ...events ],
  auditLog: [ ...changes ],
  loading, error, refetch
}
```

### 2. Hooks de Mutaciones: `useInvestmentMutations`
**Archivo:** `src/admin/hooks/mutations/useInvestmentMutations.js`

**Funciones disponibles:**

#### `useChangeInvestmentStatus(investmentId, newStatus, reason)`
Cambia el estado de una inversión (active → paused → completed → cancelled).
- Registra cambio en audit log
- Incluye razón del cambio
- Trazable: quién, cuándo, por qué

#### `useRecordInvestmentSystemEvent(investmentId, eventTitle, description, metadata)`
Registra eventos de sistema que impacten la inversión.
- Auditable: creador, timestamp
- Almacena metadatos adicionales
- Vinculado al audit log de la inversión

#### `useUpdateInvestmentReturn(investmentId, realizedReturn, notes)`
Actualiza el retorno realizado de una inversión.
- Calcula ROI real automáticamente
- Registra cambio histórico
- Incluye notas de administrador

### 3. Componente: `InvestmentDetailDrawer`
**Archivo:** `src/admin/components/drawers/InvestmentDetailDrawer.jsx`

**Arquitectura:**

```
InvestmentDetailDrawer
├── Header (proyecto, usuario, estado)
├── Tabs
│   ├── Resumen (Overview)
│   ├── Financiero (Financial Analysis)
│   ├── Proyecto (Project Events)
│   └── Audit (Change History)
├── Content (tab-based)
└── Actions Footer (admin controls)
```

**Header Information:**
- Inversionista (nombre + email)
- Estado de inversión (badge interactivo)
- Monto invertido
- Proyecto
- Fecha

**Tab: Resumen**
- Cards con datos clave:
  - Inversionista
  - Monto invertido
  - % del proyecto
  - Estado actual
- Sección info general:
  - Proyecto y tipo
  - Riesgo del proyecto
  - Fecha de inversión
  - Estado del proyecto

**Tab: Financiero**
- Grid de métricas:
  - ROI esperado
  - ROI real
  - Ganancia esperada
  - Ganancia realizada
- Detalles financieros:
  - Monto invertido
  - Retorno esperado
  - Retorno realizado
  - Botón para actualizar retorno
- Relación con proyecto:
  - % del capital total
  - Capital total del proyecto
  - Meta del proyecto

**Tab: Proyecto**
- Timeline de eventos del proyecto
- Eventos que impactan inversiones (tipo: system, visibility: investors/all)
- Filtro automático por relevancia

**Tab: Audit**
- Historial completo de cambios
- Formato legible:
  - Cambios de estado: "De active a completed"
  - Eventos: "Pago parcial recibido"
  - Actualizaciones de retorno: "Retorno actualizado a $50,000"
- Timestamp de cada acción

**Modales de Acción:**

1. **Status Change Modal**
   - Selector de nuevo estado
   - Campo de razón (opcional)
   - Confirmación

2. **Return Update Modal**
   - Input de retorno realizado
   - Preview en vivo: ganancia/pérdida + ROI
   - Campo de notas

3. **System Event Modal**
   - Título del evento
   - Descripción
   - Registro automático en audit log

**Estilos:** `InvestmentDetailDrawer.css`
- Mini-drawer (500px) desde la derecha
- Overlay cuando está abierto
- Tabs con scroll
- Responsive para mobile
- Animaciones suave

### 4. Integración en `ProjectDetailDrawer`
**Cambios:**
- Importación de `InvestmentDetailDrawer`
- State para `selectedInvestmentId`
- Tabla de inversiones con rows clickables
- Abre el drawer al hacer click en una inversión
- Refetch de datos al cerrar el drawer

## Flujo de Datos

```
ProjectDetailDrawer (tab: inversiones)
    ↓
Click en fila de inversión
    ↓
setSelectedInvestmentId(investmentId)
    ↓
InvestmentDetailDrawer monta
    ↓
useInvestmentDetail carga datos
    ↓
Renderiza headers, tabs, content
    ↓
Usuario hace acción (cambiar estado, registrar evento)
    ↓
Mutation (useChangeInvestmentStatus, etc.)
    ↓
Firebase actualiza + crea audit log
    ↓
refetch() recarga datos
    ↓
Drawer se actualiza
    ↓
onUpdate() → ProjectDetailDrawer refetch
```

## Trazabilidad y Audit

### Audit Log Structure
```javascript
{
  action: 'status_change' | 'system_event' | 'return_update',
  timestamp: serverTimestamp(),
  changedBy: 'admin',
  
  // Para status_change:
  previousStatus: 'active',
  newStatus: 'completed',
  reason: 'Pago recibido completamente',
  
  // Para system_event:
  eventTitle: 'Pago parcial recibido',
  eventDescription: 'Se recibió $25,000 de los $50,000 esperados',
  metadata: { ... },
  
  // Para return_update:
  previousValue: 45000,
  newValue: 50000,
  notes: 'Pago finalmente completado'
}
```

### Almacenamiento
Subcollection en documento de inversión:
```
/investments/{investmentId}/auditLog/{entryId}
```

Cada cambio es inmutable e histórico.

## Características Clave

✅ **Control Fino:** Cambio de estado, actualización de retorno, registro de eventos
✅ **Trazabilidad Total:** Audit log completo con timestamps y quién hizo qué
✅ **Contexto:** Usuario, proyecto, eventos proyecto integrados
✅ **UX Profesional:** Drawer fluido, modales claros, animaciones suave
✅ **Financiero Real:** Cálculos de ROI, ganancia/pérdida, proyecciones
✅ **No Duplicado:** Reutiliza hooks de proyecto y usuario
✅ **Escalable:** Arquitectura preparada para nuevas acciones y eventos

## Estados de Inversión

- **active:** Inversión activa, en espera de retorno
- **paused:** Inversión pausada (retención temporal)
- **completed:** Inversión completada, retorno recibido
- **cancelled:** Inversión cancelada

## Validaciones

- Campo de retorno realizado: numérico, positivo
- Cambio de estado: lógica de flujo respetada
- Evento de sistema: título requerido
- Todas las acciones registran audit log

## Próximos Pasos Opcionales

1. **Notificaciones:** Enviar notificaciones a inversionista cuando estado cambia
2. **Reportes:** Exportar audit log a PDF/Excel
3. **Búsqueda avanzada:** Filtrar inversiones por rango de fechas, estado, ROI
4. **Validación de flujo:** Impedir transiciones de estado inválidas
5. **Comentarios:** Permitir comunicación entre admin e inversionista
6. **Webhook:** Integración con sistemas externos para auditoría

## Testing

Para verificar que todo funciona:
1. Abre un proyecto en el drawer
2. Ve a tab "Inversiones"
3. Haz click en una inversión
4. Verifica que se abra el InvestmentDetailDrawer
5. Navega por los tabs
6. Prueba las acciones (cambiar estado, registrar evento)
7. Verifica que aparezca en audit log

## Conclusión

Sistema completo, profesional y trazable que permite a administradores:
- Analizar inversiones en profundidad
- Controlar estados y retornos
- Mantener audit trail completo
- Tomar decisiones basadas en datos
- Comunicar cambios sistemáticamente

La arquitectura es sólida, modular y lista para producción.
