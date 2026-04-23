import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from "@angular/router";
import { environment } from '../../../environments/environment';
import { ChipModule } from 'primeng/chip';


@Component({
  selector: 'app-navigation',
  imports: [NgClass, RouterLink, ChipModule],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation implements OnInit {
  sidebarOpen = false;
  isDesktop = false;
  environment = environment;
  @Output() sidebarStateChange = new EventEmitter<boolean>();

  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  checkScreenSize() {
    this.isDesktop = window.innerWidth >= 768;
    this.sidebarOpen = this.isDesktop;
    this.sidebarStateChange.emit(this.sidebarOpen);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarStateChange.emit(this.sidebarOpen);
  }

  closeSidebar() {
    this.sidebarOpen = false;
    this.sidebarStateChange.emit(this.sidebarOpen);
  }
}
