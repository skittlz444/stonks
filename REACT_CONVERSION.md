# React Conversion Guide

## Overview

This document outlines the approach for converting the Stonks Portfolio application from vanilla JavaScript to TypeScript React while maintaining all existing functionality and test coverage.

## Architecture

### Current Architecture
- Cloudflare Worker handles routing and serves HTML pages
- Server-side rendering for chart pages (ticker, chartGrid, chartLarge, chartAdvanced)
- Hybrid approach for prices and config pages:
  - Server generates skeleton HTML with loading states
  - Client-side JavaScript (public/client/*.js) fetches data from API endpoints
  - Dynamic rendering happens in browser

### Target Architecture
- Cloudflare Worker continues to handle routing and API endpoints
- Server-side still generates initial HTML shells
- React components replace vanilla JavaScript for client-side rendering
- Each page has its own React entry point (not a single SPA)
- TypeScript for type safety throughout

## Conversion Pattern

### 1. Component Structure

Each page follows this structure:
```
src/client/pages/{page-name}/
  ├── index.tsx              # Entry point, renders root component
  ├── {Page}Component.tsx    # Main page component
  └── components/            # Page-specific sub-components
```

Shared components:
```
src/client/components/
  ├── common/                # Reusable UI components
  ├── layout/                # Layout components (Header, Nav, Footer)
  └── {feature}/             # Feature-specific components
```

### 2. Utilities and Hooks

```
src/client/
  ├── hooks/                 # Custom React hooks
  │   ├── usePricesData.ts
  │   └── useConfigData.ts
  ├── utils/                 # Utility functions
  │   ├── formatting.ts
  │   └── rebalancing.ts
  └── types/                 # TypeScript type definitions
      └── index.ts
```

### 3. Build Configuration

- **Vite** for building React client code
  - Multiple entry points (one per page)
  - Output: `public/dist/{page-name}.js`
- **Vitest** with React Testing Library for testing
- **TypeScript** for type checking

## Conversion Steps

### Step 1: Setup (✅ Complete)

1. Install dependencies:
   - React, React DOM
   - TypeScript, @types packages
   - Vite, @vitejs/plugin-react
   - Testing Library packages

2. Configure build tools:
   - `tsconfig.json` - TypeScript compiler options
   - `vite.config.ts` - Vite build configuration
   - `vitest.config.ts` - Test configuration

3. Create type definitions:
   - Define interfaces for all data structures
   - Export from `src/client/types/index.ts`

### Step 2: Create Utilities and Hooks

1. **Formatting utilities** (`src/client/utils/formatting.ts`):
   ```typescript
   export function formatCurrency(amount: number, decimals: number = 2): string
   export function getCurrencySymbol(currency: string): string
   export function formatPercent(value: number, decimals: number = 2): string
   ```

2. **Data hooks** (`src/client/hooks/usePricesData.ts`):
   ```typescript
   export function usePricesData(rebalanceMode: boolean, currency: string): {
     data: PricesData | null;
     loading: boolean;
     error: string | null;
   }
   ```

3. **Business logic** (`src/client/utils/rebalancing.ts`):
   ```typescript
   export function calculateRebalancing(
     holdings: HoldingWithQuote[],
     cashAmount: number,
     portfolioTotal: number
   ): RebalanceData
   ```

### Step 3: Create Common Components

1. **LoadingSpinner** - Shows loading state
2. **ErrorMessage** - Shows error state
3. **Navigation** - Top navigation bar
4. **Modal** - Reusable modal wrapper

### Step 4: Convert Page Components

For each page (starting with Prices page):

1. **Identify sections** to convert into components:
   - Summary cards
   - Data tables
   - Forms and inputs
   - Modals

2. **Create React components** for each section:
   ```typescript
   interface SummaryCardsProps {
     portfolioTotal: number;
     // ... other props
   }
   
   export const SummaryCards: React.FC<SummaryCardsProps> = (props) => {
     // Component logic
     return <div>...</div>;
   };
   ```

3. **Extract business logic** into hooks or utility functions

4. **Write tests** for each component:
   ```typescript
   describe('SummaryCards', () => {
     test('should render portfolio value card', () => {
       render(<SummaryCards {...defaultProps} />);
       expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
     });
   });
   ```

5. **Integrate components** into page component:
   ```typescript
   const PricesPage: React.FC = () => {
     const { data, loading, error } = usePricesData(rebalanceMode, currency);
     
     if (loading) return <LoadingSpinner />;
     if (error) return <ErrorMessage message={error} />;
     
     return (
       <div>
         <Navigation />
         <SummaryCards {...summaryProps} />
         <HoldingsTable {...tableProps} />
       </div>
     );
   };
   ```

6. **Update server wrapper** to load React bundle:
   ```javascript
   // In pricesClientWrapper.js or equivalent
   <div id="root"></div>
   <script type="module" src="/stonks/dist/prices.js"></script>
   ```

### Step 5: Testing Strategy

1. **Component tests** - Test each React component in isolation
2. **Integration tests** - Test page-level component integration
3. **API tests** - Keep existing API endpoint tests
4. **E2E considerations** - Document any E2E test updates needed

Test file structure mirrors component structure:
```
test/client/
  ├── components/
  │   ├── common/
  │   │   └── LoadingSpinner.test.tsx
  │   └── prices/
  │       └── SummaryCards.test.tsx
  ├── hooks/
  │   └── usePricesData.test.tsx
  └── utils/
      └── rebalancing.test.tsx
```

## Proof of Concept: SummaryCards Component

### Before (Vanilla JS)
```javascript
function renderSummaryCards(params) {
  const { portfolioTotal, totalMarketValue, ... } = params;
  
  let html = `
    <div class="col-6 col-md-2">
      <div class="card bg-primary text-white h-100">
        <div class="card-body">
          <h6>Portfolio Value</h6>
          <h3>${formatCurrency(convert(portfolioTotal))}</h3>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('summary-cards').innerHTML = html;
}
```

### After (React + TypeScript)
```typescript
interface SummaryCardsProps {
  portfolioTotal: number;
  totalMarketValue: number;
  currency: string;
  // ... other props with types
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  portfolioTotal,
  totalMarketValue,
  currency,
}) => {
  return (
    <div className="row g-3 mb-4" id="summary-cards">
      <div className="col-6 col-md-2">
        <div className="card bg-primary text-white h-100">
          <div className="card-body" style={{ minHeight: '100px' }}>
            <h6 className="card-subtitle mb-2">Portfolio Value</h6>
            <h3 className="card-title mb-0">{formatCurrency(convert(portfolioTotal))}</h3>
          </div>
        </div>
      </div>
      {/* More cards... */}
    </div>
  );
};
```

### Benefits
- **Type Safety**: Props are typed, catching errors at compile time
- **Reusability**: Component can be easily reused
- **Testability**: Easy to test in isolation
- **Maintainability**: Clear component boundaries and props
- **React Best Practices**: Declarative, component-based architecture

## Current Progress

### ✅ Completed
- Infrastructure setup (TypeScript, React, Vite, testing)
- Type definitions for all data structures
- Utility functions (formatting, rebalancing calculations)
- Custom hooks (usePricesData)
- Common components (LoadingSpinner, ErrorMessage)
- SummaryCards component (full conversion)
- Component tests (12 tests for SummaryCards)
- All 449 tests passing (437 original + 12 new)

### 🔄 In Progress
- Converting remaining Prices page components

### 📋 Remaining
- Complete Prices page conversion
- Convert Config page
- Convert chart pages (Ticker, ChartGrid, ChartLarge, ChartAdvanced)
- Convert server-side code to TypeScript
- Update all documentation

## Development Workflow

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npx vitest run test/client/components/prices/SummaryCards.test.tsx

# Watch mode
npm run test:watch
```

