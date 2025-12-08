import { FastifyInstance } from 'fastify';
import { requireSuperuser } from '../../middleware/auth';
import { User, Group, Permission, UserGroup, GroupPermission, UserPermission } from '../auth/models';

export default async function permissionsRoutes(fastify: FastifyInstance) {
    // Get all groups
    fastify.get('/api/admin/groups', {
        preHandler: requireSuperuser,
        schema: {
            tags: ['Admin'],
            description: 'Get all groups',
            security: [{ bearerAuth: [] }]
        }
    }, async (request, reply) => {
        const groups = Group.objects.all<Group>().all();
        reply.send({ groups });
    });

    // Get all permissions
    fastify.get('/api/admin/permissions', {
        preHandler: requireSuperuser,
        schema: {
            tags: ['Admin'],
            description: 'Get all permissions',
            security: [{ bearerAuth: [] }]
        }
    }, async (request, reply) => {
        const permissions = Permission.objects.all<Permission>().all();
        reply.send({ permissions });
    });

    // Get user's groups
    fastify.get('/api/admin/users/:userId/groups', {
        preHandler: requireSuperuser,
        schema: {
            tags: ['Admin'],
            description: 'Get user groups',
            security: [{ bearerAuth: [] }]
        }
    }, async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const userGroups = UserGroup.objects.filter({ userId: parseInt(userId) }).all();
        const groupIds = userGroups.map((ug: any) => ug.groupId);
        reply.send({ groupIds });
    });

    // Get user's permissions
    fastify.get('/api/admin/users/:userId/permissions', {
        preHandler: requireSuperuser,
        schema: {
            tags: ['Admin'],
            description: 'Get user permissions',
            security: [{ bearerAuth: [] }]
        }
    }, async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const userPermissions = UserPermission.objects.filter({ userId: parseInt(userId) }).all();
        const permissionIds = userPermissions.map((up: any) => up.permissionId);
        reply.send({ permissionIds });
    });

    // Update user's groups
    fastify.put('/api/admin/users/:userId/groups', {
        preHandler: requireSuperuser,
        schema: {
            tags: ['Admin'],
            description: 'Update user groups',
            security: [{ bearerAuth: [] }]
        }
    }, async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const { groupIds } = request.body as { groupIds: number[] };

        // Delete existing user groups
        const existing = UserGroup.objects.filter({ userId: parseInt(userId) }).all();
        existing.forEach((ug: any) => ug.delete());

        // Create new user groups
        groupIds.forEach(groupId => {
            const userGroup = new UserGroup();
            (userGroup as any).userId = parseInt(userId);
            (userGroup as any).groupId = groupId;
            userGroup.save();
        });

        reply.send({ success: true });
    });

    // Update user's permissions
    fastify.put('/api/admin/users/:userId/permissions', {
        preHandler: requireSuperuser,
        schema: {
            tags: ['Admin'],
            description: 'Update user permissions',
            security: [{ bearerAuth: [] }]
        }
    }, async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const { permissionIds } = request.body as { permissionIds: number[] };

        // Delete existing user permissions
        const existing = UserPermission.objects.filter({ userId: parseInt(userId) }).all();
        existing.forEach((up: any) => up.delete());

        // Create new user permissions
        permissionIds.forEach(permissionId => {
            const userPermission = new UserPermission();
            (userPermission as any).userId = parseInt(userId);
            (userPermission as any).permissionId = permissionId;
            userPermission.save();
        });

        reply.send({ success: true });
    });

    // Get group's permissions
    fastify.get('/api/admin/groups/:groupId/permissions', {
        preHandler: requireSuperuser,
        schema: {
            tags: ['Admin'],
            description: 'Get group permissions',
            security: [{ bearerAuth: [] }]
        }
    }, async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const groupPermissions = GroupPermission.objects.filter({ groupId: parseInt(groupId) }).all();
        const permissionIds = groupPermissions.map((gp: any) => gp.permissionId);
        reply.send({ permissionIds });
    });

    // Update group's permissions
    fastify.put('/api/admin/groups/:groupId/permissions', {
        preHandler: requireSuperuser,
        schema: {
            tags: ['Admin'],
            description: 'Update group permissions',
            security: [{ bearerAuth: [] }]
        }
    }, async (request, reply) => {
        const { groupId } = request.params as { groupId: string };
        const { permissionIds } = request.body as { permissionIds: number[] };

        // Delete existing group permissions
        const existing = GroupPermission.objects.filter({ groupId: parseInt(groupId) }).all();
        existing.forEach((gp: any) => gp.delete());

        // Create new group permissions
        permissionIds.forEach(permissionId => {
            const groupPermission = new GroupPermission();
            (groupPermission as any).groupId = parseInt(groupId);
            (groupPermission as any).permissionId = permissionId;
            groupPermission.save();
        });

        reply.send({ success: true });
    });
}
