import { supabase } from './supabase';

export interface SyncResult {
  inventoriesSynced: number;
  evaluationsSynced: number;
  logbookSynced: number;
  penaltiesSynced: number;
  totalSynced: number;
}

/**
 * Purga de memoria local: Elimina claves vacías '[]', 'null' u objetos corrompidos en localStorage
 */
export function cleanOfflineStorage(): void {
  const arrayKeys = [
    'gedaluma_offline_inventories', 
    'gedaluma_offline_evaluations', 
    'gedaluma_offline_logbook',
    'gedaluma_offline_penalties'
  ];

  arrayKeys.forEach(key => {
    const val = localStorage.getItem(key);
    if (!val) return;
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(key);
        return;
      }
      // Filtrar elementos válidos (objetos no nulos y con al menos 1 propiedad)
      const validItems = parsed.filter(item => item && typeof item === 'object' && Object.keys(item).length > 0);
      if (validItems.length === 0) {
        localStorage.removeItem(key);
      } else if (validItems.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(validItems));
      }
    } catch (e) {
      localStorage.removeItem(key);
    }
  });

  const itemsMap = localStorage.getItem('gedaluma_offline_inventory_items');
  if (itemsMap) {
    try {
      const parsed = JSON.parse(itemsMap);
      if (typeof parsed !== 'object' || !parsed || Object.keys(parsed).length === 0) {
        localStorage.removeItem('gedaluma_offline_inventory_items');
      }
    } catch (e) {
      localStorage.removeItem('gedaluma_offline_inventory_items');
    }
  }
}

export function hasPendingOfflineData(): boolean {
  cleanOfflineStorage();

  const invs = localStorage.getItem('gedaluma_offline_inventories');
  const evals = localStorage.getItem('gedaluma_offline_evaluations');
  const logs = localStorage.getItem('gedaluma_offline_logbook');
  const pens = localStorage.getItem('gedaluma_offline_penalties');

  try {
    const hasInvs = !!(invs && JSON.parse(invs).filter((i: any) => i && Object.keys(i).length > 0).length > 0);
    const hasEvals = !!(evals && JSON.parse(evals).filter((e: any) => e && Object.keys(e).length > 0).length > 0);
    const hasLogs = !!(logs && JSON.parse(logs).filter((l: any) => l && Object.keys(l).length > 0).length > 0);
    const hasPens = !!(pens && JSON.parse(pens).filter((p: any) => p && Object.keys(p).length > 0).length > 0);
    return hasInvs || hasEvals || hasLogs || hasPens;
  } catch (e) {
    return false;
  }
}

