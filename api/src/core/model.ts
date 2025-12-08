import DatabaseManager from './database';
import { Field, AutoField } from './fields';
import Database from 'better-sqlite3';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export class QuerySet<T> {
  private model: typeof Model;
  private filters: Record<string, any> = {};
  private options: QueryOptions = {};

  constructor(model: typeof Model) {
    this.model = model;
  }

  filter(filters: Record<string, any>): QuerySet<T> {
    this.filters = { ...this.filters, ...filters };
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QuerySet<T> {
    this.options.orderBy = field;
    this.options.orderDirection = direction;
    return this;
  }

  limit(count: number): QuerySet<T> {
    this.options.limit = count;
    return this;
  }

  offset(count: number): QuerySet<T> {
    this.options.offset = count;
    return this;
  }

  all(): T[] {
    const db = DatabaseManager.getConnection();
    const tableName = this.model.getTableName();

    let query = `SELECT * FROM ${tableName}`;
    const params: any[] = [];

    if (Object.keys(this.filters).length > 0) {
      const conditions = Object.keys(this.filters).map(key => {
        params.push(this.filters[key]);
        return `${key} = ?`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (this.options.orderBy) {
      query += ` ORDER BY ${this.options.orderBy} ${this.options.orderDirection || 'ASC'}`;
    }

    if (this.options.limit) {
      query += ` LIMIT ${this.options.limit}`;
    }

    if (this.options.offset) {
      query += ` OFFSET ${this.options.offset}`;
    }

    const stmt = db.prepare(query);
    const results = stmt.all(...params);

    return results.map(row => {
      const instance = new (this.model as any)();
      Object.assign(instance, row);
      return instance;
    });
  }

  first(): T | null {
    const results = this.limit(1).all();
    return results.length > 0 ? results[0] : null;
  }

  count(): number {
    const db = DatabaseManager.getConnection();
    const tableName = this.model.getTableName();

    let query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const params: any[] = [];

    if (Object.keys(this.filters).length > 0) {
      const conditions = Object.keys(this.filters).map(key => {
        params.push(this.filters[key]);
        return `${key} = ?`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  delete(): number {
    const db = DatabaseManager.getConnection();
    const tableName = this.model.getTableName();

    let query = `DELETE FROM ${tableName}`;
    const params: any[] = [];

    if (Object.keys(this.filters).length > 0) {
      const conditions = Object.keys(this.filters).map(key => {
        params.push(this.filters[key]);
        return `${key} = ?`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    return result.changes;
  }
}

export class Model {
  id?: number;

  static fields: Record<string, Field> = {};

  static getTableName(): string {
    return this.name.toLowerCase() + 's';
  }

  static getFields(): Record<string, Field> {
    const fields: Record<string, Field> = {};

    // Add id field by default
    const idField = new AutoField();
    idField.fieldName = 'id';
    fields.id = idField;

    // Get fields from the class
    const instance = new (this as any)();
    for (const key in instance) {
      if (instance[key] instanceof Field) {
        const field = instance[key] as Field;
        field.fieldName = key;
        fields[key] = field;
      }
    }

    return fields;
  }

  static createTable(): void {
    const db = DatabaseManager.getConnection();
    const tableName = this.getTableName();
    const fields = this.getFields();

    const fieldDefinitions: string[] = [];
    const foreignKeys: string[] = [];

    for (const [name, field] of Object.entries(fields)) {
      const definition = field.getFullDefinition();

      if (definition.includes('FOREIGN KEY')) {
        const parts = definition.split(', FOREIGN KEY');
        fieldDefinitions.push(parts[0]);
        foreignKeys.push('FOREIGN KEY' + parts[1]);
      } else {
        fieldDefinitions.push(definition);
      }
    }

    const allDefinitions = [...fieldDefinitions, ...foreignKeys].join(', ');
    const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${allDefinitions})`;

    db.exec(createTableSQL);
  }

  static dropTable(): void {
    const db = DatabaseManager.getConnection();
    const tableName = this.getTableName();
    db.exec(`DROP TABLE IF EXISTS ${tableName}`);
  }

  static get objects() {
    const ModelClass = this;
    return {
      all: function<T>(): QuerySet<T> {
        return new QuerySet<T>(ModelClass);
      },

      filter: function<T>(filters: Record<string, any>): QuerySet<T> {
        return new QuerySet<T>(ModelClass).filter(filters);
      },

      get: function<T>(filters: Record<string, any>): T | null {
        return new QuerySet<T>(ModelClass).filter(filters).first();
      },

      create: function<T>(data: Partial<T>): T {
        const instance = new (ModelClass as any)();
        Object.assign(instance, data);
        instance.save();
        return instance;
      },

      count: function(): number {
        return new QuerySet(ModelClass).count();
      }
    };
  }

  save(): void {
    const db = DatabaseManager.getConnection();
    const tableName = (this.constructor as typeof Model).getTableName();
    const fields = (this.constructor as typeof Model).getFields();

    const data: Record<string, any> = {};

    // Only iterate over the field names we know about, not all instance properties
    for (const fieldName of Object.keys(fields)) {
      if (fieldName !== 'id') {
        let value = (this as any)[fieldName];
        const field = fields[fieldName];

        // Skip if the value is still a Field instance (not yet assigned)
        if (value !== undefined && value !== null && typeof value === 'object' && 'fieldName' in value) {
          // Check if field has a default value
          if (field.options.default !== undefined) {
            // If default is a function, call it
            if (typeof field.options.default === 'function') {
              value = field.options.default();
            } else {
              value = field.options.default;
            }
          } else {
            continue; // Skip Field instances with no default
          }
        }

        // Handle undefined/null values with defaults
        if ((value === undefined || value === null) && field.options.default !== undefined) {
          if (typeof field.options.default === 'function') {
            value = field.options.default();
          } else {
            value = field.options.default;
          }
        }

        // Convert booleans to integers for SQLite (SQLite doesn't have native boolean type)
        if (typeof value === 'boolean') {
          data[fieldName] = value ? 1 : 0;
        } else {
          data[fieldName] = value;
        }
      }
    }

    if (this.id) {
      // Update existing record
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), this.id];

      const updateSQL = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
      const stmt = db.prepare(updateSQL);
      stmt.run(...values);
    } else {
      // Insert new record
      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(', ');
      const values = Object.values(data);

      const insertSQL = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
      const stmt = db.prepare(insertSQL);
      const result = stmt.run(...values);

      this.id = result.lastInsertRowid as number;
    }
  }

  delete(): void {
    if (!this.id) {
      throw new Error('Cannot delete unsaved object');
    }

    const db = DatabaseManager.getConnection();
    const tableName = (this.constructor as typeof Model).getTableName();

    const deleteSQL = `DELETE FROM ${tableName} WHERE id = ?`;
    const stmt = db.prepare(deleteSQL);
    stmt.run(this.id);
  }

  toJSON(): Record<string, any> {
    const result: Record<string, any> = {};
    const fields = (this.constructor as typeof Model).getFields();
    for (const key in this) {
      const value = (this as any)[key];
      if (typeof value !== 'function' && (value === null || value === undefined || typeof value !== 'object' || !('fieldName' in value))) {
        result[key] = value;
      }
    }
    return result;
  }
}
