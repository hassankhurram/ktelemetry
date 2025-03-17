# Express.js MVC Server with Handlebars and Sneat Admin Template +  Built-in database-less Authentication 

This repository contains an Express.js server structured in the MVC (Model-View-Controller) pattern, using Handlebars (hbs) for templating and incorporating the Sneat Admin Template for the frontend with pre built in authentication by json. it uses cookies to store the user session.


## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Routes](#routes)
- [Controllers](#controllers)
- [Views](#views)
- [License](#license)

## Installation

1. **Clone the repository:**

   ```sh
    git clone https://github.com/hassankhurram/simplewebjs.git
    cd simplewebjs
    ```

2. **Install dependencies:**

   ```sh
   npm install
   ```
3. **Environment Variables:**

   you can rename example.env to .env and set the variables as per your needs.
   ```sh
   NODE_ENV=development
   PORT=7896
   APP_TITLE=BatchCom CE
   BASE_URL=https://localhost:7896
   PASS_SALT_ROUNDS=10
   JWT_SECRET="abc1234"
   JWT_EXPIRES_IN=3600s
   ```
4. **Docker:**

   DockerFile and docker-compose file is included:

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
## Routes

   Routers are automatically loaded based on their name and class name by routers/routes.js file, it loops all the files in the folder routes and loads them for you so that you don't have to manually import them.

   i.e.

   authRouter.js >
   ```js
      export default class AuthRouter extends BaseRouter{
         static urlPath = "/auth";
         constructor(router) {
            super(router, AuthController);
            this.router.get('/login', AuthController.generateLoginPage);
            this.router.get('/logout', AuthController.logOutUser);
            this.router.post("/submit_login", AuthController.attemptLogin);
         }
      };
   ```

   file name and class name should be the same with naming convention in mind.

   The variable urlPath defines the prefix of the URL per router
   Syntax: 
      http://localhost:7896/:urlPath/url
   i.ie
   ```js
      static urlPath = "/auth";
   ```

      http://localhost:7896/auth/
      
## Controllers

   Controllers are simple having static functions in the class, can be exported and called, take an example of working of AuthController with AuthRouter 

   ### example:
   ```js
   export class MyController extends BaseController {

      constructor() {
         super();
      }

      static async someRandomController(req, res) {
         
      }
   }
   ```
## Views
   Views are placed inside pages folder, having layout and partials.
   
   Layouts are the structure in the page (component is loaded) along with partials ( repeated parts of the code. )
   The variables are populated using handlebars. you can also use ejs instead of handlebars.
   The pages are generated using utils/generator.js file. 

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

