import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';

const AppThemePreset = definePreset(Aura, {
  components: {
    progressspinner: {
      colorScheme: {
        light: {
          root: {
            colorOne: '#8b95a7',
            colorTwo: '#8b95a7',
            colorThree: '#8b95a7',
            colorFour: '#8b95a7',
          },
        },
        dark: {
          root: {
            colorOne: '#8b95a7',
            colorTwo: '#8b95a7',
            colorThree: '#8b95a7',
            colorFour: '#8b95a7',
          },
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    providePrimeNG({ theme: { preset: AppThemePreset } }),
  ]
};
