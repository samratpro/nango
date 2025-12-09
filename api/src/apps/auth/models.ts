import { Model } from '../../core/model';
import { CharField, EmailField, BooleanField, DateTimeField, TextField, IntegerField } from '../../core/fields';
import { registerAdmin } from '../../core/adminRegistry';
import bcrypt from 'bcryptjs';

@registerAdmin({
  appName: 'Auth',
  displayName: 'Users',
  icon: 'users',
  permissions: ['view', 'add', 'change', 'delete'],
  listDisplay: ['id', 'username', 'email', 'isActive', 'isStaff', 'isSuperuser'],
  searchFields: ['username', 'email', 'firstName', 'lastName'],
  filterFields: ['isActive', 'isStaff', 'isSuperuser'],
  excludeFields: ['password']
})
export class User extends Model {
  username = new CharField({ unique: true, maxLength: 150 });
  email = new EmailField({ unique: true });
  password = new TextField();
  firstName = new CharField({ maxLength: 150, nullable: true });
  lastName = new CharField({ maxLength: 150, nullable: true });
  isActive = new BooleanField({ default: false }); // Requires email verification
  isStaff = new BooleanField({ default: false });
  isSuperuser = new BooleanField({ default: false });
  dateJoined = new DateTimeField({ default: () => new Date().toISOString() });
  lastLogin = new DateTimeField({ nullable: true });

  async setPassword(password: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(password, salt);
  }

  async checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  getFullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
  }

  static getTableName(): string {
    return 'users';
  }
}

// Permission model - NOT registered in admin (like Django)
// Permissions are managed through User edit page
export class Permission extends Model {
  name = new CharField({ maxLength: 255 }); // e.g., "Can add product"
  codename = new CharField({ maxLength: 100, unique: true }); // e.g., "add_product"
  modelName = new CharField({ maxLength: 100 }); // e.g., "Product"

  static getTableName(): string {
    return 'permissions';
  }
}

@registerAdmin({
  appName: 'Auth',
  displayName: 'Groups',
  icon: 'users-cog',
  permissions: ['view', 'add', 'change', 'delete']
})
export class Group extends Model {
  name = new CharField({ maxLength: 150, unique: true });
  description = new TextField({ nullable: true });

  static getTableName(): string {
    return 'groups';
  }
}

// Junction table for User-Permission many-to-many relationship
export class UserPermission extends Model {
  userId = new IntegerField();
  permissionId = new IntegerField();

  static getTableName(): string {
    return 'user_permissions';
  }
}

// Junction table for Group-Permission many-to-many relationship
export class GroupPermission extends Model {
  groupId = new IntegerField();
  permissionId = new IntegerField();

  static getTableName(): string {
    return 'group_permissions';
  }
}

// Junction table for User-Group many-to-many relationship
export class UserGroup extends Model {
  userId = new IntegerField();
  groupId = new IntegerField();

  static getTableName(): string {
    return 'user_groups';
  }
}

export class EmailVerificationToken extends Model {
  userId = new CharField({ maxLength: 36 });
  token = new CharField({ unique: true, maxLength: 255 });
  createdAt = new DateTimeField({ default: () => new Date().toISOString() });
  expiresAt = new DateTimeField();

  static getTableName(): string {
    return 'email_verification_tokens';
  }

  isExpired(): boolean {
    return new Date() > new Date(this.expiresAt);
  }
}

export class PasswordResetToken extends Model {
  userId = new CharField({ maxLength: 36 });
  token = new CharField({ unique: true, maxLength: 255 });
  createdAt = new DateTimeField({ default: () => new Date().toISOString() });
  expiresAt = new DateTimeField();
  used = new BooleanField({ default: false });

  static getTableName(): string {
    return 'password_reset_tokens';
  }

  isExpired(): boolean {
    return new Date() > new Date(this.expiresAt);
  }
}

export class RefreshToken extends Model {
  userId = new CharField({ maxLength: 36 });
  token = new CharField({ unique: true, maxLength: 500 });
  createdAt = new DateTimeField({ default: () => new Date().toISOString() });
  expiresAt = new DateTimeField();
  revoked = new BooleanField({ default: false });

  static getTableName(): string {
    return 'refresh_tokens';
  }

  isExpired(): boolean {
    return new Date() > new Date(this.expiresAt);
  }

  isValid(): boolean {
    return !this.revoked && !this.isExpired();
  }
}