export async function syncOfflineDataToSupabase(): Promise<SyncResult> {
  let inventoriesSynced = 0;
  let evaluationsSynced = 0;
  let logbookSynced = 0;
  let penaltiesSynced = 0;

  // 1. Sanitizar almacenamiento local previo
  cleanOfflineStorage();

  // 2. SINCRONIZAR INVENTARIOS PENDIENTES
  const savedOfflineInventories = localStorage.getItem('gedaluma_offline_inventories');
  if (savedOfflineInventories) {
    try {
      const offlineArr: any[] = JSON.parse(savedOfflineInventories).filter(Boolean);
      const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
      const remainingOffline: any[] = [];

      for (const offInv of offlineArr) {
        if (!offInv || !offInv.isla_id) {
          continue;
        }

        const payloadToSync: any = {
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

        // Comprobar si ya existe en Supabase por ID o coincidencia de datos principales
        const { data: existingInv } = await supabase.from('inventories')
          .select('id')
          .or(`id.eq.${payloadToSync.id},and(isla_id.eq.${payloadToSync.isla_id},date.eq.${payloadToSync.date},evaluator_name.eq.${payloadToSync.evaluator_name})`)
          .limit(1);

        if (existingInv && existingInv.length > 0) {
          delete offlineItemsMap[offInv.id];
          inventoriesSynced++;
          continue;
        }

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
        } else if (syncErr && (syncErr.code === '23505' || syncErr.message?.includes('duplicate key'))) {
          delete offlineItemsMap[offInv.id];
          inventoriesSynced++;
        } else {
          console.warn('[Sync Inventarios Error]', syncErr);
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
      console.warn('Error en sync inventarios offline:', e);
    }
  }

  // 3. SINCRONIZAR EVALUACIONES PENDIENTES
  const savedOfflineEvals = localStorage.getItem('gedaluma_offline_evaluations');
  if (savedOfflineEvals) {
    try {
      const offlineEvals: any[] = JSON.parse(savedOfflineEvals).filter(Boolean);
      const remainingEvals: any[] = [];

      for (const offEval of offlineEvals) {
        if (!offEval || !offEval.isla_id) {
          continue;
        }

        const isUuid = typeof offEval.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(offEval.id);
        
        const evalPayload: any = {
          isla_id: String(offEval.isla_id || ''),
          isla_name: offEval.isla_name || 'Desconocida',
          evaluator_name: offEval.evaluator_name || 'Auditor',
          evaluator_role: offEval.evaluator_role || 'evaluator',
          evaluated_employee: offEval.evaluated_employee || null,
          total_score: Number(offEval.total_score || 0),
          status: offEval.status || 'Completado',
          date: offEval.date || new Date().toISOString().split('T')[0],
          created_at: offEval.created_at || new Date().toISOString()
        };

        if (isUuid) {
          evalPayload.id = offEval.id;
        }
        if (offEval.auditor_type) evalPayload.auditor_type = offEval.auditor_type;
        if (offEval.time_slot) evalPayload.time_slot = offEval.time_slot;
        if (offEval.start_time) evalPayload.start_time = offEval.start_time;
        if (offEval.end_time) evalPayload.end_time = offEval.end_time;

        // Comprobar si ya existe una evaluación equivalente en Supabase
        const { data: existingEval } = await supabase.from('evaluations')
          .select('id')
          .eq('isla_id', evalPayload.isla_id)
          .eq('date', evalPayload.date)
          .eq('evaluator_name', evalPayload.evaluator_name)
          .eq('total_score', evalPayload.total_score)
          .limit(1);

        if (existingEval && existingEval.length > 0) {
          evaluationsSynced++;
          continue;
        }

        const { data: syncedEval, error: evalErr } = await supabase
          .from('evaluations')
          .insert([evalPayload])
          .select()
          .single();

        if (!evalErr && syncedEval) {
          if (Array.isArray(offEval.responses) && offEval.responses.length > 0) {
            const respToInsert = offEval.responses.map((r: any) => ({
              ...r,
              evaluation_id: syncedEval.id
            }));
            await supabase.from('responses').insert(respToInsert);
          }
          evaluationsSynced++;
        } else if (evalErr && (evalErr.code === '23505' || evalErr.message?.includes('duplicate key'))) {
          evaluationsSynced++;
        } else {
          console.warn('[Sync Evaluaciones Error]', evalErr);
          remainingEvals.push(offEval);
        }
      }

      if (remainingEvals.length === 0) {
        localStorage.removeItem('gedaluma_offline_evaluations');
      } else {
        localStorage.setItem('gedaluma_offline_evaluations', JSON.stringify(remainingEvals));
      }
    } catch (e) {
      console.warn('Error en sync evaluaciones offline:', e);
    }
  }

  // 4. SINCRONIZAR BITÁCORA PENDIENTE
  const savedOfflineLogbook = localStorage.getItem('gedaluma_offline_logbook');
  if (savedOfflineLogbook) {
    try {
      const offlineLogbook: any[] = JSON.parse(savedOfflineLogbook).filter(Boolean);
      const remainingLogbook: any[] = [];

      for (const entry of offlineLogbook) {
        if (!entry || !entry.isla_id || !entry.description) {
          continue;
        }

        const { data: existingLog } = await supabase.from('logbook_entries')
          .select('id')
          .eq('isla_id', String(entry.isla_id))
          .eq('date', entry.date)
          .eq('description', entry.description)
          .limit(1);

        if (existingLog && existingLog.length > 0) {
          logbookSynced++;
          continue;
        }

        const { error: logErr } = await supabase.from('logbook_entries').insert([entry]);

        if (!logErr || logErr.code === '23505' || logErr.message?.includes('duplicate key')) {
          logbookSynced++;
        } else {
          const { id, ...entryNoId } = entry;
          const { error: retryErr } = await supabase.from('logbook_entries').insert([entryNoId]);
          if (!retryErr || retryErr.code === '23505') {
            logbookSynced++;
          } else {
            console.warn('[Sync Bitácora Error]', logErr);
            remainingLogbook.push(entry);
          }
        }
      }

      if (remainingLogbook.length === 0) {
        localStorage.removeItem('gedaluma_offline_logbook');
      } else {
        localStorage.setItem('gedaluma_offline_logbook', JSON.stringify(remainingLogbook));
      }
    } catch (e) {
      console.warn('Error en sync bitácora offline:', e);
    }
  }

  // 5. SINCRONIZAR FALTAS / PENALIZACIONES PENDIENTES
  const savedOfflinePenalties = localStorage.getItem('gedaluma_offline_penalties');
  if (savedOfflinePenalties) {
    try {
      const offlinePenalties: any[] = JSON.parse(savedOfflinePenalties).filter(Boolean);
      const remainingPenalties: any[] = [];

      for (const pen of offlinePenalties) {
        if (!pen || !pen.employee_id) continue;

        const isUuid = typeof pen.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pen.id);
        const penPayload: any = {
          employee_id: pen.employee_id,
          severity: pen.severity || 'Leve',
          reason: pen.reason || 'Sanción',
          amount: Number(pen.amount || 0),
          observation: pen.observation || '',
          reported_by: pen.reported_by || 'Supervisor',
          created_at: pen.created_at || new Date().toISOString()
        };
        if (isUuid) penPayload.id = pen.id;

        const { error: penErr } = await supabase.from('penalties').insert([penPayload]);

        if (!penErr || penErr.code === '23505' || penErr.message?.includes('duplicate key')) {
          penaltiesSynced++;
        } else {
          console.warn('[Sync Penalties Error]', penErr);
          remainingPenalties.push(pen);
        }
      }

      if (remainingPenalties.length === 0) {
        localStorage.removeItem('gedaluma_offline_penalties');
      } else {
        localStorage.setItem('gedaluma_offline_penalties', JSON.stringify(remainingPenalties));
      }
    } catch (e) {
      console.warn('Error en sync penalizaciones offline:', e);
    }
  }

  // Sanitizar memoria local final
  cleanOfflineStorage();

  const totalSynced = inventoriesSynced + evaluationsSynced + logbookSynced + penaltiesSynced;
  return { inventoriesSynced, evaluationsSynced, logbookSynced, penaltiesSynced, totalSynced };
}
