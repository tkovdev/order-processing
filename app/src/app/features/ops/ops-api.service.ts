import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ContainerStatus {
  name: string;
  status: string;
  startedAt: string;
  health: string;
}

export interface ContainerStatusResponse {
  services: ContainerStatus[];
  updatedAt: string;
}

export interface KafkaEvent {
  correlationId: string | undefined;
  topic: string;
  type: string;
  service: string;
  timestamp: string;
}

export interface KafkaEventsResponse {
  messages: KafkaEvent[];
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OpsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  fetchContainerStatuses() {
    return this.http.get<ContainerStatusResponse>(`${this.apiBaseUrl}/ops/containers`);
  }

  fetchRecentKafkaEvents(limit = 50) {
    return this.http.get<KafkaEventsResponse>(`${this.apiBaseUrl}/ops/kafka/recent-events`, {
      params: { limit: limit.toString() },
    });
  }
}
