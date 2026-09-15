import { supabase } from './supabase';

export interface SyncResult {
  inventoriesSynced: number;
  evaluationsSynced: number;
  logbookSynced: number;
  penaltiesSynced: number;
  totalSynced: number;
}

/**
 * Sanitización de memoria local: Elimina claves vacías '[]' o nulas en localStorage
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

  // Sanitizar llaves vacías
  cleanOfflineStorage();

  // 1. SINCRONIZACIÓN DE INVENTARIOS PENDIENTES
  const savedOfflineInventories = localStorage.getItem('gedaluma_offline_inventories');
  if (savedOfflineInventories) {
    try {
      const offlineArr: any[] = JSON.parse(savedOfflineInventories).filter(Boolean);
      const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
      const remainingOffline: any[] = [];

      for (const offInv of offlineArr) {
        if (!offInv || (!offInv.isla_id && !offInv.isla_name)) {
          continue;
        }

        let isAlreadyInDb = false;
        if (offInv.id) {
          const { data: byId } = await supabase.from('inventories')
            .select('id')
            .eq('id', String(offInv.id))
            .maybeSingle();
          if (byId) isAlreadyInDb = true;
        }

        if (!isAlreadyInDb && offInv.isla_id && offInv.date && offInv.evaluator_name) {
          const { data: byDetails } = await supabase.from('inventories')
            .select('id')
            .eq('isla_id', String(offInv.isla_id))
            .eq('date', String(offInv.date))
            .eq('evaluator_name', String(offInv.evaluator_name))
            .limit(1);
          if (byDetails && byDetails.length > 0) isAlreadyInDb = true;
        }

        if (isAlreadyInDb) {
          delete offlineItemsMap[offInv.id];
          inventoriesSynced++;
          continue;
        }

        const payloadToSync: any = {
          isla_id: String(offInv.isla_id || ''),
          isla_name: String(offInv.isla_name || 'Desconocida'),
          evaluator_name: String(offInv.evaluator_name || 'Auditor'),
          date: String(offInv.date || new Date().toISOString().split('T')[0]),
          start_time: String(offInv.start_time || '00:00'),
          end_time: String(offInv.end_time || '00:00'),
          total_missing: Number(offInv.total_missing || 0),
          total_missing_dollars: Number(offInv.total_missing_dollars || 0),
          total_match: Number(offInv.total_match || 0),
          total_surplus: Number(offInv.total_surplus || 0),
          total_surplus_dollars: Number(offInv.total_surplus_dollars || 0),
          is_discounted: !!offInv.is_discounted,
          created_at: String(offInv.created_at || new Date().toISOString())
        };

        if (offInv.id) {
          payloadToSync.id = String(offInv.id);
        }

        let syncedInvRecord: any = null;
        let insertErr: any = null;

        const { data: invData, error: err1 } = await supabase
          .from('inventories')
          .insert([payloadToSync])
          .select()
          .single();

        if (!err1 && invData) {
          syncedInvRecord = invData;
        } else {
          const { id, ...payloadNoId } = payloadToSync;
          const { data: retryData, error: err2 } = await supabase
            .from('inventories')
            .insert([payloadNoId])
            .select()
            .single();

          if (!err2 && retryData) {
            syncedInvRecord = retryData;
          } else {
            insertErr = err2 || err1;
          }
        }

        if (syncedInvRecord) {
          const items = offlineItemsMap[offInv.id] || offInv.items || [];
          if (Array.isArray(items) && items.length > 0) {
            const itemsToInsert = items.map((it: any) => ({
              inventory_id: syncedInvRecord.id,
              product_id: String(it.product_id || it.id || ''),
              category: String(it.category || 'GENERAL'),
              name: String(it.name || 'Producto'),
              unit: String(it.unit || 'UN'),
              cost: Number(it.cost || 0),
              system_qty: Number(it.system_qty || 0),
              physical_qty: Number(it.physical_qty || 0),
              diff_qty: Number(it.diff_qty || (Number(it.physical_qty || 0) - Number(it.system_qty || 0))),
              total_cost_impact: Number(it.total_cost_impact || 0),
              observation: String(it.observation || '')
            }));

            try {
              await supabase.from('inventory_items').insert(itemsToInsert);
            } catch (e) {
              console.warn('[Sync Inventory Items Error]', e);
            }
          }
          delete offlineItemsMap[offInv.id];
          inventoriesSynced++;
        } else if (insertErr && (insertErr.code === '23505' || insertErr.message?.includes('duplicate key'))) {
          delete offlineItemsMap[offInv.id];
          inventoriesSynced++;
        } else {
          console.error('[Sync Inventario Falló]', offInv, insertErr);
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

  // 2. SINCRONIZACIÓN DE EVALUACIONES PENDIENTES (COLUMNAS STRICTAMENTE VÁLIDAS EN SUPABASE)
  const savedOfflineEvals = localStorage.getItem('gedaluma_offline_evaluations');
  if (savedOfflineEvals) {
    try {
      const offlineEvals: any[] = JSON.parse(savedOfflineEvals).filter(Boolean);
      const remainingEvals: any[] = [];

      for (const offEval of offlineEvals) {
        if (!offEval || (!offEval.isla_id && !offEval.isla_name)) {
          continue;
        }

        const isUuid = typeof offEval.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(offEval.id);
        
        let isEvalInDb = false;
        if (isUuid) {
          const { data: byId } = await supabase.from('evaluations')
            .select('id')
            .eq('id', offEval.id)
            .maybeSingle();
          if (byId) isEvalInDb = true;
        }

        if (!isEvalInDb && offEval.isla_id && offEval.evaluator_name) {
          const { data: byDetails } = await supabase.from('evaluations')
            .select('id')
            .eq('isla_id', String(offEval.isla_id))
            .eq('evaluator_name', String(offEval.evaluator_name))
            .eq('total_score', Number(offEval.total_score || 0))
            .limit(1);
          if (byDetails && byDetails.length > 0) isEvalInDb = true;
        }

        if (isEvalInDb) {
          evaluationsSynced++;
          continue;
        }

        // NOTA DE ESQUEMA DB: 'evaluations' SOLO posee las siguientes columnas exactas:
        // id, isla_id, isla_name, evaluator_name, evaluator_role, auditor_type, time_slot, total_score, status, created_at, is_valid, evaluated_employee
        // NO POSEE: 'date', 'start_time', 'end_time'
        const evalPayload: any = {
          isla_id: String(offEval.isla_id || ''),
          isla_name: String(offEval.isla_name || 'Desconocida'),
          evaluator_name: String(offEval.evaluator_name || 'Auditor'),
          evaluator_role: String(offEval.evaluator_role || 'evaluator'),
          evaluated_employee: offEval.evaluated_employee ? String(offEval.evaluated_employee) : null,
          total_score: Number(offEval.total_score || 0),
          status: String(offEval.status || 'Completado'),
          created_at: String(offEval.created_at || (offEval.date ? new Date(offEval.date).toISOString() : new Date().toISOString()))
        };

        if (isUuid) {
          evalPayload.id = offEval.id;
        }
        if (offEval.auditor_type) evalPayload.auditor_type = String(offEval.auditor_type);
        if (offEval.time_slot) evalPayload.time_slot = String(offEval.time_slot);

        let syncedEvalRecord: any = null;
        let evalErr: any = null;

        const { data: eData, error: eErr1 } = await supabase
          .from('evaluations')
          .insert([evalPayload])
          .select()
          .single();

        if (!eErr1 && eData) {
          syncedEvalRecord = eData;
        } else {
          const { id, ...evalPayloadNoId } = evalPayload;
          const { data: retryEData, error: eErr2 } = await supabase
            .from('evaluations')
            .insert([evalPayloadNoId])
            .select()
            .single();

          if (!eErr2 && retryEData) {
            syncedEvalRecord = retryEData;
          } else {
            evalErr = eErr2 || eErr1;
          }
        }

        if (syncedEvalRecord) {
          if (Array.isArray(offEval.responses) && offEval.responses.length > 0) {
            const respToInsert = offEval.responses.map((r: any) => ({
              evaluation_id: syncedEvalRecord.id,
              question_id: String(r.question_id || ''),
              question_text: String(r.question_text || ''),
              value: String(r.value || ''),
              observation: r.observation ? String(r.observation) : null,
              photo_data: r.photo_data ? String(r.photo_data) : null
            }));
            try {
              await supabase.from('responses').insert(respToInsert);
            } catch (e) {
              console.warn('[Sync Responses Error]', e);
            }
          }
          evaluationsSynced++;
        } else if (evalErr && (evalErr.code === '23505' || evalErr.message?.includes('duplicate key'))) {
          evaluationsSynced++;
        } else {
          console.error('[Sync Evaluación Falló]', offEval, evalErr);
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

  // 3. SINCRONIZACIÓN DE BITÁCORA PENDIENTE
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
          .eq('date', String(entry.date))
          .eq('description', String(entry.description))
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
            console.error('[Sync Bitácora Falló]', logErr);
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

  // 4. SINCRONIZACIÓN DE FALTAS / PENALIZACIONES PENDIENTES
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
          console.error('[Sync Penalties Falló]', penErr);
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

  // Sanitizar almacenamiento local final
  cleanOfflineStorage();

  const totalSynced = inventoriesSynced + evaluationsSynced + logbookSynced + penaltiesSynced;
  return { inventoriesSynced, evaluationsSynced, logbookSynced, penaltiesSynced, totalSynced };
}
