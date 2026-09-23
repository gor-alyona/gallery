import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Action, NotFoundComponent } from './not-found.component';
import { ExploreButtonComponent } from '../explore-button/explore-button.component';
import { By } from '@angular/platform-browser';

@Component({
  imports: [NotFoundComponent],
  template: `
    <app-not-found
      [description]="description()"
      [action]="action()"
    />
  `,
})
class TestHostComponent {
  readonly description = signal<string>('The requested resource was not found.');
  readonly action = signal<Action | undefined>({
    route: '/custom-route',
    label: 'Back to Safety',
  });
}

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;
  let component: NotFoundComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent, TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('description', 'Default not found message');
    fixture.detectChanges();
  });

  it('should create the not found component', () => {
    expect(component).toBeTruthy();
  });

  it('should render 404 status code, heading, and description', () => {
    fixture.componentRef.setInput('description', 'Custom missing page description');
    fixture.detectChanges();

    const notFoundEl = fixture.nativeElement.querySelector('.not-found');
    const statusCodeEl = fixture.nativeElement.querySelector('.status-code');
    const titleEl = fixture.nativeElement.querySelector('h1');
    const descEl = fixture.nativeElement.querySelector('p');

    expect(notFoundEl).not.toBeNull();
    expect(statusCodeEl?.textContent?.trim()).toBe('404');
    expect(titleEl?.textContent?.trim()).toBe('Not Found');
    expect(descEl?.textContent?.trim()).toBe('Custom missing page description');
  });

  it('should render explore button when action is provided via host component', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const descEl = hostFixture.nativeElement.querySelector('p');
    const exploreBtnEl = hostFixture.debugElement.query(By.directive(ExploreButtonComponent));

    expect(descEl?.textContent?.trim()).toBe('The requested resource was not found.');
    expect(exploreBtnEl).not.toBeNull();
    expect(exploreBtnEl.componentInstance.route()).toBe('/custom-route');
    expect(exploreBtnEl.componentInstance.label()).toBe('Back to Safety');
    expect(exploreBtnEl.componentInstance.icon()).toBeNull();
  });

  it('should not render explore button when action is undefined', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.action.set(undefined);
    hostFixture.detectChanges();

    const exploreBtnEl = hostFixture.debugElement.query(By.directive(ExploreButtonComponent));
    expect(exploreBtnEl).toBeNull();
  });
});
