import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  public count = signal(0);

  public increment() {
    this.count.update((value) => value + 1);
  }
}
