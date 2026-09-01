import { supabase } from './supabase';

export interface SyncResult {
  inventoriesSynced: number;
  evaluationsSynced: number;
  logbookSynced: number;
  totalSynced: number;
}

export async function syncOfflineDataToSupabase(): Promise<SyncResult> {
  let inventoriesSynced = 0;
  let evaluationsSynced = 0;
  let logbookSynced = 0;

  // 1. Sincronizar Inventarios pendientes guardados localmente
  const savedOfflineInventories = localStorage.getItem('gedaluma_offline_inventories');
  if (savedOfflineInventories) {
    try {
      const offlineArr: any[] = JSON.parse(savedOfflineInventories);
      const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
      const remainingOffline: any[] = [];

      for (const offInv of offlineArr) {
        const payloadToSync = {
          id: offInv.id || `inv_sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          isla_id: String(offInv.isla_id || ''),
          isla_name: offInv.isla_name || 'Desconocida',
          evaluator_name: offInv.evaluator_name || 'Auditor',
          date: offInv.date || new Date().toISOString().split('T')[0],
          start_time: offInv.start_time || '00:00',
          end_time: offInv.end_time || '00:00',
          total_missing: Number(offInv.total_missing || 0),
          total_missing_dollars: Number(offInv.total_missing_dollars || 0),
          total_match: Number(offInv.total_match || 0),
          total_surplus: Number(offInv.total_surplus || 0),
          total_surplus_dollars: Number(offInv.total_surplus_dollars || 0),
          is_discounted: !!offInv.is_discounted,
          created_at: offInv.created_at || new Date().toISOString()
        };

        const { data: syncedInv, error: syncErr } = await supabase
          .from('inventories')
          .insert([payloadToSync])
          .select()
          .single();

        if (!syncErr && syncedInv) {
          const items = offlineItemsMap[offInv.id] || [];
          if (items.length > 0) {
            const itemsToInsert = items.map((it: any) => ({ inventory_id: syncedInv.id, ...it }));
            await supabase.from('inventory_items').insert(itemsToInsert);
          }
          delete offlineItemsMap[offInv.id];
          inventoriesSynced++;
        } else {
          remainingOffline.push(offInv);
        }
      }

      if (remainingOffline.length === 0) {
        localStorage.removeItem('gedaluma_offline_inventories');
        localStorage.removeItem('gedaluma_offline_inventory_items');
      } else {
        localStorage.setItem('gedaluma_offline_inventories', JSON.stringify(remainingOffline));
        localStorage.setItem('gedaluma_offline_inventory_items', JSON.stringify(offlineItemsMap));
      }
    } catch (e) {
      console.warn('Error al sincronizar inventarios offline:', e);
    }
  }

  // 2. Sincronizar Evaluaciones pendientes
  const savedOfflineEvals = localStorage.getItem('gedaluma_offline_evaluations');
  if (savedOfflineEvals) {
    try {
      const offlineEvals: any[] = JSON.parse(savedOfflineEvals);
      const remainingEvals: any[] = [];

      for (const offEval of offlineEvals) {
        const { error } = await supabase.from('evaluations').insert([offEval]);
        if (!error) {
          evaluationsSynced++;
        } else {
          remainingEvals.push(offEval);
        }
      }

      if (remainingEvals.length === 0) {
        localStorage.removeItem('gedaluma_offline_evaluations');
      } else {
        localStorage.setItem('gedaluma_offline_evaluations', JSON.stringify(remainingEvals));
      }
    } catch (e) {
      console.warn('Error al sincronizar evaluaciones offline:', e);
    }
  }

  // 3. Sincronizar Novedades de la Bitácora pendientes
  const savedOfflineLogbook = localStorage.getItem('gedaluma_offline_logbook');
  if (savedOfflineLogbook) {
    try {
      const offlineLogbook: any[] = JSON.parse(savedOfflineLogbook);
      const remainingLogbook: any[] = [];

      for (const entry of offlineLogbook) {
        const { error } = await supabase.from('logbook_entries').insert([entry]);
        if (!error) {
          logbookSynced++;
        } else {
          remainingLogbook.push(entry);
        }
      }

      if (remainingLogbook.length === 0) {
        localStorage.removeItem('gedaluma_offline_logbook');
      } else {
        localStorage.setItem('gedaluma_offline_logbook', JSON.stringify(remainingLogbook));
      }
    } catch (e) {
      console.warn('Error al sincronizar bitácora offline:', e);
    }
  }

  const totalSynced = inventoriesSynced + evaluationsSynced + logbookSynced;
  return { inventoriesSynced, evaluationsSynced, logbookSynced, totalSynced };
}

export function hasPendingOfflineData(): boolean {
  const invs = localStorage.getItem('gedaluma_offline_inventories');
  const evals = localStorage.getItem('gedaluma_offline_evaluations');
  const logs = localStorage.getItem('gedaluma_offline_logbook');

  try {
    const hasInvs = !!(invs && JSON.parse(invs).length > 0);
    const hasEvals = !!(evals && JSON.parse(evals).length > 0);
    const hasLogs = !!(logs && JSON.parse(logs).length > 0);
    return hasInvs || hasEvals || hasLogs;
  } catch (e) {
    return false;
  }
}
