# cracouchat

Fun chat to sharpen my react python chat skills

## Stack

This project follows the conventions and stack from [dust-tt/dust](https://github.com/dust-tt/dust):

- **Next.js 14** with TypeScript
- **React 18**
- **Tailwind CSS** with custom configuration
- **ESLint** with strict rules
- **Prettier** for code formatting

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run tsc` - Run TypeScript compiler

## Testing Deployment

### Option 1: Test production build locally

Test the production build without Docker:

```bash
./admin/test-build.sh
npm run start
```

### Option 2: Deploy with Docker (recommended)

Build and run the application in a Docker container:

```bash
./admin/deploy-local.sh
```

Or manually:

```bash
docker-compose build
docker-compose up
```

The application will be available at [http://localhost:3000](http://localhost:3000).

To view logs:
```bash
docker-compose logs -f
```

To stop:
```bash
docker-compose down
```

### Option 3: Build Docker image manually

```bash
docker build -t cracouchat:latest .
docker run -p 3000:3000 cracouchat:latest
```

## Coding Rules

See [CODING_RULES.md](./CODING_RULES.md) for detailed coding conventions.
