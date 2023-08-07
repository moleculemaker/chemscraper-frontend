import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { EnvVars } from "../models/envvars";

@Injectable()
export class EnvironmentService {
  private envConfig: EnvVars;

  constructor(private readonly http: HttpClient) {}

  async loadEnvConfig(configPath: string): Promise<void> {
    console.log('Loading environment config!');
    this.envConfig = await lastValueFrom(this.http.get<EnvVars>(configPath));
  }

  getEnvConfig(): EnvVars {
    return this.envConfig;
  }
}
