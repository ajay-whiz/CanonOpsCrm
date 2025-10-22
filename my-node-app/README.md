# My Node App

## Overview
This project is a Node.js application built with TypeScript and Express. It serves as a template for building RESTful APIs.

## Features
- Modular architecture with separate folders for controllers, services, models, middleware, and utilities.
- TypeScript for type safety and better development experience.
- Unit tests to ensure code quality and functionality.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd my-node-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the application, run:
```
npm start
```
The server will start on the specified port (default is 3000).

### Running Tests
To run the unit tests, use:
```
npm test
```

## Folder Structure
- `src/`: Contains the source code of the application.
  - `controllers/`: Contains controller classes for handling requests.
  - `routes/`: Defines the application's routes.
  - `services/`: Contains business logic and interacts with models.
  - `models/`: Defines data structures and database interactions.
  - `middleware/`: Contains middleware functions.
  - `utils/`: Utility functions for common tasks.
  - `config/`: Configuration settings for the application.
- `tests/`: Contains unit tests for the application.
- `package.json`: Lists dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.
- `.eslintrc.json`: ESLint configuration.
- `.gitignore`: Specifies files to ignore in Git.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License.