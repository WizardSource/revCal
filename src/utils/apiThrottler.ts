class ApiThrottler {
  private queue: Array<{
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly minInterval = 1000; // 1 second between requests

  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }

      const { request, resolve, reject } = this.queue.shift()!;
      
      try {
        this.lastRequestTime = Date.now();
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessing = false;
  }
}

export const apiThrottler = new ApiThrottler(); 