# Payment Requests System

This project is a payment request system built with Next.js and integrated with Supabase for backend services. It includes role-based access control and various integrations with Asana, Google Drive, and QuickBooks Online (QBO).

## Features

- **Payment Requests**: Create, list, and approve payment requests.
- **Role-Based Access Control**: Manage user permissions and access levels.
- **Integrations**:
  - **Asana**: Handle task management and webhook events.
  - **Google Drive**: Manage file storage and organization.
  - **QuickBooks Online**: Manage vendor information and transactions.

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd payment-requests-nextjs
   ```

2. Install dependencies:

   ```
   npm install
   ```

   or

   ```
   yarn install
   ```

3. Set up environment variables:

   Copy the `.env.example` file to `.env` and fill in the required values for your Supabase project and other integrations.

4. Run the development server:

   ```
   npm run dev
   ```

   or

   ```
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## Directory Structure

- `src/pages`: Contains all the pages of the application.
- `src/components`: Contains reusable UI components and payment-related components.
- `src/lib`: Contains client instances for Supabase and other integrations.
- `src/services`: Contains business logic for payments and integrations.
- `src/hooks`: Contains custom hooks for managing state and side effects.
- `src/middleware`: Contains middleware for role-based access control.
- `src/types`: Contains TypeScript types and interfaces.
- `scripts/db`: Contains SQL scripts for database migrations.
- `tests`: Contains unit and integration tests.

## Running Tests

To run the tests, use the following command:

```
npm test
```

or

```
yarn test
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.