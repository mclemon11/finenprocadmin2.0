import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';

/**
 * Hook para cambiar el estado de una inversión con audit log
 * Estados: active, paused, completed, cancelled
 */
export async function useChangeInvestmentStatus(investmentId, newStatus, reason = '') {
  try {
    const invRef = doc(db, 'investments', investmentId);

    // Registrar en audit log
    const auditLog = {
      action: 'status_change',
      previousStatus: null, // En producción, obtener del snapshot anterior
      newStatus,
      reason,
      changedBy: 'admin', // En producción, obtener del contexto de auth
      timestamp: serverTimestamp(),
    };

    await updateDoc(invRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      'auditLog': arrayUnion(auditLog),
    });

    return { success: true, message: `Inversión actualizada a ${newStatus}` };
  } catch (err) {
    console.error('Error actualizando estado de inversión:', err);
    throw err;
  }
}

/**
 * Hook para registrar un evento de sistema en la inversión
 */
export async function useRecordInvestmentSystemEvent(
  investmentId,
  eventTitle,
  eventDescription = '',
  metadata = {}
) {
  try {
    const invRef = doc(db, 'investments', investmentId);

    const systemEvent = {
      action: 'system_event',
      eventTitle,
      eventDescription,
      metadata,
      recordedBy: 'admin',
      timestamp: serverTimestamp(),
    };

    await updateDoc(invRef, {
      'auditLog': arrayUnion(systemEvent),
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Evento registrado' };
  } catch (err) {
    console.error('Error registrando evento de sistema:', err);
    throw err;
  }
}

/**
 * Hook para actualizar el retorno realizado de una inversión
 */
export async function useUpdateInvestmentReturn(investmentId, realizedReturn, notes = '') {
  try {
    const invRef = doc(db, 'investments', investmentId);

    const returnUpdate = {
      action: 'return_update',
      previousValue: null,
      newValue: realizedReturn,
      notes,
      updatedBy: 'admin',
      timestamp: serverTimestamp(),
    };

    await updateDoc(invRef, {
      realizedReturn: Number(realizedReturn),
      payout: Number(realizedReturn),
      'auditLog': arrayUnion(returnUpdate),
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Retorno actualizado' };
  } catch (err) {
    console.error('Error actualizando retorno:', err);
    throw err;
  }
}
