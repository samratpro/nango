import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

class DatabaseManager {
  private static instance: Database.Database | null = null;
  private static dbPath: string = path.join(process.cwd(), 'db.sqlite3');

  static initialize(customPath?: string): Database.Database {
    if (customPath) {
      this.dbPath = customPath;
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.instance = new Database(this.dbPath);
    this.instance.pragma('journal_mode = WAL');

    return this.instance;
  }

  static getConnection(): Database.Database {
    if (!this.instance) {
      return this.initialize();
    }
    return this.instance;
  }

  static close(): void {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
    }
  }

  static getPath(): string {
    return this.dbPath;
  }
}

export default DatabaseManager;
