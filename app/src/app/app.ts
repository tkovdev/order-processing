import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from "./shared/navigation/navigation";
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, NgClass],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Order Processing');
  sidebarOpen = false;

  onSidebarStateChange(state: boolean) {
    this.sidebarOpen = state;
  }
}
