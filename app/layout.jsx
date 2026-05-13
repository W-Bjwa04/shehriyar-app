import './globals.css';
import 'react-toastify/dist/ReactToastify.css';

export const metadata = {
  title: 'Topaz VBE Simulation — Business Strategy and Accounting',
  description: 'Topaz VBE Simulation is a professional quarterly business strategy game covering pricing, production, personnel and finance. Generate full P&L, Balance Sheet, Cash Flow, Management Reports and financial ratios (ROCE, EPS, P/E, current ratio, gearing, debtor days, asset turnover, working capital) every quarter.',
  keywords: ['Topaz VBE simulation','business simulation','accounting simulation','quarterly business decisions','management report','profit and loss','balance sheet','cash flow','share price simulation','business strategy game','financial simulation','ROCE return on capital employed','EPS earnings per share','P/E ratio','current ratio','working capital','gearing ratio','debtor days','asset turnover','gross margin','net margin','capacity utilisation','production management','pricing strategy','personnel management','company simulation','accounting education','financial ratio analysis'].join(', '),
  authors: [{ name: 'Topaz VBE Simulation' }],
  creator: 'Topaz VBE Simulation',
  publisher: 'Topaz VBE Simulation',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
  openGraph: { title: 'Topaz VBE Simulation', description: 'Professional quarterly business simulation. Compete across pricing, production, personnel and finance. Get full management reports with ROCE, EPS, P/E, Current Ratio, Gearing, Asset Turnover and more.', type: 'website', locale: 'en_GB', siteName: 'Topaz VBE Simulation' },
  twitter: { card: 'summary_large_image', title: 'Topaz VBE Simulation', description: 'Quarterly business strategy simulation with P&L, Balance Sheet, Cash Flow, share price tracking and 20+ financial ratios.' },
  alternates: { canonical: '/' },
  category: 'education',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Topaz VBE Simulation',
  description: 'A professional quarterly business strategy and accounting simulation. Companies compete by making decisions on pricing, advertising, production, personnel and finance. Full management reports are generated each quarter with financial ratios including ROCE, EPS, P/E, current ratio, gearing and asset turnover.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  featureList: [
    'Quarterly decision submission',
    'Profit and Loss Account',
    'Balance Sheet with current ratio and gearing',
    'Cash Flow Statement',
    'Share price simulation',
    'Market share tracking',
    'Multi-company competition',
    'ROCE, EPS, P/E ratio analysis',
    'Current ratio and working capital monitoring',
    'Debtor days, stock days, creditor days',
    'Capacity utilisation tracking',
    'Financial health grade (A–F)',
    'Management report generation',
    'Multi-quarter analytics charts',
    'Personnel efficiency analysis',
  ],
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the starting share price in Topaz VBE Simulation?',
      acceptedAnswer: { '@type': 'Answer', text: 'The baseline share price in Topaz VBE is 100 pence. A share price above 150p is considered a strong performance target. The simulation issues 2,000,000 shares.' },
    },
    {
      '@type': 'Question',
      name: 'How is gross margin calculated in Topaz VBE?',
      acceptedAnswer: { '@type': 'Answer', text: 'Gross Margin % = (Gross Profit ÷ Sales Revenue) × 100. Gross Profit = Sales Revenue minus Cost of Sales. A gross margin of 40% or above is considered on-target in the simulation.' },
    },
    {
      '@type': 'Question',
      name: 'What is ROCE and why does it matter?',
      acceptedAnswer: { '@type': 'Answer', text: 'ROCE (Return on Capital Employed) = (Net Profit ÷ Net Assets) × 100. It measures how efficiently a company uses its capital to generate profit. A ROCE of 15% or above is considered strong in Topaz VBE.' },
    },
    {
      '@type': 'Question',
      name: 'How is EPS calculated in Topaz VBE Simulation?',
      acceptedAnswer: { '@type': 'Answer', text: 'EPS (Earnings Per Share) = Net Profit ÷ Shares Issued (2,000,000). It is displayed in pence. A higher EPS generally leads to a higher share price.' },
    },
    {
      '@type': 'Question',
      name: 'What is the current ratio and what is a healthy level?',
      acceptedAnswer: { '@type': 'Answer', text: 'Current Ratio = Current Assets ÷ Current Liabilities. Current assets include stock, debtors and cash; current liabilities include creditors, taxation and dividends. A ratio of 1.5 or above is generally considered healthy.' },
    },
    {
      '@type': 'Question',
      name: 'What decisions can I make each quarter in Topaz VBE?',
      acceptedAnswer: { '@type': 'Answer', text: 'Each quarter you set: product prices (home and export markets), advertising spend, production parameters (assembly time, shift level, machines), personnel (recruit/dismiss salespeople and assembly workers, wages), finance (dividend rate, days credit, management budget), and purchase business intelligence.' },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366F1" />
        <meta name="color-scheme" content="light" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <meta name="subject" content="Business Simulation, Accounting Education" />
        <meta name="classification" content="Education, Business, Finance" />
        <meta name="language" content="en-GB" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}