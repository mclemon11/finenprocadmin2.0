# API Reference - Investment Detail System

## Hooks

### `useInvestmentDetail(investmentId)`

Hook principal que carga todos los datos de una inversión.

**Parámetros:**
- `investmentId` (string, required) - ID de la inversión en Firebase

**Retorna:**
```javascript
{
  investment: {
    id: string,
    amount: number,
    expectedReturn: number,
    realizedReturn: number,
    status: 'active' | 'paused' | 'completed' | 'cancelled',
    createdAt: Timestamp,
    updatedAt: Timestamp,
    
    // Enriquecidos:
    expectedROI: number,        // ROI esperado en %
    actualROI: number,          // ROI realizado en %
    projectionOfTotal: number,  // % del capital total del proyecto
    expectedGain: number,       // Ganancia esperada (esperado - monto)
    actualGain: number,         // Ganancia realizada (realizado - monto)
  },
  
  user: {
    id: string,
    email: string,
    displayName: string,
    fullName: string,
    // ... otros datos del usuario
  },
  
  project: {
    id: string,
    name: string,
    type: 'fixed' | 'variable',
    riskLevel: 'low' | 'medium' | 'high',
    status: string,
    totalInvested: number,
    targetAmount: number,
    computedStatus: string,
    // ... otros datos del proyecto
  },
  
  projectEvents: [
    {
      id: string,
      title: string,
      description: string,
      type: 'system' | 'update',
      visibility: 'admin' | 'investors' | 'all',
      createdAt: Timestamp,
      // ... otros datos del evento
    }
  ],
  
  auditLog: [
    {
      id: string,
      action: 'status_change' | 'system_event' | 'return_update',
      timestamp: Timestamp,
      // ... detalles específicos de la acción
    }
  ],
  
  loading: boolean,
  error: string | null,
  refetch: () => Promise<void>
}
```

**Ejemplo:**
```javascript
const { investment, user, project, auditLog, loading, refetch } = 
  useInvestmentDetail('inv_123');

if (loading) return <div>Cargando...</div>;

console.log(`${user.email} invirtió ${investment.amount}`);
console.log(`ROI esperado: ${investment.expectedROI}%`);
```

---

### `useChangeInvestmentStatus(investmentId, newStatus, reason)`

Cambia el estado de una inversión y registra en audit log.

**Parámetros:**
- `investmentId` (string, required) - ID de la inversión
- `newStatus` (string, required) - Nuevo estado: 'active' | 'paused' | 'completed' | 'cancelled'
- `reason` (string, optional) - Razón del cambio

**Retorna:**
```javascript
Promise<{
  success: boolean,
  message: string
}>
```

**Lanza:**
- Error si la inversión no existe
- Error si hay problema guardando en Firebase

**Ejemplo:**
```javascript
try {
  const result = await useChangeInvestmentStatus(
    'inv_123',
    'completed',
    'Pago completo recibido'
  );
  console.log(result.message); // "Inversión actualizada a completed"
} catch (err) {
  console.error(err);
}
```

**Audit Log Entry:**
```javascript
{
  action: 'status_change',
  previousStatus: 'active',
  newStatus: 'completed',
  reason: 'Pago completo recibido',
  changedBy: 'admin',
  timestamp: Timestamp
}
```

---

### `useRecordInvestmentSystemEvent(investmentId, eventTitle, eventDescription, metadata)`

Registra un evento de sistema en la inversión.

**Parámetros:**
- `investmentId` (string, required) - ID de la inversión
- `eventTitle` (string, required) - Título del evento
- `eventDescription` (string, optional) - Descripción
- `metadata` (object, optional) - Datos adicionales

**Retorna:**
```javascript
Promise<{
  success: boolean,
  message: string
}>
```

