import { SimulationParams, SimulationResult } from '@quantmind/shared-types';

interface WorkerNode {
  id: string;
  url: string;
  status: 'IDLE' | 'BUSY' | 'OFFLINE';
  activeJobs: number;
  maxJobs: number;
  weight: number;
}

export class SimulationLoadBalancer {
  private workers: WorkerNode[] = [
    { id: 'sim-worker-1', url: 'https://sim-worker-1.internal', status: 'IDLE', activeJobs: 0, maxJobs: 10, weight: 1 },
    { id: 'sim-worker-2', url: 'https://sim-worker-2.internal', status: 'IDLE', activeJobs: 0, maxJobs: 10, weight: 1 },
    { id: 'sim-worker-3', url: 'https://sim-worker-3.internal', status: 'BUSY', activeJobs: 8, maxJobs: 10, weight: 1.5 },
  ];

  /**
   * Distributes simulation jobs using the Weighted Least Connections algorithm.
   */
  public selectWorker(): WorkerNode | null {
    const availableWorkers = this.workers.filter(w => w.status !== 'OFFLINE' && w.activeJobs < w.maxJobs);
    
    if (availableWorkers.length === 0) return null;

    // Weighted Least Connections: Sort by (activeJobs / weight)
    return availableWorkers.sort((a, b) => (a.activeJobs / a.weight) - (b.activeJobs / b.weight))[0];
  }

  /**
   * Dispatches a simulation job to the selected worker.
   */
  public async dispatchSimulation(params: SimulationParams): Promise<SimulationResult> {
    const worker = this.selectWorker();
    
    if (!worker) {
      throw new Error('SYSTEM_OVERLOAD: No available simulation nodes. Scaling operation triggered.');
    }

    try {
      worker.activeJobs++;
      if (worker.activeJobs >= worker.maxJobs) worker.status = 'BUSY';

      console.log(`[LB] Dispatching job to ${worker.id} (${worker.url})`);
      
      // Simulate network request to microservice
      const result = await this.mockInvokeWorker(worker, params);
      
      return result;
    } finally {
      worker.activeJobs--;
      worker.status = 'IDLE';
    }
  }

  private async mockInvokeWorker(worker: WorkerNode, params: SimulationParams): Promise<SimulationResult> {
    // In a real microservices arch, this would be an internal fetch() or gRPC call
    return new Promise((resolve) => setTimeout(() => {
      resolve({
        id: Math.random().toString(36).substr(2, 9),
        status: 'completed',
        data: { paths: params.num_paths || 1000, value_at_risk: 0.15 },
        created_at: new Date().toISOString()
      } as any);

    }, 2000));
  }
}

export const simLoadBalancer = new SimulationLoadBalancer();
