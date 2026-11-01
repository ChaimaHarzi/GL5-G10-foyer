import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CrudService } from '../core/crud.service';
import { CrudPage } from './crud-page';
import { PageConfig } from './page-config';

interface Item {
  idItem: number;
  nom: string;
  taille: number;
}

const config: PageConfig<Item> = {
  title: 'Items',
  singular: 'un item',
  idKey: 'idItem',
  fields: [
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'taille', label: 'Taille', type: 'number' },
  ],
  columns: [
    { label: 'Nom', value: (item) => item.nom },
    { label: 'Taille', value: (item) => item.taille },
  ],
};

function fakeService(rows: Item[]) {
  return {
    getAll: vi.fn(() => of(rows)),
    add: vi.fn(() => of({})),
    update: vi.fn(() => of({})),
    delete: vi.fn(() => of(undefined)),
  };
}

describe('CrudPage', () => {
  let fixture: ComponentFixture<CrudPage<Item>>;
  let element: HTMLElement;

  async function setup(service: ReturnType<typeof fakeService>) {
    await TestBed.configureTestingModule({ imports: [CrudPage] }).compileComponents();
    fixture = TestBed.createComponent(CrudPage<Item>);
    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('service', service as unknown as CrudService<Item>);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  function type(name: string, value: string) {
    const input = element.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function click(selector: string) {
    element.querySelector<HTMLButtonElement>(selector)!.click();
    await fixture.whenStable();
  }

  it('lists the rows returned by the service', async () => {
    await setup(fakeService([{ idItem: 1, nom: 'A', taille: 1 }, { idItem: 2, nom: 'B', taille: 2 }]));

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[1].textContent).toContain('B');
    expect(element.querySelectorAll('h2')[1].textContent).toContain('Items (2)');
  });

  it('adds an element with id 0, then reloads the list', async () => {
    const service = fakeService([]);
    await setup(service);

    type('nom', 'C');
    type('taille', '3');
    await click('button[type="submit"]');

    expect(service.add).toHaveBeenCalledWith({ nom: 'C', taille: 3, idItem: 0 });
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });

  it('updates the edited element with its own id', async () => {
    const service = fakeService([{ idItem: 7, nom: 'A', taille: 1 }]);
    await setup(service);

    await click('tbody button');
    expect(element.querySelector<HTMLInputElement>('input[name="nom"]')!.value).toBe('A');
    type('nom', 'A2');
    await click('button[type="submit"]');

    expect(service.update).toHaveBeenCalledWith({ nom: 'A2', taille: 1, idItem: 7 });
    expect(service.add).not.toHaveBeenCalled();
  });

  it('deletes an element after confirmation', async () => {
    const service = fakeService([{ idItem: 7, nom: 'A', taille: 1 }]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await setup(service);

    await click('tbody button.danger');

    expect(service.delete).toHaveBeenCalledWith(7);
  });

  it('does not call the API while the form is incomplete', async () => {
    const service = fakeService([]);
    await setup(service);

    type('nom', 'C');
    await click('button[type="submit"]');

    expect(service.add).not.toHaveBeenCalled();
    expect(element.querySelector('.hint')?.textContent).toContain('obligatoires');
  });

  it('shows the error when the API does not answer', async () => {
    const service = fakeService([]);
    service.getAll.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    await setup(service);

    expect(element.querySelector('.error')?.textContent).toContain('Le serveur ne répond pas.');
  });
});
