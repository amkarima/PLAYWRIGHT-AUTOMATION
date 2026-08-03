export interface GitLabConfig {
  baseUrl: string;
  token: string;
  projectId: string;
  environment?: 'int' | 'ci' | 'prod';
}

export interface GitLabProject {
  id: number;
  name: string;
  web_url: string;
  default_branch: string;
}

export interface GitLabPipeline {
  id: number;
  sha: string;
  ref: string;
  status: 'created' | 'waiting_for_resource' | 'preparing' | 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual' | 'scheduled';
  created_at: string;
  updated_at: string;
  web_url: string;
  user: {
    name: string;
    username: string;
    avatar_url: string;
  };
}

export interface GitLabJob {
  id: number;
  name: string;
  stage: string;
  status: 'created' | 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual';
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  duration: number | null;
  web_url: string;
  artifacts?: {
    file_type: string;
    file_format: string;
    filename: string;
    size: number;
  }[];
}

export interface GitLabBranch {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  web_url: string;
  commit: {
    id: string;
    short_id: string;
    created_at: string;
    title: string;
    message: string;
    author_name: string;
    author_email: string;
  };
}

export interface GitLabPipelineScheduleVariable {
  key: string;
  value: string;
  variable_type?: 'env_var' | 'file';
}

export interface GitLabPipelineSchedule {
  id: number;
  description: string;
  ref: string;
  cron: string;
  cron_timezone: string;
  next_run_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  owner: {
    id: number;
    name: string;
    username: string;
    avatar_url: string;
  } | null;
  last_pipeline?: {
    id: number;
    sha: string;
    ref: string;
    status: string;
  };
  variables?: GitLabPipelineScheduleVariable[];
}

export interface TestResult {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  duration: number;
  timestamp: string;
  branch: string;
  commit: string;
  author: string;
  artifacts?: string[];
  logs?: string;
  jobId?: number;
  pipelineId?: number;
  successCount?: number;
  failureCount?: number;
  environment?: 'ci' | 'sit' | 'prod';
}

export interface PlaywrightTestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  file: string;
  line?: number;
  screenshot?: string;
  attachments?: Array<{
    name?: string;
    contentType?: string;
    body?: string;
  }>;
}

export interface PlaywrightReport {
  stats: {
    expected: number;
    unexpected: number;
    skipped: number;
    flaky: number;
  };
  suites: PlaywrightSuite[];
  duration: number;
}

export interface PlaywrightSuite {
  title: string;
  file: string;
  specs: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

export interface PlaywrightSpec {
  title: string;
  ok: boolean;
  tests: PlaywrightTest[];
}

export interface PlaywrightTest {
  timeout: number;
  expectedStatus: string;
  projectName: string;
  results: PlaywrightTestResult[];
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';

  errors?: Array<{
    message: string;
    location?: {
      file: string;
      line: number;
      column: number;
    };
  }>;
  steps?: Array<{
    title: string;
    duration: number;
    error?: {
      message: string;
    };
  }>;
}

export interface XrayConfig {
  url: string;
  type: 'server';
  apiVersion: '1.0';
  token: string;
}

export interface XrayTest {
  key: string;
  summary: string;
  testType: string;
  status?: string;
}

export interface TestFailureAnalysis {
  id: string;
  pipeline_id: number;
  job_id: number;
  test_key: string;
  test_title: string;
  test_file: string;
  root_cause: string;
  analysis: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  jira_ticket_url?: string;
}