import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ErrorSecondaryAction, ErrorStateComponent } from './error-state.component';

@Component({
  imports: [ErrorStateComponent],
  template: `
    <app-error-state
      [title]="title()"
      [message]="message()"
      [icon]="icon()"
      [retryLabel]="retryLabel()"
      [showRetry]="showRetry()"
      [secondaryAction]="secondaryAction()"
      (retry)="onRetry()"
    />
  `,
})
class TestHostComponent {
  readonly title = signal<string>('Custom Error Title');
  readonly message = signal<string>('Custom error message description.');
  readonly icon = signal<string>('warning');
  readonly retryLabel = signal<string>('Try Again');
  readonly showRetry = signal<boolean>(true);
  readonly secondaryAction = signal<ErrorSecondaryAction | null>({
    route: '/explore',
    label: 'Explore More',
    icon: 'search',
  });

  retryCount = 0;

  onRetry(): void {
    this.retryCount++;
  }
}

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;
  let component: ErrorStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent, TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render default title, message, and icon, and no reload button by default', () => {
    const titleEl = fixture.nativeElement.querySelector('.error-state__title');
    const messageEl = fixture.nativeElement.querySelector('.error-state__message');
    const iconEl = fixture.nativeElement.querySelector('.error-state__icon');
    const reloadBtn = fixture.nativeElement.querySelector('.error-state__reload-btn');

    expect(titleEl?.textContent?.trim()).toBe('Something went wrong');
    expect(messageEl?.textContent?.trim()).toBe('Please try again later.');
    expect(iconEl?.textContent?.trim()).toBe('error_outline');
    expect(reloadBtn).toBeNull();
  });

  it('should emit retry output when reload button is clicked', () => {
    fixture.componentRef.setInput('showRetry', true);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.retry, 'emit');
    const reloadBtn = fixture.nativeElement.querySelector('.error-state__reload-btn');

    expect(reloadBtn).not.toBeNull();
    reloadBtn.click();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should support customized inputs via test host', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const titleEl = hostFixture.nativeElement.querySelector('.error-state__title');
    const messageEl = hostFixture.nativeElement.querySelector('.error-state__message');
    const iconEl = hostFixture.nativeElement.querySelector('.error-state__icon');
    const reloadBtn = hostFixture.nativeElement.querySelector('.error-state__reload-btn');
    const exploreBtn = hostFixture.nativeElement.querySelector('app-explore-button');

    expect(titleEl?.textContent?.trim()).toBe('Custom Error Title');
    expect(messageEl?.textContent?.trim()).toBe('Custom error message description.');
    expect(iconEl?.textContent?.trim()).toBe('warning');
    expect(reloadBtn?.textContent?.trim()).toContain('Try Again');
    expect(exploreBtn).toBeTruthy();

    reloadBtn.click();
    expect(hostFixture.componentInstance.retryCount).toBe(1);
  });

  it('should not render reload button when showRetry is false', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.showRetry.set(false);
    hostFixture.detectChanges();

    const reloadBtn = hostFixture.nativeElement.querySelector('.error-state__reload-btn');
    expect(reloadBtn).toBeNull();
  });
});
