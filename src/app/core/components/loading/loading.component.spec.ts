import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { LoadingComponent } from './loading.component';

@Component({
  imports: [LoadingComponent],
  template: `
    <app-loading
      [message]="message()"
      [diameter]="diameter()"
      [role]="role()"
      [ariaLive]="ariaLive()"
    />
  `,
})
class TestHostComponent {
  readonly message = signal<string | null>('Custom Loading Message');
  readonly diameter = signal<number>(56);
  readonly role = signal<string>('alert');
  readonly ariaLive = signal<'polite' | 'assertive' | 'off'>('assertive');
}

describe('LoadingComponent', () => {
  let fixture: ComponentFixture<LoadingComponent>;
  let component: LoadingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the loading component', () => {
    expect(component).toBeTruthy();
  });

  it('should render default message and diameter', () => {
    const messageEl = fixture.nativeElement.querySelector('.loading__message');
    const spinner = fixture.debugElement.query(By.directive(MatProgressSpinner));

    expect(messageEl?.textContent?.trim()).toBe('Loading...');
    expect(spinner.componentInstance.diameter).toBe(44);
  });

  it('should set accessibility attributes correctly with defaults', () => {
    const container = fixture.nativeElement.querySelector('.loading');
    expect(container.getAttribute('role')).toBe('status');
    expect(container.getAttribute('aria-live')).toBe('polite');
  });

  it('should support customized inputs via host component', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const messageEl = hostFixture.nativeElement.querySelector('.loading__message');
    const spinner = hostFixture.debugElement.query(By.directive(MatProgressSpinner));
    const container = hostFixture.nativeElement.querySelector('.loading');

    expect(messageEl?.textContent?.trim()).toBe('Custom Loading Message');
    expect(spinner.componentInstance.diameter).toBe(56);
    expect(container.getAttribute('role')).toBe('alert');
    expect(container.getAttribute('aria-live')).toBe('assertive');
  });

  it('should not render message paragraph if message is null or empty', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.message.set(null);
    hostFixture.detectChanges();

    const messageEl = hostFixture.nativeElement.querySelector('.loading__message');
    expect(messageEl).toBeNull();
  });
});
