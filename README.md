# One Constellation Telemetry Project

This repository contains the One Constellation Telemetry Project, which is designed to collect, process, and visualize telemetry data. The project is structured in the MVC (Model-View-Controller) pattern, using Handlebars (hbs) for templating and incorporating the Sneat Admin Template for the frontend with built-in database-less authentication. It uses cookies to store the user session.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Routes](#routes)
- [Controllers](#controllers)
- [Views](#views)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/yourusername/oc-telemetry.git
   cd oc-telemetry
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Environment Variables:**

   Rename `example.env` to `.env` and set the variables as per your needs.

   ```sh
   NODE_ENV=development
   PORT=7896
   APP_TITLE=TelemetryApp
   BASE_URL=https://localhost:7896
   PASS_SALT_ROUNDS=10
   JWT_SECRET="your_jwt_secret"
   JWT_EXPIRES_IN=3600s
   ```

4. **Docker:**

   DockerFile and docker-compose file are included:

   ```sh
   docker compose up --build -d
   ```

## Usage

### In development:

```sh
npm run dev
```

### In Production:

```sh
npm run start
```

### Routes

#### Ingest Logs

Use the following route to save logs to BigQuery:

```sh
POST /logs/api/ingest
```

Payload example:

```json
{
    "event_name": "GET_ENTITY_DOMAINS",
    "service": "oc_portal",
    "source_identifier": "gcp_prod_oc_portal",
    "status": true,
    "browser": {
        "url": "https://mydomain.com/domains/",
        "useragent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "userip": "192.168.1.1",
        "user_location": "US"
    },
    "action": {
        "type": "API_REQUEST",
        "details": {
            "api_tag": "GET_ENTITY_DOMAINS",
            "method": "GET",
            "url": "https://mydomainserver.com/domains/get/1230u213912-123-12-3-1234-12-",
            "params": {
                "accountId": "12345678-1234-1234-1234-123456789012"
            },
            "body": {},
            "headers": {},
            "http_code": 200,
            "response_identifier": ""
        }
    },
    "actor": {
        "type": "entity",
        "entity": {
            "id": "12345678-1234-1234-1234-123456789012"
        },
        "user": {
            "id": "12345678-1234-1234-1234-123456789012"
        }
    },
    "file_details": {
        "file_name": "components/domains.tsx",
        "function_name": "getUsersDomains()"
    },
    "log_severity": "INFO",
    "time_in_msec": 1688114200000,
    "time_out_msec": 1688114260000
}
```

## Routes

Routers are automatically loaded based on their name and class name by `routers/routes.js` file. It loops through all the files in the `routes` folder and loads them for you so that you don't have to manually import them.

Example:

`authRouter.js`:

```js
export default class AuthRouter extends BaseRouter {
   static urlPath = "/auth";
   constructor(router) {
      super(router, AuthController);
      this.router.get('/login', AuthController.generateLoginPage);
      this.router.get('/logout', AuthController.logOutUser);
      this.router.post("/submit_login", AuthController.attemptLogin);
   }
};
```

File name and class name should be the same with naming convention in mind. The variable `urlPath` defines the prefix of the URL per router.

Syntax: 
```sh
http://localhost:7896/:urlPath/url
```

Example:
```js
static urlPath = "/auth";
```

```sh
http://localhost:7896/auth/
```

## Controllers

Controllers are simple classes having static functions. They can be exported and called. Here is an example of how `AuthController` works with `AuthRouter`.

Example:

```js
export class MyController extends BaseController {
   constructor() {
      super();
   }

   static async someRandomController(req, res) {
      // Controller logic
   }
}
```

## Views

Views are placed inside the `pages` folder, having layout and partials. Layouts are the structure in the page (component is loaded) along with partials (repeated parts of the code). The variables are populated using Handlebars. You can also use EJS instead of Handlebars. The pages are generated using `utils/generator.js` file.

Layout:

```sh
.
├── layouts
│   ├── authcontext.hbs
│   ├── basic.hbs
│   └── dashboardcontext.hbs
├── pages
│   ├── http
│   │   └── error.hbs
│   ├── index.hbs
│   └── login.hbs
└── partials
   ├── footer.hbs
   ├── navbar.hbs
   ├── scripts.hbs
   └── sidebar.hbs
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## Acknowledgments

This project was inspired by the following resources:

* [Express.js](https://expressjs.com/)
* [Handlebars](https://handlebarsjs.com/)
* [Sneat Admin Template](https://github.com/themeselection/sneat-html-admin-template)

Feel free to contact me on support@hassankhurram.com if you have any questions or suggestions or raise an issue if needed.
