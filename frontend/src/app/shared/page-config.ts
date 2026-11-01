/** One input of the add / edit form. `key` is the JSON property sent to the API. */
export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  /** Choices of a 'select' field */
  options?: readonly string[];
}

/** One column of the table. */
export interface ColumnConfig<T> {
  label: string;
  value: (row: T) => string | number;
}

/** Everything the generic CRUD page needs to know about one resource. */
export interface PageConfig<T> {
  /** Title of the list, e.g. "Foyers" */
  title: string;
  /** Used in "Ajouter un foyer", e.g. "un foyer" */
  singular: string;
  /** Name of the id property, sent as 0 to create and as the row id to update */
  idKey: keyof T & string;
  fields: FieldConfig[];
  columns: ColumnConfig<T>[];
}
