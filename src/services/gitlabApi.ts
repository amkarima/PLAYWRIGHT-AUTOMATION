import { GitLabConfig, GitLabPipeline, GitLabJob, TestResult, GitLabPipelineSchedule, GitLabPipelineScheduleVariable, GitLabBranch } from '../types';
import { cacheService } from './cacheService';

class GitLabAPI {
  private _config: GitLabConfig = {
    baseUrl: 'https://scm.saas.cagip.group.gca',
    token: 'yrYRXygrVbmiwb2aVJ45',
    projectId: '207292'
  };

  get config() {
    return this._config;
  }

  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<T> {
    if (!this._config) {
      throw new Error('GitLab configuration not set');
    }

    try {
      const url = `${this._config.baseUrl}/api/v4/projects/${this._config.projectId}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${this._config.token}`,
          'Content-Type': 'application/json',
        },
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token d\'accès invalide ou expiré. Vérifiez votre token GitLab.');
        } else if (response.status === 404) {
          throw new Error('Projet GitLab non trouvé. Vérifiez l\'ID du projet.');
        } else if (response.status === 403) {
          throw new Error('Accès refusé. Vérifiez que votre token a les permissions nécessaires (scope "api").');
        }
        const errorText = await response.text();
        throw new Error(`GitLab API error: ${response.status} ${response.statusText}. ${errorText}`);
      }

      if (method === 'DELETE') {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Impossible de se connecter à GitLab. Vérifiez que l\'URL est correcte et accessible.');
      }
      throw error;
    }
  }

  async getPipelines(page = 1, perPage = 20, createdAfter?: string, createdBefore?: string): Promise<GitLabPipeline[]> {
    const cacheKey = `pipelines-${page}-${perPage}-${createdAfter || 'none'}-${createdBefore || 'none'}`;

    const cached = cacheService.get<GitLabPipeline[]>(cacheKey);
    if (cached) {
      console.log('Returning cached pipelines');
      return cached;
    }

    let url = `/pipelines?page=${page}&per_page=${perPage}&order_by=updated_at&sort=desc`;

    if (createdAfter) {
      url += `&updated_after=${encodeURIComponent(createdAfter)}`;
    }
    if (createdBefore) {
      url += `&updated_before=${encodeURIComponent(createdBefore)}`;
    }

    const result = await this.makeRequest<GitLabPipeline[]>(url);
    cacheService.set(cacheKey, result, 2 * 60 * 1000);
    return result;
  }

  async getPipelineJobs(pipelineId: number): Promise<GitLabJob[]> {
    const cacheKey = `pipeline-jobs-${pipelineId}`;

    const cached = cacheService.get<GitLabJob[]>(cacheKey);
    if (cached) {
      console.log(`Returning cached jobs for pipeline ${pipelineId}`);
      return cached;
    }

    const result = await this.makeRequest<GitLabJob[]>(`/pipelines/${pipelineId}/jobs`);
    cacheService.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  async downloadJobArtifacts(jobId: number): Promise<void> {
    if (!this._config) {
      throw new Error('GitLab configuration not set');
    }

    const url = `${this._config.baseUrl}/api/v4/projects/${this._config.projectId}/jobs/${jobId}/artifacts`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this._config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch artifacts: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `artifacts-job-${jobId}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  }

  async getJobArtifactFile(jobId: number, filePath: string): Promise<string> {
    const cacheKey = `artifact-file-${jobId}-${filePath}`;

    const cached = cacheService.get<string>(cacheKey);
    if (cached) {
      console.log(`Returning cached artifact file ${filePath} for job ${jobId}`);
      return cached;
    }

    if (!this._config) {
      throw new Error('GitLab configuration not set');
    }

    const url = `${this._config.baseUrl}/api/v4/projects/${this._config.projectId}/jobs/${jobId}/artifacts/${filePath}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this._config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch artifact file: ${response.status}`);
    }

    const result = await response.text();
    cacheService.set(cacheKey, result, 30 * 60 * 1000);
    return result;
  }

  async getJobArtifactsFolderFiles(jobId: number, folderPath: string): Promise<Array<{ name: string; content: string }>> {
    if (!this._config) {
      throw new Error('GitLab configuration not set');
    }

    const url = `${this._config.baseUrl}/api/v4/projects/${this._config.projectId}/jobs/${jobId}/artifacts`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this._config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch artifacts: ${response.status}`);
    }

    const JSZip = (await import('jszip')).default;
    const blob = await response.blob();
    const zip = await JSZip.loadAsync(blob);

    const files: Array<{ name: string; content: string }> = [];
    const folderPrefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

    for (const [filename, file] of Object.entries(zip.files)) {
      if (!file.dir && filename.startsWith(folderPrefix) && filename.endsWith('.txt')) {
        const content = await file.async('text');
        const name = filename.substring(folderPrefix.length);
        files.push({ name, content });
      }
    }

    return files;
  }

  async triggerPipeline(ref: string, variables: Record<string, string> = {}): Promise<GitLabPipeline> {
    if (!this._config) {
      throw new Error('GitLab configuration not set');
    }

    // Utiliser le ref fourni ou 'master' par défaut
    const pipelineRef =  'develop';

    const body: any = {
      ref: pipelineRef
    };

    if (Object.keys(variables).length > 0) {
      body.variables = Object.entries(variables).map(([key, value]) => ({
        key,
        value
      }));
    }

    const url = `${this._config.baseUrl}/api/v4/projects/${this._config.projectId}/pipeline`;
    
    console.log('Triggering pipeline with:', {
      url,
      ref: pipelineRef,
      variables: Object.keys(variables)
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this._config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pipeline trigger error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to trigger pipeline: ${response.status} ${response.statusText}. ${errorText}`);
    }

    return response.json();
  }

  async getPipelineVariables(pipelineId: number): Promise<{ key: string; value: string }[]> {
    const cacheKey = `pipeline-variables-${pipelineId}`;

    const cached = cacheService.get<{ key: string; value: string }[]>(cacheKey);
    if (cached) {
      console.log(`Returning cached variables for pipeline ${pipelineId}`);
      return cached;
    }

    if (!this._config) {
      throw new Error('GitLab configuration not set');
    }

    const result = await this.makeRequest<{ key: string; value: string }[]>(`/pipelines/${pipelineId}/variables`);
    cacheService.set(cacheKey, result, 10 * 60 * 1000);
    return result;
  }

  async getPipelineSchedules(): Promise<GitLabPipelineSchedule[]> {
    return this.makeRequest('/pipeline_schedules');
  }

  async getPipelineSchedule(scheduleId: number): Promise<GitLabPipelineSchedule> {
    return this.makeRequest(`/pipeline_schedules/${scheduleId}`);
  }

  async createPipelineSchedule(data: {
    description: string;
    ref: string;
    cron: string;
    cron_timezone: string;
    active: boolean;
  }): Promise<GitLabPipelineSchedule> {
    return this.makeRequest('/pipeline_schedules', 'POST', data);
  }

  async updatePipelineSchedule(scheduleId: number, data: {
    description?: string;
    ref?: string;
    cron?: string;
    cron_timezone?: string;
    active?: boolean;
  }): Promise<GitLabPipelineSchedule> {
    return this.makeRequest(`/pipeline_schedules/${scheduleId}`, 'PUT', data);
  }

  async deletePipelineSchedule(scheduleId: number): Promise<void> {
    await this.makeRequest(`/pipeline_schedules/${scheduleId}`, 'DELETE');
  }

  async createPipelineScheduleVariable(scheduleId: number, variable: {
    key: string;
    value: string;
    variable_type?: 'env_var' | 'file';
  }): Promise<GitLabPipelineScheduleVariable> {
    return this.makeRequest(`/pipeline_schedules/${scheduleId}/variables`, 'POST', variable);
  }

  async updatePipelineScheduleVariable(scheduleId: number, key: string, variable: {
    value: string;
    variable_type?: 'env_var' | 'file';
  }): Promise<GitLabPipelineScheduleVariable> {
    return this.makeRequest(`/pipeline_schedules/${scheduleId}/variables/${key}`, 'PUT', variable);
  }

  async deletePipelineScheduleVariable(scheduleId: number, key: string): Promise<void> {
    await this.makeRequest(`/pipeline_schedules/${scheduleId}/variables/${key}`, 'DELETE');
  }

  async getBranches(): Promise<GitLabBranch[]> {
    return this.makeRequest('/repository/branches?per_page=100');
  }

  async getTestResultsForPeriod(daysAgo: number): Promise<TestResult[]> {
    const cacheKey = `test-results-period-${daysAgo}`;
    const cached = cacheService.get<TestResult[]>(cacheKey);
    if (cached) return cached;

    const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const createdAfter = cutoffDate.toISOString();

    // Paginate until we've covered the full period (max 10 pages of 100)
    let allPipelines: GitLabPipeline[] = [];
    for (let page = 1; page <= 10; page++) {
      const batch = await this.makeRequest<GitLabPipeline[]>(
        `/pipelines?page=${page}&per_page=100&order_by=updated_at&sort=desc&updated_after=${encodeURIComponent(createdAfter)}`
      );
      if (batch.length === 0) break;
      allPipelines = allPipelines.concat(batch);
      if (batch.length < 100) break;
    }

    const results = await this._processPipelines(allPipelines);
    cacheService.set(cacheKey, results, 5 * 60 * 1000);
    return results;
  }

  async getTestResults(useCache: boolean = true): Promise<TestResult[]> {
    const cacheKey = 'test-results';

    if (useCache) {
      const cached = cacheService.get<TestResult[]>(cacheKey);
      if (cached) {
        console.log('Returning cached test results');
        return cached;
      }
    }

    try {
      const pipelines = await this.getPipelines(1, 30);
      const filtered = await this._processPipelines(pipelines);
      cacheService.set(cacheKey, filtered, 5 * 60 * 1000);
      return filtered;
    } catch (error) {
      console.error('Error fetching test results:', error);
      throw error;
    }
  }

  private async _processPipelines(pipelines: GitLabPipeline[]): Promise<TestResult[]> {
    const defaultEnv = (import.meta.env.VITE_ENV || import.meta.env.ENV || 'ci').toString().toLowerCase();
    const validEnvs = ['ci', 'sit', 'prod', 'stg'];

    const pipelinePromises = pipelines.map(async (pipeline) => {
      try {
        const [jobs, vars] = await Promise.all([
          this.getPipelineJobs(pipeline.id),
          this.getPipelineVariables(pipeline.id).catch(() => [])
        ]);

        let pipelineEnv = defaultEnv;
        const envVar = vars.find(v => ['ENV', 'ENVIRONMENT'].includes(v.key))?.value;
        if (envVar && typeof envVar === 'string') {
          const resolved = envVar.toLowerCase();
          pipelineEnv = validEnvs.includes(resolved) ? resolved : pipelineEnv;
        }

        const testJobs = jobs.filter(job => job.name === 'merge_reports' && job.status !== 'canceled');

        const jobResults = await Promise.all(testJobs.map(async (job) => {
          const environment: 'ci' | 'sit' | 'prod' | 'stg' = validEnvs.includes(pipelineEnv) ? (pipelineEnv as any) : 'ci';

          let successCount = 0;
          let failureCount = 0;

          try {
            const reportContent = await this.getJobArtifactFile(job.id, 'subscription-essential-e2e/test-results-merged.json');
            const report = JSON.parse(reportContent);

            if (report.stats) {
              successCount = (report.stats.expected || 0) + (report.stats.expectedFlaky || 0) + (report.stats.flaky || 0);
              failureCount = (report.stats.unexpected || 0) + (report.stats.skipped || 0);
            } else if (report.suites) {
              const countFromSuites = (suites: any[]): { passed: number; failed: number } => {
                let passed = 0;
                let failed = 0;
                for (const suite of suites) {
                  if (suite.specs) {
                    for (const spec of suite.specs) {
                      if (spec.tests) {
                        for (const test of spec.tests) {
                          if (!test.results || test.results.length === 0) continue;
                          const lastResult = test.results[test.results.length - 1];
                          const lastStatus = lastResult.status;
                          let isFlaky = false;
                          if (test.results.length > 1 && lastStatus === 'passed') {
                            isFlaky = test.results.slice(0, -1).some(
                              (r: any) => r.status === 'failed' || r.status === 'timedOut'
                            );
                          }
                          if (lastStatus === 'passed' || lastStatus === 'expected' || isFlaky) {
                            passed++;
                          } else if (lastStatus === 'failed' || lastStatus === 'unexpected' || lastStatus === 'timedOut') {
                            failed++;
                          }
                        }
                      }
                    }
                  }
                  if (suite.suites) {
                    const subCounts = countFromSuites(suite.suites);
                    passed += subCounts.passed;
                    failed += subCounts.failed;
                  }
                }
                return { passed, failed };
              };
              const counts = countFromSuites(report.suites);
              successCount = counts.passed;
              failureCount = counts.failed;
            }
          } catch (err) {
            console.warn('Could not load test counts for job', job.id, err);
          }

          return {
            id: `${pipeline.id}-${job.id}`,
            name: `Exécution du ${new Date(job.created_at).toLocaleDateString('fr-FR')} à ${new Date(job.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            status: this.mapJobStatus(job.status),
            duration: job.duration || 0,
            timestamp: job.created_at,
            branch: pipeline.ref,
            commit: pipeline.sha.substring(0, 8),
            author: pipeline.user?.name || 'Unknown',
            artifacts: job.artifacts ? job.artifacts.map((a: any) => a.filename) : [],
            jobId: job.id,

            pipelineId: pipeline.id,
            successCount,
            failureCount,
            environment,
          };
        }));

        return jobResults;
      } catch (err) {
        console.warn('Error processing pipeline', pipeline.id, err);
        return [];
      }
    });

    const allPipelineResults = await Promise.all(pipelinePromises);
    const flatResults = allPipelineResults.flat();

    return flatResults.filter(result => {
      const totalTests = (result.successCount || 0) + (result.failureCount || 0);
      const isActive = result.status === 'running' || result.status === 'pending';
      return totalTests > 0 || isActive;
    });
  }

  invalidateCache(): void {
    cacheService.invalidate('test-results');
    cacheService.invalidatePattern('pipelines-');
    cacheService.invalidatePattern('pipeline-jobs-');
    cacheService.invalidatePattern('pipeline-variables-');
    cacheService.invalidatePattern('artifact-file-');
  }

  getCacheAge(): number | null {
    return cacheService.getAge('test-results');
  }

  getCacheRemainingTTL(): number | null {
    return cacheService.getRemainingTTL('test-results');
  }

  getCacheStats(): { memory: number; storage: number } {
    return cacheService.getCacheSize();
  }

  private mapJobStatus(status: string): TestResult['status'] {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'failed';
      case 'running':
        return 'running';
      case 'pending':
      case 'created':
      case 'manual':
        return 'pending';
      default:
        return 'failed';
    }
  }
}

export const gitlabApi = new GitLabAPI();