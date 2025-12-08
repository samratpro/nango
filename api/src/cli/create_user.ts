import { User } from '../apps/auth/models';
import DatabaseManager from '../core/database';
import settings from '../config/settings';
import readline from 'readline';

// Initialize DB
DatabaseManager.initialize(settings.database.path);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));

async function run() {
    try {
        console.log('--- Create User ---');
        const username = await question('Username: ');
        if (!username) throw new Error('Username required');

        const email = await question('Email: ');
        if (!email) throw new Error('Email required');

        const password = await question('Password: ');
        if (!password) throw new Error('Password required');

        const role = await question('Role (admin/staff/user) [user]: ');

        let isSuperuser = false;
        let isStaff = false;

        const r = role.toLowerCase().trim();
        if (r === 'admin' || r === 'superuser') {
            isSuperuser = true;
            isStaff = true;
        } else if (r === 'staff') {
            isStaff = true;
        }

        // Check exists
        const exists = User.objects.get<User>({ username });
        if (exists) {
            console.error('User already exists');
            return;
        }

        const user = new User();
        (user as any).username = username;
        (user as any).email = email;
        (user as any).isStaff = isStaff;
        (user as any).isSuperuser = isSuperuser;
        (user as any).isActive = true;

        await user.setPassword(password);
        user.save();

        console.log(`\nUser ${username} created successfully!`);
        console.log(`Role: ${isSuperuser ? 'Superuser' : (isStaff ? 'Staff' : 'User')}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        rl.close();
        process.exit(0);
    }
}

run();
