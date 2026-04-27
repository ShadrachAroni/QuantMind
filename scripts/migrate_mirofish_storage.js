const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateTable(tableName, dataColumn, storagePrefix) {
  console.log(`Starting migration for ${tableName}...`);

  // 1. Fetch all records that have data but no storage_path
  const { data: records, error } = await supabase
    .from(tableName)
    .select(`id, user_id, ${dataColumn}, storage_path`)
    .not(dataColumn, 'is', null)
    .is('storage_path', null);

  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return;
  }

  console.log(`Found ${records.length} records in ${tableName} to migrate.`);

  for (const record of records) {
    const { id, user_id } = record;
    const data = record[dataColumn];
    const storagePath = `${user_id}/${id}_${storagePrefix}.json`;

    console.log(`Migrating ${tableName} ${id}...`);

    try {
      // 2. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('mirofish-snapshots')
        .upload(storagePath, JSON.stringify(data), {
          contentType: 'application/json',
          upsert: true
        });

      if (uploadError) {
        console.error(`Failed to upload ${id} to storage:`, uploadError);
        continue;
      }

      // 3. Update DB
      const updateData = { storage_path: storagePath };
      // Optional: clear the data column if it's large
      updateData[dataColumn] = null;

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error(`Failed to update DB for ${id}:`, updateError);
      } else {
        console.log(`Successfully migrated ${id}`);
      }
    } catch (e) {
      console.error(`Unexpected error migrating ${id}:`, e);
    }
  }
}

async function runMigration() {
  // Migrate simulation_snapshots (MiroFish Saved Scenarios)
  await migrateTable('simulation_snapshots', 'interactions_log', 'snapshot');
  
  // Migrate simulation_runs (MiroFish Live Executions)
  // Note: We check which columns exist. If 'result' was used in the past, we try it.
  await migrateTable('simulation_runs', 'interaction_graph', 'mirofish_graph');
  await migrateTable('simulation_runs', 'trajectory_data', 'mirofish_traj');
  
  console.log('All migrations complete.');
}

runMigration();
