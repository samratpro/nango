# Creating an Admin User in Docker

This guide explains how to run the CLI commands to create a superuser (admin) when your backend API is running inside a Docker container.

## Using the CLI

The backend provides a `createsuperuser` command to easily create an admin account. When running natively, you use `npm run createsuperuser`. When running in Docker, you execute this command inside the `api` container.

### The Command

Run the following command in your terminal at the root of the project (where your `docker-compose.yml` is located):

```bash
docker compose exec -it api npm run createsuperuser
```

### Interactive Prompts

Once you run the command, the script will prompt you for the user details interactively:

```text
--- Create User ---
Username: admin
Email: admin@admin.com
Password: admin
Role (admin/staff/user) [user]: admin

✓ User "admin" created successfully!
  Role: Superuser
```

### Notes
- The `-it` flag in `docker compose exec -it` is important because it attaches an interactive terminal, allowing you to answer the prompts.
- If you've modified the `api` service name in `docker-compose.yml`, make sure to use your custom service name instead of `api`.
