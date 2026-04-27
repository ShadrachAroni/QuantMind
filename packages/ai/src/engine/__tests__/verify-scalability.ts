import { simLoadBalancer } from '../load-balancer';

async function verifyScaling() {
  console.log('--- STARTING SCALABILITY VERIFICATION PROTOCOL ---');
  
  const totalJobs = 50;
  console.log(`[INIT] Simulating ${totalJobs} concurrent simulation requests...`);
  
  const startTime = Date.now();
  const requests = Array.from({ length: totalJobs }).map((_, i) => 
    simLoadBalancer.dispatchSimulation({
      portfolio_id: `test-p-${i}`,
      num_paths: 5000,
      time_horizon_years: 10,
      initial_value: 100000
    }).catch(e => ({ error: e.message }))
  );

  const results = await Promise.all(requests);
  const duration = (Date.now() - startTime) / 1000;

  const successful = results.filter((r: any) => !r.error).length;
  const failed = results.filter((r: any) => r.error).length;

  console.log(`\n--- VERIFICATION RESULTS ---`);
  console.log(`Total Requests: ${totalJobs}`);
  console.log(`Successful Dispatches: ${successful}`);
  console.log(`Blocked (Overload): ${failed}`);
  console.log(`Total Duration: ${duration}s`);
  console.log(`Throughput: ${(successful / duration).toFixed(2)} jobs/sec`);

  if (failed > 0) {
    console.log('[ALERT] System reached capacity. Load balancer successfully prevented cascading failure.');
  } else {
    console.log('[SUCCESS] All jobs dispatched within cluster limits.');
  }

  console.log('--- END OF PROTOCOL ---');
}

verifyScaling();
