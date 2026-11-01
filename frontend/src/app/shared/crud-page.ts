import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudService } from '../core/crud.service';
import { errorMessage, isoDate } from '../core/errors';
import { FieldConfig, PageConfig } from './page-config';

type FormValue = string | number | null;

/**
 * Generic page section for one API resource: an add / edit form built from the config,
 * and the table of all the elements with "Modifier" and "Supprimer" buttons.
 */
@Component({
  selector: 'app-crud-page',
  imports: [ReactiveFormsModule],
  templateUrl: './crud-page.html',
})
export class CrudPage<T extends object> implements OnInit {
  readonly config = input.required<PageConfig<T>>();
  readonly service = input.required<CrudService<T>>();
  /** Emitted after every add, update or delete, so the page can refresh its other sections. */
  readonly changed = output<void>();

  protected readonly rows = signal<T[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  /** The row being edited, or null when the form adds a new element */
  protected readonly editing = signal<T | null>(null);
  protected form = new FormGroup<Record<string, FormControl<FormValue>>>({});

  ngOnInit(): void {
    const controls = this.config().fields.map(
      (field) => [field.key, new FormControl<FormValue>(null, Validators.required)] as const,
    );
    this.form = new FormGroup(Object.fromEntries(controls));
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service()
      .getAll()
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected edit(row: T): void {
    this.editing.set(row);
    const values = this.config().fields.map((field) => [field.key, toFormValue(field, valueOf(row, field.key))]);
    this.form.setValue(Object.fromEntries(values));
  }

  protected cancel(): void {
    this.editing.set(null);
    this.form.reset();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const current = this.editing();
    const idKey = this.config().idKey;
    const body = { ...this.form.getRawValue(), [idKey]: current ? valueOf(current, idKey) : 0 } as Partial<T>;
    const request = current ? this.service().update(body) : this.service().add(body);
    request.subscribe({
      next: () => this.afterChange(),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  protected remove(row: T): void {
    const id = valueOf(row, this.config().idKey) as number | string;
    if (!confirm(`Supprimer l’élément ${id} ?`)) {
      return;
    }
    this.service()
      .delete(id)
      .subscribe({
        next: () => this.afterChange(),
        error: (err) => this.error.set(errorMessage(err)),
      });
  }

  private afterChange(): void {
    this.error.set(null);
    this.cancel();
    this.reload();
    this.changed.emit();
  }
}

function valueOf(row: object, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function toFormValue(field: FieldConfig, value: unknown): FormValue {
  if (value === null || value === undefined) {
    return null;
  }
  return field.type === 'date' ? isoDate(String(value)) : (value as string | number);
}
