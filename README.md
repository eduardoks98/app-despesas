# 💰 App Despesas - Freemium Financial Management Platform

A modern, comprehensive financial management platform with mobile-first design and premium web features. Built with React Native, Next.js, Node.js, and MySQL.

## 🚀 Features

### 📱 Mobile App (Free Tier)
- ✅ **Transaction Management**: Add, edit, and categorize income/expenses
- ✅ **Basic Analytics**: Simple charts and summaries
- ✅ **Category System**: 5 predefined categories
- ✅ **Local Storage**: Offline-first approach
- ✅ **Export Basic**: CSV export functionality
- ✅ **Monthly Limits**: Up to 100 transactions per month

### 🌐 Web App (Premium Tier)
- ⭐ **Unlimited Transactions**: No monthly limits
- ⭐ **Advanced Analytics**: AI-powered insights and predictions
- ⭐ **Custom Categories**: Create unlimited categories with icons
- ⭐ **Cloud Sync**: Real-time synchronization across devices
- ⭐ **Advanced Reports**: PDF/Excel exports with detailed analytics
- ⭐ **Tags & Notes**: Rich transaction metadata
- ⭐ **Goals Tracking**: Financial goals with progress monitoring
- ⭐ **Premium Support**: Priority customer support

## 🏗️ Architecture

### Tech Stack
- **Frontend Web**: Next.js 14, TypeScript, TailwindCSS, Chart.js
- **Frontend Mobile**: React Native, Expo
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL 8.0
- **Cache**: Redis
- **Infrastructure**: Docker, Nginx
- **Monitoring**: Prometheus, Grafana, Loki
- **CI/CD**: GitHub Actions

### Project Structure
```
app-despesas/
├── apps/
│   ├── mobile/          # React Native mobile app
│   ├── web/             # Next.js web application
│   └── api/             # Express.js API server
├── monitoring/          # Monitoring stack configuration
├── nginx/              # Nginx reverse proxy config
├── scripts/            # Deployment scripts
├── docker-compose.yml  # Main application stack
└── Dockerfile         # Multi-stage Docker build
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-username/app-despesas.git
cd app-despesas
```

### 2. Environment Setup
```bash
# Copy environment variables
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

### 3. Start Development Environment
```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

### 4. Production Deployment
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy application
./scripts/deploy.sh deploy
```

## 📊 Available Scripts

### Development
```bash
npm run dev              # Start all development servers
npm run dev:web          # Start web app only
npm run dev:mobile       # Start mobile app only
npm run dev:api          # Start API server only
```

### Building
```bash
npm run build            # Build all applications
npm run build:web        # Build web app
npm run build:api        # Build API server
npm run build:mobile     # Build mobile app
```

### Testing
```bash
npm run test             # Run all tests
npm run test:unit        # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:mobile      # Run mobile tests
```

### Quality Assurance
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript checking
npm run format           # Prettier formatting
```

### Database
```bash
npm run migrate          # Run database migrations
npm run seed             # Seed database with sample data
npm run db:reset         # Reset database
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Build and deploy
./scripts/deploy.sh deploy

# Check status
./scripts/deploy.sh status

# View logs
./scripts/deploy.sh logs

# Stop services
./scripts/deploy.sh stop
```

### Monitoring Stack
```bash
# Start monitoring services
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# Access Grafana: http://localhost:3333
# Access Prometheus: http://localhost:9090
# Access Kibana: http://localhost:5601
```

## 🔧 Configuration

### Environment Variables
Key environment variables (see `.env.example` for complete list):

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=app_despesas
DB_USER=despesas_user
DB_PASSWORD=userpassword