**Ejemplo:**
```javascript
await useRecordInvestmentSystemEvent(
  'inv_123',
  'Pago parcial recibido',
  'Se recibió $25,000 de $50,000 esperados',
  {
    amountReceived: 25000,
    expectedAmount: 50000,
    paymentMethod: 'transferencia'
  }
);
```

**Audit Log Entry:**
```javascript
{
  action: 'system_event',
  eventTitle: 'Pago parcial recibido',
  eventDescription: 'Se recibió $25,000 de $50,000 esperados',
  metadata: { amountReceived: 25000, ... },
  recordedBy: 'admin',
  timestamp: Timestamp
}
```

---

### `useUpdateInvestmentReturn(investmentId, realizedReturn, notes)`

Actualiza el retorno realizado de una inversión.

**Parámetros:**
- `investmentId` (string, required) - ID de la inversión
- `realizedReturn` (number, required) - Cantidad recibida
- `notes` (string, optional) - Notas sobre el retorno

**Retorna:**
```javascript
Promise<{
  success: boolean,
  message: string
}>
```

**Ejemplo:**
```javascript
await useUpdateInvestmentReturn(
  'inv_123',
  50000,
  'Pago final completado. Inversión original fue $50k, ganancia final: $7.5k'
);

// Automáticamente calcula:
// - actualROI: (50000 - 50000) / 50000 * 100 = 0% (si fue pago solo de devolución)
// - O si esperábamos $57.5k: (57.5k - 50k) / 50k * 100 = 15%
```

**Audit Log Entry:**
```javascript
{
  action: 'return_update',
  previousValue: null,      // o valor anterior
  newValue: 50000,
  notes: 'Pago final completado...',
  updatedBy: 'admin',
  timestamp: Timestamp
}
```

---

## Componentes

### `InvestmentDetailDrawer`

Componente principal que muestra el detalle de una inversión.

**Props:**
```javascript
{
  investmentId: string,      // required - ID de la inversión
  isOpen: boolean,           // required - Si está abierto
  onClose: () => void,       // required - Callback al cerrar
  onUpdate: () => void       // optional - Callback cuando hay cambios
}
```

**Ejemplo:**
```jsx
const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);

<InvestmentDetailDrawer
  investmentId={selectedInvestmentId}
  isOpen={!!selectedInvestmentId}
  onClose={() => setSelectedInvestmentId(null)}
  onUpdate={() => {
    // Refetch datos principales si es necesario
    refetchInvestments();
  }}
/>
```

**Características:**
- Header con info rápida (usuario, monto, estado)
- 4 Tabs: Resumen, Financiero, Proyecto, Audit
- Modales para acciones: Cambiar Estado, Actualizar Retorno, Registrar Evento
- Footer con botones de acción
- Manejo de loading y errores
- Mensajes de éxito/error
- Responsive mobile

---

## Tipos de Datos

### Investment
```javascript
{
  id: string,
  userId: string,
  projectId: string,
  amount: number,
  expectedReturn: number,
  realizedReturn: number,
  payout: number,
  status: 'active' | 'paused' | 'completed' | 'cancelled',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Enriquecidos por useInvestmentDetail:
  userEmail: string,
  userName: string,
  projectName: string,
  expectedROI: number,
  actualROI: number,
  projectionOfTotal: number,
  expectedGain: number,
  actualGain: number
}
```

### AuditLogEntry
```javascript
{
  id: string,
  action: 'status_change' | 'system_event' | 'return_update',
  timestamp: Timestamp,
  changedBy: string,      // 'admin' u otro usuario
  
  // Para status_change:
  previousStatus: string,
  newStatus: string,
  reason: string,
  
  // Para system_event:
  eventTitle: string,
  eventDescription: string,
  metadata: object,
  recordedBy: string,
  
  // Para return_update:
  previousValue: number,
  newValue: number,
  notes: string,
  updatedBy: string
}
```

---

## Firebase Firestore Schema

