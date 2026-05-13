# Bakar & Co Business Simulation

A business management simulation game built with **Next.js 14**, **React 18**, and **MongoDB**. Players manage a manufacturing company by making quarterly decisions on pricing, production, personnel, marketing, and finance to maximize share price.

---

## Summary

This is an interactive business simulation where users run a virtual company called "Bakar & Co." Each quarter, users make strategic decisions that affect production, sales, and profitability. The simulation engine processes these decisions and generates detailed management reports including profit & loss statements, balance sheets, and performance metrics.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| React 18 | Frontend UI |
| MongoDB + Mongoose | Database storage |
| Tailwind CSS | Styling |
| React Toastify | Notifications |

---

## Project Structure

```
├── app/
│   ├── page.jsx              # Main page with navigation
│   ├── layout.jsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/                  # API Routes
│       ├── submit/route.js   # Process and save decisions
│       ├── quarters/route.js # Get all quarters
│       ├── defaults/route.js # Get default values
│       ├── reset/route.js    # Reset simulation
│       └── seed/route.js     # Load seed data
│
├── components/
│   ├── Dashboard.jsx         # Home screen with quarter history
│   ├── DecisionForm.jsx      # Input form for quarterly decisions
│   └── ManagementReport.jsx  # Results display after submission
│
├── lib/
│   ├── api.js                # Frontend API helper functions
│   ├── db.js                 # MongoDB connection handler
│   ├── models/
│   │   └── QuarterData.js    # Mongoose schema for quarter data
│   └── services/
│       ├── simulationEngine.js # Core calculation engine
│       └── tables.js         # Constants and parameters
```

---

## How It Works

### 1. Dashboard
- Shows simulation history (all processed quarters)
- Displays key metrics: share price, net profit, cash position
- Allows switching between different groups/companies
- Buttons to **Reset** (clear all data) or **Seed** (load sample data)

### 2. Decision Form
Users input decisions across these categories:

| Category | Decisions |
|----------|-----------|
| **Marketing** | Prices (export/home), advertising (trade press, TV, merchandising) |
| **Sales** | Salespeople allocation per region, salary & commission rates |
| **Production** | Delivery schedule per product per region, assembly time |
| **Operations** | Shift level (1-3), maintenance hours, machines to buy/sell |
| **Personnel** | Recruit/dismiss/train salespeople & assembly workers |
| **Materials** | Units to order, supplier selection, number of deliveries |
| **Finance** | Management budget, dividend rate, R&D expenditure |
| **Vehicles** | Vans to buy/sell |

### 3. Simulation Engine
When decisions are submitted, the engine (`simulationEngine.js`) calculates:

1. **Machine Capacity** - Available hours based on machines, shift level, breakdowns
2. **Assembly Hours** - Worker availability minus absenteeism
3. **Production** - Units produced based on capacity constraints
4. **Quality** - Rejection rates based on assembly time
5. **Orders** - Market demand based on price, advertising, salesforce, R&D
6. **Sales** - Fulfillment from production + existing stock
7. **Revenue** - Sales × prices + scrap value
8. **Costs** - Materials, wages, overheads, depreciation
9. **Profit & Loss** - Gross profit, net profit, dividends
10. **Balance Sheet** - Assets, liabilities, reserves
11. **Share Price** - Calculated from earnings and dividends

### 4. Management Report
After processing, displays:
- Production statistics (scheduled, produced, rejected)
- Sales by region (export, south, west, north)
- Personnel summary
- Profit & Loss statement
- Balance Sheet
- Cash Flow statement
- Share price

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/quarters` | Get all quarters for a company |
| `GET` | `/api/quarters/latest` | Get most recent quarter |
| `GET` | `/api/quarters/[year]/[quarter]` | Get specific quarter |
| `DELETE` | `/api/quarters/[year]/[quarter]` | Delete a quarter |
| `GET` | `/api/defaults` | Get default decision values |
| `POST` | `/api/submit` | Submit decisions and process |
| `POST` | `/api/reset` | Reset all data for a company |
| `POST` | `/api/seed` | Load sample seed data |

**Query Parameters:** `groupNumber`, `companyNumber`, `numProducts`

---

## Database Schema

Each quarter stores:
- **Identification**: year, quarter, groupNumber, companyNumber
- **Decisions**: All user inputs (prices, production, personnel, etc.)
- **Results**: Calculated outputs (machines, production, sales, P&L, balance sheet)
- **isProcessed**: Boolean flag for processed quarters

---

## Key Formulas

| Metric | Calculation |
|--------|-------------|
| **Orders** | `baseMarket × priceEffect × adEffect × salesEffect × qualityEffect × season` |
| **Machine Hours** | `machines × hoursPerShift - breakdowns` |
| **Production** | `min(scheduled × capacityRatio)` constrained by machines, assembly, materials |
| **Gross Profit** | `salesRevenue - costOfSales` |
| **Net Profit** | `grossProfit + interest - overheads - depreciation - tax` |
| **Share Price** | Based on EPS (earnings per share) and dividend yield |

---

## Configuration

Simulation parameters are in `lib/services/tables.js`:
- Product specifications (machine time, material content, base prices)
- Personnel costs (recruit, dismiss, train)
- Depreciation rates
- Transport costs
- Maintenance rates
- Finance rates (interest, tax)

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database

### Installation

```bash
# Install dependencies
npm install

# Create .env.local file
MONGODB_URI=your_mongodb_connection_string

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### First Run
1. Open `http://localhost:3000`
2. Click **Seed Database** to load sample data
3. Click **New Decision** to enter your first quarter decisions
4. Submit and view the Management Report

---

## Game Objective

Maximize your **share price** by:
- Balancing production capacity with market demand
- Setting competitive prices
- Investing in advertising and R&D
- Managing personnel efficiently
- Controlling costs and cash flow
- Paying appropriate dividends

---

## Products

The simulation supports 1-8 products with varying complexity:

| Product | Machine Time | Material | Base Price |
|---------|--------------|----------|------------|
| 1 | 1.0 hrs | 1 unit | £170 |
| 2 | 1.5 hrs | 2 units | £290 |
| 3 | 3.0 hrs | 4 units | £580 |
| 4-8 | Progressive | Progressive | Progressive |

---

## Markets

Four sales regions with different characteristics:
- **Export** - Largest market, higher prices
- **South** - Domestic region
- **West** - Domestic region  
- **North** - Domestic region

---

## Tips

1. **Don't overproduce** - Unsold stock ties up cash
2. **Watch cash flow** - Overdrafts cost interest
3. **Invest in quality** - Higher assembly time = fewer rejects
4. **Balance advertising** - Diminishing returns at high spend
5. **Maintain machines** - Reduces breakdown time
6. **Train workers** - Reduces turnover

---

## License

Based on the TOPAZ business simulation by Edit Systems Ltd.
# shehriyar-app
# shehriyar-app
