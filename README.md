# Ta vivo - Health Check

![demo](https://njxuriszytyyfwsmdbga.supabase.co/storage/v1/object/public/assets/demo.png)

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
ADMIN_USERNAME=admin@tavivo.com
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
## Documentation

The full documentation is available on [https://documentation-tavivo.albert.do/back-end/#back-end](https://documentation-tavivo.albert.do/back-end/#back-end)

---

## UI

Check the repository [https://github.com/ta-vivo](https://github.com/ta-vivo)

---

:heart: