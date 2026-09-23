import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { HeaderComponent } from './header.component';

@Component({
  selector: 'app-dummy-photos',
  template: '<div>Dummy Photos</div>',
})
class DummyPhotosComponent {}

@Component({
  selector: 'app-dummy-favorites',
  template: '<div>Dummy Favorites</div>',
})
class DummyFavoritesComponent {}

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyPhotosComponent },
          { path: 'favorites', component: DummyFavoritesComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the header component', () => {
    expect(component).toBeTruthy();
  });

  it('should render semantic header and navigation container with ARIA label', () => {
    const headerEl = fixture.nativeElement.querySelector('header.header');
    const navEl = fixture.nativeElement.querySelector('nav.header__nav');

    expect(headerEl).not.toBeNull();
    expect(navEl).not.toBeNull();
    expect(navEl.getAttribute('aria-label')).toBe('Main Navigation');
  });

  it('should render Photos and Favorites navigation links with correct icons and labels', () => {
    const navLinks = fixture.nativeElement.querySelectorAll('a.header__nav-link');
    expect(navLinks.length).toBe(2);

    const photosLink = navLinks[0];
    const favoritesLink = navLinks[1];

    expect(photosLink.getAttribute('href')).toBe('/');
    expect(photosLink.querySelector('.header__nav-icon')?.textContent?.trim()).toBe('photo_library');
    expect(photosLink.querySelector('.header__nav-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(photosLink.querySelector('.header__nav-label')?.textContent?.trim()).toBe('Photos');

    expect(favoritesLink.getAttribute('href')).toBe('/favorites');
    expect(favoritesLink.querySelector('.header__nav-icon')?.textContent?.trim()).toBe('favorite');
    expect(favoritesLink.querySelector('.header__nav-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(favoritesLink.querySelector('.header__nav-label')?.textContent?.trim()).toBe('Favorites');
  });

  it('should apply active class and aria-current when navigating between routes', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();

    const navLinks = fixture.nativeElement.querySelectorAll('a.header__nav-link');
    const photosLink = navLinks[0];
    const favoritesLink = navLinks[1];

    expect(photosLink.classList.contains('header__nav-link--active')).toBe(true);
    expect(photosLink.getAttribute('aria-current')).toBe('page');
    expect(favoritesLink.classList.contains('header__nav-link--active')).toBe(false);

    await router.navigateByUrl('/favorites');
    fixture.detectChanges();

    expect(photosLink.classList.contains('header__nav-link--active')).toBe(false);
    expect(favoritesLink.classList.contains('header__nav-link--active')).toBe(true);
    expect(favoritesLink.getAttribute('aria-current')).toBe('page');
  });
});
