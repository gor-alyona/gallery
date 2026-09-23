import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { MatIcon } from '@angular/material/icon';
import { ExploreButtonComponent } from './explore-button.component';

@Component({
  imports: [ExploreButtonComponent],
  template: `
    <app-explore-button
      [route]="route()"
      [label]="label()"
      [icon]="icon()"
    />
  `,
})
class TestHostComponent {
  readonly route = signal<string>('/favorites');
  readonly label = signal<string>('Go to Favorites');
  readonly icon = signal<string | null>('favorite');
}

describe('ExploreButtonComponent', () => {
  let fixture: ComponentFixture<ExploreButtonComponent>;
  let component: ExploreButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreButtonComponent, TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ExploreButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the explore button component', () => {
    expect(component).toBeTruthy();
  });

  it('should render default route, label, and icon', () => {
    const linkEl = fixture.nativeElement.querySelector('a.explore-btn');
    const iconDebugEl = fixture.debugElement.query(By.directive(MatIcon));

    expect(linkEl).not.toBeNull();
    expect(linkEl?.getAttribute('href')).toBe('/');
    expect(linkEl?.textContent).toContain('Explore Photos');
    expect(iconDebugEl).not.toBeNull();
    expect(iconDebugEl.nativeElement.textContent.trim()).toBe('photo_library');
  });

  it('should support customized inputs via test host', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const linkEl = hostFixture.nativeElement.querySelector('a.explore-btn');
    const iconDebugEl = hostFixture.debugElement.query(By.directive(MatIcon));

    expect(linkEl?.getAttribute('href')).toBe('/favorites');
    expect(linkEl?.textContent).toContain('Go to Favorites');
    expect(iconDebugEl?.nativeElement?.textContent?.trim()).toBe('favorite');
  });

  it('should not render icon when icon input is null', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.icon.set(null);
    hostFixture.detectChanges();

    const linkEl = hostFixture.nativeElement.querySelector('a.explore-btn');
    const iconDebugEl = hostFixture.debugElement.query(By.directive(MatIcon));

    expect(iconDebugEl).toBeNull();
    expect(linkEl?.textContent).toContain('Go to Favorites');
  });
});
