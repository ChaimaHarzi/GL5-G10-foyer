import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the brand and a working link to the universites page', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.marque')?.textContent).toContain('tpFoyer');
    expect(compiled.querySelector('a.nav-lien[href="/universites"]')).not.toBeNull();
  });

  it('should show the pages not built yet as disabled', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const desactives = (fixture.nativeElement as HTMLElement).querySelectorAll('.nav-lien.desactive');

    expect(desactives.length).toBe(6);
    expect(desactives[0].textContent).toContain('bientôt');
  });
});