### Building React Code
```bash
# Build all client-side React bundles
npm run build:client

# Development mode (with hot reload)
npm run dev:client
```

### Type Checking
```bash
# Check TypeScript types
npx tsc --noEmit
```

## Best Practices

1. **Keep components small and focused** - Each component should do one thing well
2. **Use TypeScript strictly** - Avoid `any`, define proper interfaces
3. **Test every component** - Maintain >80% code coverage
4. **Preserve existing functionality** - Don't change behavior, only implementation
5. **Follow React conventions** - Use hooks, functional components, proper state management
6. **Maintain Bootstrap styling** - Keep all existing CSS classes and styling
7. **Document as you go** - Update documentation alongside code changes

## Migration Checklist for Each Page

- [ ] Identify all sections/functions in vanilla JS code
- [ ] Create corresponding React components
- [ ] Extract business logic into hooks/utils
- [ ] Write component tests
- [ ] Integrate components into page component
- [ ] Test full page functionality
- [ ] Update server wrapper to load React bundle
- [ ] Update documentation
- [ ] Verify all existing functionality works
- [ ] Ensure all tests pass

## Notes

- Server-side code (API endpoints, database service, etc.) remains unchanged initially
- Cloudflare Worker routing and API structure stays the same
- Each page is an independent React app, not a single SPA
- Bootstrap CSS continues to be loaded via CDN
- All existing styling and functionality must be preserved
- Test count should increase as we add React component tests
