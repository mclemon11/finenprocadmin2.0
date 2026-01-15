# Quick Start - Sistema de Detalle de Inversión

## 🚀 Servidor Corriendo

```
✅ Vite está ejecutándose
📍 http://localhost:5173/
🔧 Sin errores
```

## 📋 Qué Tenés Implementado

### 1. **Hook: useInvestmentDetail**
- Carga datos completos de una inversión
- Enriquece con cálculos financieros
- Obtiene contexto de usuario, proyecto, eventos, audit log

### 2. **Hooks: useInvestmentMutations**
- `useChangeInvestmentStatus()` - Cambiar estado
- `useRecordInvestmentSystemEvent()` - Registrar evento
- `useUpdateInvestmentReturn()` - Actualizar retorno
- Todos crean entries automáticas en audit log

### 3. **Componente: InvestmentDetailDrawer**
- Mini-drawer desde la derecha
- 4 Tabs:
  - **Resumen:** Datos del inversionista e inversión
  - **Financiero:** ROI, ganancia/pérdida, % del proyecto
  - **Proyecto:** Timeline de eventos
  - **Audit:** Historial de cambios
- 3 Modales: Cambiar Estado, Actualizar Retorno, Registrar Evento
- Footer con acciones admin

### 4. **Integración en ProjectDetailDrawer**
- Tabla de inversiones con rows clickables
- Click en fila → abre InvestmentDetailDrawer
- Refetch automático al cerrar

### 5. **Estilos Completos**
- Mini-drawer fluido
- Responsive mobile
- Animaciones suaves
- Estados visuales

## 🧪 Cómo Probar

### Paso 1: Abre la app
```
http://localhost:5173/
```

### Paso 2: Navegación
1. Abre un **Proyecto** (click en tabla)
2. Ve a tab **"Inversiones"**
3. Haz click en **cualquier fila de inversión**
   → Se abre el **InvestmentDetailDrawer**

### Paso 3: Explora los Tabs

#### Tab "Resumen"
- Ver información del inversionista
- Monto invertido
- % del proyecto
- Estado actual

#### Tab "Financiero"
- ROI esperado vs real
- Ganancia/pérdida esperada vs realizada
- Relación con proyecto
- Botón "Actualizar Retorno"

#### Tab "Proyecto"
- Timeline de eventos del proyecto
- Eventos relevantes para inversionistas

#### Tab "Audit"
- Historial de todos los cambios
- Timestamps de cada acción
- Detalles de cambios de estado, eventos, retornos

### Paso 4: Prueba Acciones

#### Cambiar Estado
```
1. Click "Cambiar Estado"
2. Selecciona: active → paused → completed → cancelled
3. Escribe razón (opcional)
4. Confirma
→ Aparece en "Audit"
```

#### Actualizar Retorno
```
1. Click "Actualizar Retorno"
2. Escribe cantidad recibida
3. Ver cálculo automático: ganancia/pérdida + ROI
4. Agrega notas
5. Confirma
→ Aparece en "Audit"
```

#### Registrar Evento
```
1. Click "Registrar Evento"
2. Título: "Pago parcial recibido"
3. Descripción: "Se recibió $25k de $50k"
4. Confirma
→ Aparece en "Audit"
```

## 📊 Flujo Típico

```
Admin abre proyecto → Ve inversiones → Click en una
                        ↓
      InvestmentDetailDrawer se abre
                        ↓
    Lee datos: Estado, ROI, % proyecto, eventos
                        ↓
      Decide cambiar estado o actualizar retorno
                        ↓
      Hace acción (cambiar estado, actualizar retorno, etc.)
                        ↓
      Firebase guarda cambio + crea audit log entry
                        ↓
      UI actualiza, mensaje de éxito
                        ↓
      Tab "Audit" muestra el cambio
```

## 🎯 Casos de Uso

### Caso 1: Inversión completada
```
1. Tab Financiero: Ver ROI real calculado
2. Click "Cambiar Estado"
3. Selecciona "completed"
4. Razón: "Pago total recibido"
5. Confirma
→ Aparece en audit con timestamp
```

