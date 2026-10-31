import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    jasmine.clock().install();   // controls setTimeout: no real waiting
    service = TestBed.inject(ToastService);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('adds a success and an error notification', () => {
    service.succes('Enregistré');
    service.erreur('Refusé');

    expect(service.toasts().map(t => [t.type, t.message])).toEqual([['succes', 'Enregistré'], ['erreur', 'Refusé']]);
  });

  it('removes a notification when it is closed', () => {
    service.succes('Enregistré');

    service.fermer(service.toasts()[0].id);

    expect(service.toasts()).toEqual([]);
  });

  it('removes a notification by itself after a few seconds', () => {
    service.succes('Enregistré');

    jasmine.clock().tick(ToastService.DUREE_MS - 1);
    expect(service.toasts().length).toBe(1);

    jasmine.clock().tick(1);
    expect(service.toasts().length).toBe(0);
  });
});
