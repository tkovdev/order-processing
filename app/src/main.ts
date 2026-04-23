import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

interface AppConfig {
  environment: string
  apiBaseUrl: string
}

if (environment.hosted) {
  await fetch('.info')
  .then((res) => res.json())
  .then((config: AppConfig) => {
    environment.environment = config.environment
    environment.apiBaseUrl = config.apiBaseUrl
    bootstrapApplication(App, appConfig)
      .catch((err) => console.error(err));
  });
} else {
  bootstrapApplication(App, appConfig)
    .catch((err) => console.error(err));
}