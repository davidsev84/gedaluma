import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve('.env'), 'utf-8');
const envVars = Object.fromEntries(envContent.split('\n').filter(line => line.includes('=')).map(line => {
  const [key, ...val] = line.split('=');
  return [key.trim(), val.join('=').trim().replace(/['"]/g, '')];
}));

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_KEY = envVars.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const updates = [
  { old: 'Gabriel', new: 'Gabriel Perero' },
  { old: 'Shirley', new: 'Shirley Reyes' },
  { old: 'Yamile', new: 'Yamilet Delgado' },
  { old: 'Virginia', new: 'Virginia Miño' },
  { old: 'Johana', new: 'Johanna Mendoza' },
  { old: 'Daysy', new: 'Dayse Rodriguez' },
  { old: 'Teresa', new: 'Teresa Vargas' },
  { old: 'Carmen', new: 'Carmen Larenas' },
  { old: 'Liliana', new: 'Liliana Estrada' },
  { old: 'Andrea', new: 'Andrea Meza Saltos' },
  { old: 'Maritza', new: 'Maritza Cedeño' },
  { old: 'Jackie', new: 'Jackie Rodriguez' }
];

async function run() {
  for (const { old, new: newName } of updates) {
    const { data, error } = await supabase.from('employees').update({ name: newName }).eq('name', old);
    if (error) {
      console.error(`Error updating ${old}:`, error);
    } else {
      console.log(`Updated ${old} to ${newName}`);
    }
  }

  // Handle Susana / Jackeline Mera Collazo
  // For Susana, let's see if she has penalties. If so, leave her, else we could delete or update.
  // Actually let's just insert Jackeline if she doesn't exist, and we can just leave Susana.
  
  const { data: jackieSearch } = await supabase.from('employees').select('id').eq('name', 'Jackeline Mera Collazo');
  if (!jackieSearch || jackieSearch.length === 0) {
    console.log("Inserting Jackeline Mera Collazo");
    await supabase.from('employees').insert({ name: 'Jackeline Mera Collazo' });
  }

  // Check Susana
  const { data: susanaData } = await supabase.from('employees').select('*, penalties(id)').eq('name', 'Susana');
  if (susanaData && susanaData.length > 0) {
    if (susanaData[0].penalties && susanaData[0].penalties.length > 0) {
      console.log("Susana has penalties, not deleting.");
    } else {
      console.log("Deleting Susana as she has no penalties and is not in the new list.");
      await supabase.from('employees').delete().eq('name', 'Susana');
    }
  }

  console.log("Finished updating employees in Supabase.");
}

run();
