# Ta vivo - Health Check

![dashbaord](./docs/images/dashboard.png)

# Development

For install all apps dependencies use;

```bash
$ yarn
```


## API

### Development

Create the `.env` file into `api` directory, use the `.env.example` file;

```bash
$ cp .env.example .env
```

:warning: The default user is on the `.env` file;

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secret
```

Run development server

```bash
$ yarn dev
```

#### Docker

Install all dependencies in the root dir;

```
$ yarn
```

Create the `.env` file into `api` directory, use the `.env.example` file;

```bash
$ cp .env.example .env
```

:bulb: Tip: If you want connect to database container, set the env var `DATABASE_HOST=host.docker.internal` 

now you can run `docker-compose`

```bash
$ docker-compose -f docker-compose.dev.yml up -d
```

---

## UI

Repository in progress...

---

:heart: