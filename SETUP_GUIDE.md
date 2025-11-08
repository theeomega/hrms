# Setup and Development Guide

## Quick Start

### 1. Prerequisites
Make sure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### 2. Installation

Clone the repository and install dependencies:

```bash
# Navigate to project directory
cd d:\Awais\HRMasterMind

# Install all dependencies
npm install
```

### 3. Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at:
```
http://localhost:5000
```

### 4. Login

Use one of the demo accounts:

**HR Administrator:**
- Email: `admin@company.com`
- Password: `admin123`

**Employee:**
- Email: `john@company.com`
- Password: `john123`

---

## Project Commands

### Development
```bash
npm run dev          # Start development server with hot reload
```

### Build
```bash
npm run build        # Build for production
npm run check        # Run TypeScript type checking
```

### Production
```bash
npm start            # Run production server (after build)
```

### Database
```bash
npm run db:push      # Push schema changes to database
```

---

## Development Workflow

### 1. Making Changes

#### Frontend Changes
- Edit files in `client/src/`
- Changes auto-reload via Vite HMR
- Components are in `client/src/components/`
- Pages are in `client/src/pages/`

#### Backend Changes
- Edit files in `server/`
- Server auto-restarts via tsx watch mode
- API routes are in `server/routes.ts`
- Storage layer is in `server/storage.ts`

#### Shared Types
- Edit `shared/schema.ts` for database schema
- Changes affect both frontend and backend
- Run `npm run check` to verify types

### 2. Adding New Features

#### Add a New Page
```typescript
// 1. Create page component
// client/src/pages/NewPage.tsx
export default function NewPage() {
  return <div>New Page</div>;
}

// 2. Add route in App.tsx
import NewPage from "@/pages/NewPage";
// ...
<Route path="/new-page" component={NewPage} />

// 3. Add to sidebar (if needed)
// client/src/components/AppSidebar.tsx
```

#### Add a New API Endpoint
```typescript
// server/routes.ts
app.get("/api/new-endpoint", requireAuth, async (req, res) => {
  // Implementation
});

// client/src/lib/api.ts
export const newAPI = {
  getData: async () => {
    const response = await fetch(`${API_BASE}/new-endpoint`, {
      credentials: "include",
    });
    return response.json();
  },
};
```

#### Add a New Database Table
```typescript
// 1. Define schema in shared/schema.ts
export const newTable = pgTable("new_table", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // ... columns
});

// 2. Add types
export type NewTable = typeof newTable.$inferSelect;
export type InsertNewTable = z.infer<typeof insertNewTableSchema>;

// 3. Update storage interface
// server/storage.ts
export interface IStorage {
  // ... existing methods
  getNewData(): Promise<NewTable[]>;
}
```

### 3. Styling

The project uses Tailwind CSS with a custom design system:

```typescript
// Utility classes
className="p-4 rounded-lg shadow-sm"

// Custom components from ui/
import { Button } from "@/components/ui/button";
<Button variant="outline">Click Me</Button>
```

**Key Design Tokens:**
- Spacing: `p-4`, `gap-6`, `mb-8`
- Colors: `bg-primary`, `text-muted-foreground`
- Rounded: `rounded-lg`, `rounded-xl`
- Shadows: `shadow-sm`, `shadow-md`

---

## Code Structure

### Frontend Architecture

```
client/src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── AppSidebar.tsx   # Main navigation
│   ├── StatCard.tsx     # Dashboard widgets
│   └── ...              # Feature components
├── pages/
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Employees.tsx    # Employee management
│   └── ...              # Other pages
├── lib/
│   ├── api.ts          # API client
│   ├── utils.ts        # Utilities
│   └── queryClient.ts  # React Query config
├── hooks/
│   └── use-toast.ts    # Toast notifications
└── App.tsx             # Root component
```

### Backend Architecture

```
server/
├── index.ts    # Express server setup
├── routes.ts   # API endpoint definitions
├── storage.ts  # Data access layer
└── db.ts       # Database configuration
```