# JWT Security
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Payment Integration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Feature Flags
ENABLE_PREMIUM_FEATURES=true
ENABLE_REGISTRATION=true
```

### Database Schema
The application uses a MySQL database with the following key tables:
- `users` - User accounts and subscription status
- `transactions` - Financial transactions
- `categories` - Transaction categories
- `user_subscriptions` - Premium subscription management
- `sync_logs` - Cross-device synchronization logs

## 🎯 Roadmap

### ✅ Phase 1: Mobile Foundation (Completed)
- Basic transaction management
- Local storage
- Simple analytics
- Category system

### ✅ Phase 2: Premium Mobile Features (Completed)
- Cloud backup service
- Advanced reports
- Custom categories
- Transaction tags
- Export functionality

### ✅ Phase 3: Web Application (Completed)
- Next.js web platform
- Advanced analytics
- Premium dashboard
- Upgrade system

### ✅ Phase 4: Production Ready (Completed)
- Docker containerization
- CI/CD pipeline
- Monitoring stack
- Performance optimization

### 🚧 Phase 5: Monetization (In Progress)
- Stripe payment integration
- Subscription management
- Usage analytics
- A/B testing

### 🔮 Phase 6: Advanced Features (Planned)
- AI-powered insights
- Collaborative budgeting
- Banking integration
- Investment tracking

## 📈 Performance

### Web Vitals Targets
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **Performance Score**: > 80

### Optimization Features
- Advanced code splitting
- Image optimization
- Service Worker caching
- Bundle size optimization
- Database query optimization

## 🛡️ Security

### Security Features
- JWT-based authentication
- Rate limiting
- CORS protection
- SQL injection prevention
- XSS protection
- CSRF tokens
- Secure headers

### Data Protection
- Encryption at rest
- Secure transmission (HTTPS)
- Data anonymization
- GDPR compliance ready
- Regular security audits

## 📱 Mobile Development

### Setup React Native Environment
```bash
# Install Expo CLI
npm install -g @expo/cli

# Start mobile development
cd apps/mobile
npm run start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Building Mobile Apps
```bash
# Build for production
npm run build:android
npm run build:ios

# Generate APK
npm run build:apk
```

## 🌐 Web Development

### Next.js Features
- App Router
- Server-side rendering
- Static site generation
- API routes
- Middleware
- Progressive Web App (PWA)

### Component Library
The web app includes a comprehensive design system:
- Buttons, Cards, Inputs
- Modals, Badges, Loading states
- Chart components
- Layout components

## 🔄 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/refresh      # Token refresh
POST /api/auth/logout       # User logout
```

### Transaction Endpoints
```
GET    /api/transactions         # Get transactions
POST   /api/transactions         # Create transaction
PUT    /api/transactions/:id     # Update transaction
DELETE /api/transactions/:id     # Delete transaction
```

### Premium Endpoints
```
GET    /api/premium/reports      # Advanced reports
GET    /api/premium/analytics    # Analytics data
POST   /api/premium/export       # Export data
GET    /api/premium/sync         # Sync status
```

## 🧪 Testing

### Test Coverage
- Unit tests: Jest + React Testing Library
- E2E tests: Playwright
- Mobile tests: Detox
- API tests: Supertest
- Performance tests: Lighthouse CI

### Running Tests
```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Mobile tests
npm run test:mobile

# API tests
npm run test:api

# Performance tests
npm run test:performance
```

## 📊 Monitoring & Analytics

### Metrics Collection
- Application performance metrics
- User behavior analytics
- Error tracking
- Business metrics
- Infrastructure monitoring

### Available Dashboards
- Application Performance
- User Engagement
- Financial Metrics
- System Health
- Error Rates

## 🤝 Contributing

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run quality checks
6. Submit a pull request

### Code Style
- TypeScript for type safety
- ESLint + Prettier for formatting
- Conventional commits
- Comprehensive testing
- Documentation updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Community Support
- GitHub Issues: Report bugs and request features
- Documentation: Comprehensive guides and API docs
- Examples: Sample implementations and use cases

### Premium Support
Premium subscribers get:
- Priority issue resolution
- Direct email support
- Phone support
- Custom implementation assistance

## 🎉 Acknowledgments

- React Native community
- Next.js team
- Chart.js contributors
- TailwindCSS team
- Docker community

---

Built with ❤️ by the App Despesas Team