### Collection: `investments`
```
/investments/{investmentId}
├── userId: string
├── projectId: string
├── amount: number
├── expectedReturn: number
├── realizedReturn: number
├── payout: number
├── status: string
├── createdAt: Timestamp
├── updatedAt: Timestamp
│
└── /auditLog/{entryId}
    ├── action: string
    ├── timestamp: Timestamp
    ├── [otros campos según action]
```

---

## Ejemplos de Uso

### Caso 1: Ver detalle de inversión
```jsx
import useInvestmentDetail from '../../hooks/useInvestmentDetail';
import InvestmentDetailDrawer from '../../components/drawers/InvestmentDetailDrawer';

function MyComponent() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <button onClick={() => setSelectedId('inv_123')}>
        Ver Inversión
      </button>
      
      <InvestmentDetailDrawer
        investmentId={selectedId}
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
```

### Caso 2: Cambiar estado manualmente
```jsx
import { useChangeInvestmentStatus } from '../../hooks/mutations/useInvestmentMutations';

async function pauseInvestment() {
  try {
    await useChangeInvestmentStatus(
      'inv_123',
      'paused',
      'Pausada por riesgo del proyecto'
    );
    // Refetch datos
  } catch (err) {
    console.error(err);
  }
}
```

### Caso 3: Registrar pago
```jsx
import { useUpdateInvestmentReturn } from '../../hooks/mutations/useInvestmentMutations';

async function recordPayment() {
  try {
    await useUpdateInvestmentReturn(
      'inv_123',
      55000,
      'Pago completo recibido en cuenta'
    );
    // ROI se calcula automáticamente
  } catch (err) {
    console.error(err);
  }
}
```

---

## Validaciones

- ✅ `investmentId`: Debe existir en Firebase
- ✅ `newStatus`: Una de las opciones válidas
- ✅ `realizedReturn`: Número positivo
- ✅ `eventTitle`: Requerido, no vacío
- ✅ Todos los cambios generan audit entry

---

## Cálculos Automáticos

### ROI Esperado
```
expectedROI = (expectedReturn - amount) / amount * 100
```

### ROI Real
```
actualROI = (realizedReturn - amount) / amount * 100
```

### Ganancia/Pérdida Esperada
```
expectedGain = expectedReturn - amount
```

### Ganancia/Pérdida Realizada
```
actualGain = realizedReturn - amount
```

### Porcentaje del Proyecto
```
projectionOfTotal = (amount / totalInvested) * 100
```

---

## Error Handling

Todos los hooks retornan promesas que pueden rechazarse:

```javascript
try {
  await useChangeInvestmentStatus('inv_123', 'completed');
} catch (err) {
  // err.message contiene el mensaje de error
  console.error('Error:', err.message);
}
```

Errores posibles:
- "Inversión no encontrada"
- "Error actualizando estado de inversión"
- "Error registrando evento de sistema"
- "Error actualizando retorno"

---

## Performance

- `useInvestmentDetail` carga datos paralelos (no secuencial)
- Cache de datos mientras el componente está montado
- `refetch()` recarga todos los datos
- Lazy loading de modales (se crean al abrirse)

---

## Responsive Design

- **Desktop:** Drawer 500px desde derecha
- **Tablet:** Drawer 80% del ancho
- **Mobile:** Drawer full-width (100%)
- Todos los componentes se adaptan automáticamente

---

## Testing

```javascript
// Probar que se carga la data
const { investment, loading } = useInvestmentDetail('inv_123');
expect(loading).toBe(false);
expect(investment.id).toBe('inv_123');

// Probar cambio de estado
await useChangeInvestmentStatus('inv_123', 'completed', 'Test');
expect(investment.status).toBe('completed');

// Probar audit log
expect(auditLog).toContainEqual(
  expect.objectContaining({
    action: 'status_change',
    newStatus: 'completed'
  })
);
```

---

## Licencia

Este sistema es parte del admin panel de Finenproc.

---

Versión: 1.0.0
Última actualización: 15 de enero de 2026