### Caso 2: Inversión en riesgo
```
1. Lee Tab Proyecto: "Estado proyecto: Alto riesgo"
2. Click "Cambiar Estado"
3. Selecciona "paused"
4. Razón: "Pausada por riesgo del proyecto"
5. Confirma
→ Admin tiene audit trail de por qué pausó
```

### Caso 3: Pago parcial recibido
```
1. Tab Financiero: Click "Actualizar Retorno"
2. Ingresa $25,000 de $50,000 esperados
3. Ver preview: Ganancia $-25k (aún esperando el resto)
4. Notas: "Pago parcial - próxima cuota en 30 días"
5. Confirma
→ ROI real se calcula con la cantidad parcial
```

## 💾 Datos que Ve

### De la Inversión
- Monto invertido
- Retorno esperado
- Retorno realizado (actualizable)
- Estado (activa, pausada, completada, cancelada)
- Fecha de inversión

### Del Inversionista
- Email
- Nombre
- (Otros datos que tengas en la colección users)

### Del Proyecto
- Nombre
- Tipo (fijo/variable)
- Riesgo (bajo/medio/alto)
- Estado (activo/pausado/cerrado)
- Capital total invertido
- Meta del proyecto

### Eventos Proyecto
- Timeline completo
- Eventos que impactan inversionistas
- Visibilidad (admin/investors/all)

### Audit Log
- Quién hizo qué
- Cuándo lo hizo (timestamp)
- Por qué (razón/notas)
- Valores antes y después

## 🎨 Estados Visuales

- **Active** 🟢 Verde
- **Completed** 🔵 Azul
- **Paused** 🟡 Amarillo
- **Cancelled** 🔴 Rojo

- **ROI Positivo** 🟢 Verde
- **ROI Negativo** 🔴 Rojo
- **Pendiente** ⚪ Gris

## 🔧 Estructura de Código

### Hook de Datos
```javascript
const { investment, user, project, projectEvents, auditLog, refetch } = 
  useInvestmentDetail(investmentId);
```

### Mutations (Acciones)
```javascript
await useChangeInvestmentStatus(investmentId, 'completed', 'Pago recibido');
await useRecordInvestmentSystemEvent(investmentId, 'Pago parcial', '...');
await useUpdateInvestmentReturn(investmentId, 45000, 'Notas...');
```

## 📁 Archivos Clave

```
src/admin/
├── hooks/
│   ├── useInvestmentDetail.js
│   └── mutations/
│       └── useInvestmentMutations.js
├── components/drawers/
│   ├── ProjectDetailDrawer.jsx (modificado)
│   ├── InvestmentDetailDrawer.jsx (nuevo)
│   └── InvestmentDetailDrawer.css (nuevo)
```

## ✨ Features Incluidas

✅ Control fino de inversiones (estado, retorno, eventos)
✅ Análisis financiero (ROI, ganancia/pérdida)
✅ Trazabilidad total (audit log inmutable)
✅ Contexto integrado (usuario, proyecto, eventos)
✅ UX profesional (drawer fluido, modales, animaciones)
✅ Responsive mobile
✅ Validaciones en cliente
✅ Mensajes de éxito/error
✅ Loading states

## 🐛 Troubleshooting

### InvestmentDetailDrawer no abre
- ¿Hiciste click en la fila correcta?
- ¿El investmentId se asignó? (Ver console)

### Cambio no aparece en Audit
- Espera refetch (2-3 segundos)
- Verifica que no hay error en console
- Revisa en Firebase que se guardó

### Números no coinciden
- ROI se calcula: (gain / amount) * 100
- % proyecto: (amount / totalInvested) * 100
- Ganancia: expectedReturn - amount

## 📞 Documentación

- **[INVESTMENT_DETAIL_SYSTEM.md](INVESTMENT_DETAIL_SYSTEM.md)** - Arquitectura completa
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Resumen de implementación

## 🎉 Listo para Producción

El sistema está completamente implementado, testeado y listo para usar en producción:

- ✅ Código organizado y documentado
- ✅ Arquitectura escalable
- ✅ Validaciones robustas
- ✅ UX profesional
- ✅ Audit trail completo
- ✅ Servidor corriendo sin errores

**¡Listo para empezar a usar!**

---

**Servidor:** http://localhost:5173/
**Status:** ✅ Running
**Errores:** 0
