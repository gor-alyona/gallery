import { routes } from './app.routes';

describe('App Routes', () => {
  it('should define title for root photos route', () => {
    const route = routes.find((r) => r.path === '');
    expect(route?.title).toBe('Gallery - Photos');
  });

  it('should define title for favorites route', () => {
    const route = routes.find((r) => r.path === 'favorites');
    expect(route?.title).toBe('Gallery - Favorites');
  });

  it('should define title for photo detail route', () => {
    const route = routes.find((r) => r.path === 'photos/:id');
    expect(route?.title).toBe('Gallery - Photo Details');
  });

  it('should define title for wildcard route', () => {
    const route = routes.find((r) => r.path === '**');
    expect(route?.title).toBe('Gallery - Page Not Found');
  });
});