### Shared Code

```
shared/
└── schema.ts   # TypeScript types and Zod schemas
```

---

## Environment Configuration

### Development
The app runs with default settings in development mode.

### Production
Set environment variables:

```bash
# .env file
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-very-secure-secret-key-here
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

**Important:** Change the `SESSION_SECRET` in production!

---

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout
- [ ] Session persistence across page refreshes

**HR Admin Features:**
- [ ] View all employees
- [ ] Add new employee
- [ ] Edit employee
- [ ] View attendance reports
- [ ] Approve leave requests
- [ ] Reject leave requests
- [ ] View analytics

**Employee Features:**
- [ ] View personal dashboard
- [ ] Check in
- [ ] Check out
- [ ] Apply for leave
- [ ] View leave history
- [ ] Update profile
- [ ] View notifications

### Testing with data-testid

Components include `data-testid` attributes for automated testing:

```typescript
// Example test with Playwright or Cypress
await page.click('[data-testid="button-login"]');
await page.fill('[data-testid="input-email"]', 'admin@company.com');
```

---

## Troubleshooting

### Port Already in Use
```bash
# Change port in package.json or use environment variable
PORT=3000 npm run dev
```

### TypeScript Errors
```bash
# Run type checking
npm run check

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clean build
rm -rf dist
npm run build
```

### Session Issues
- Clear browser cookies
- Check SESSION_SECRET is set
- Verify credentials are correct

---

## Database Migration

Currently using in-memory storage. To migrate to PostgreSQL:

1. Set up PostgreSQL database
2. Configure connection in `server/db.ts`
3. Run migrations:
```bash
npm run db:push
```

4. Update storage implementation in `server/storage.ts` to use Drizzle ORM queries instead of Map storage

---

## Performance Optimization

### Frontend
- Code splitting with dynamic imports
- Image optimization
- React Query for caching
- Lazy loading components

### Backend
- Enable compression
- Add caching headers
- Implement API rate limiting
- Database indexing (when using PostgreSQL)

---

## Security Best Practices

### Already Implemented
- ✅ Session-based authentication
- ✅ HTTP-only cookies
- ✅ Role-based access control
- ✅ Input validation with Zod
- ✅ XSS protection

### Additional Recommendations
- Use HTTPS in production
- Implement CSRF protection
- Add rate limiting
- Set up monitoring
- Regular security audits
- Implement password hashing (bcrypt)
- Add 2FA for admins

---

## Deployment

### Build for Production
```bash
npm run build
```

This creates:
- `dist/` - Server bundle
- `dist/public/` - Client static files

### Deploy to Services

#### Replit
Already configured - just click "Run"

#### Heroku
```bash
heroku create
git push heroku main
```

#### Vercel/Netlify
Use the build output and configure:
- Build command: `npm run build`
- Output directory: `dist`

#### VPS/Cloud Server
```bash
# On server
git clone <repo>
cd HRMasterMind
npm install
npm run build
PORT=5000 npm start

# Use PM2 for process management
pm2 start npm --name "hr-app" -- start
```

---

## Tips and Best Practices

1. **Keep Components Small**: Split large components into smaller ones
2. **Use TypeScript**: Leverage type safety
3. **Error Handling**: Always handle errors gracefully
4. **Loading States**: Show loading indicators
5. **Responsive Design**: Test on different screen sizes
6. **Accessibility**: Use semantic HTML and ARIA labels
7. **Performance**: Monitor bundle size and load times
8. **Security**: Never commit sensitive data

---

## Getting Help

- Review the code comments
- Check API documentation
- Review design guidelines
- Check console for errors
- Use React DevTools for debugging

---

## Contributing Guidelines

1. Follow existing code style
2. Add TypeScript types
3. Include data-testid for testing
4. Update documentation
5. Test thoroughly
6. Keep commits atomic

---

**Happy Coding! 🚀**
