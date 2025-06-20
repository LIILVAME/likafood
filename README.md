# LikaFood MVP - Food Vendor Management PWA

A mobile-first Progressive Web App (PWA) designed to help informal food vendors manage their business efficiently. Built with React and optimized for low-end mobile devices.

## 🚀 Features

### For Vendors
- **Dashboard**: Daily metrics including orders, sales, profit, and pending orders
- **Order Management**: Track current orders, view history, and add new orders
- **Menu Catalog**: Add, update, remove dishes and manage availability
- **Expense Tracking**: Categorize and track business expenses
- **Business Settings**: Manage profile, business hours, and branding
- **Phone + OTP Authentication**: Secure login without passwords

### Technical Features
- **Mobile-First Design**: Optimized for smartphones and low-end devices
- **Progressive Web App**: Installable, works offline, fast loading
- **Responsive UI**: Built with Tailwind CSS for consistent design
- **Mock Data Support**: Fallback when backend is unavailable
- **Local Storage**: Persistent user sessions

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router DOM
- **Styling**: Tailwind CSS with custom configuration
- **HTTP Client**: Axios with interceptors
- **Authentication**: Phone + OTP (no passwords)
- **State Management**: React Context API
- **Build Tool**: Create React App
- **PWA**: Service Worker, Web App Manifest

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.js       # Main layout with navigation
├── pages/              # Route-based screen components
│   ├── Login.js        # Phone + OTP authentication
│   ├── Home.js         # Dashboard with metrics
│   ├── Orders.js       # Order management
│   ├── Catalog.js      # Menu management
│   ├── Expenses.js     # Expense tracking
│   └── Settings.js     # Profile and business settings
├── services/           # API and business logic
│   ├── AuthContext.js  # Authentication context
│   ├── authService.js  # Auth API calls
│   ├── apiService.js   # HTTP client with interceptors
│   └── mockDataService.js # Mock data fallback
└── utils/              # Helper functions and formatters
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd likafood-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_USE_MOCK_DATA=true
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The build folder will contain the optimized production files.

## 📱 PWA Installation

The app can be installed on mobile devices:

1. Open the app in a mobile browser
2. Look for "Add to Home Screen" prompt
3. Follow the installation steps
4. Launch from home screen like a native app

## 🔧 Configuration

### Environment Variables

- `REACT_APP_API_URL`: Backend API base URL
- `REACT_APP_USE_MOCK_DATA`: Enable mock data fallback (true/false)

### Tailwind Configuration

Custom colors and spacing are defined in `tailwind.config.js`:

- **Primary Colors**: Orange theme (#EA580C, #FB923C, #FED7AA)
- **Secondary Colors**: Gray theme (#374151, #6B7280, #F3F4F6)
- **Font**: Inter from Google Fonts
- **Mobile-first**: Responsive breakpoints optimized for mobile

## 🎨 Design System

### Colors
- **Primary**: Orange (#EA580C) - Call-to-action buttons, active states
- **Secondary**: Gray (#374151) - Text, borders, backgrounds
- **Success**: Green - Success messages, positive metrics
- **Warning**: Yellow - Warnings, pending states
- **Error**: Red - Error messages, destructive actions

### Typography
- **Font Family**: Inter (Google Fonts)
- **Sizes**: Responsive text sizing with mobile-first approach
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Components
- **Buttons**: Primary, secondary, and danger variants
- **Cards**: Consistent spacing and shadows
- **Forms**: Accessible input fields with validation
- **Navigation**: Bottom tab bar for mobile

## 🔐 Authentication

The app uses phone number + OTP authentication:

1. **Phone Entry**: User enters phone number
2. **OTP Request**: System sends verification code
3. **OTP Verification**: User enters received code
4. **Session**: JWT token stored in localStorage

### Mock Authentication

For development, use these test credentials:
- **Phone**: Any 10-digit number
- **OTP**: `123456`

## 📊 Data Management

### API Integration

The app communicates with a REST API:

- **Base URL**: Configured via environment variables
- **Authentication**: Bearer token in headers
- **Error Handling**: Automatic retry and fallback to mock data

### Mock Data

When the backend is unavailable, the app uses mock data:

- **Users**: Sample vendor profiles
- **Dishes**: Menu items with prices and categories
- **Orders**: Sample orders with different statuses
- **Expenses**: Business expense records
- **Metrics**: Daily sales and profit data

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

## 📱 Mobile Optimization

### Performance
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Responsive images with proper sizing
- **Bundle Splitting**: Separate chunks for better caching
- **Service Worker**: Caching for offline functionality

### UX Considerations
- **Touch Targets**: Minimum 44px for easy tapping
- **Safe Areas**: Proper padding for notched devices
- **Loading States**: Clear feedback during operations
- **Error Handling**: Graceful degradation when offline

## 🔧 Development Guidelines

### Code Style
- **ES6+**: Modern JavaScript features
- **Functional Components**: React hooks over class components
- **Modular**: Separate concerns (UI, logic, data)
- **Accessible**: ARIA labels and semantic HTML

### File Naming
- **Components**: PascalCase (e.g., `UserProfile.js`)
- **Services**: camelCase (e.g., `authService.js`)
- **Pages**: PascalCase (e.g., `Dashboard.js`)
- **Utilities**: camelCase (e.g., `formatCurrency.js`)

### Git Workflow
- **Branches**: Feature branches from main
- **Commits**: Conventional commit messages
- **PRs**: Code review required
- **Testing**: All tests must pass

## 🚀 Deployment

### Render (Recommended)

1. Connect your repository to Render
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Configure environment variables
5. Deploy automatically on push

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the setup prompts
4. Configure environment variables

### Manual Deployment

1. Build the project: `npm run build`
2. Upload `build/` folder to your web server
3. Configure server for SPA routing
4. Set up HTTPS for PWA features

Consultez le [Guide de Déploiement Render + Vercel](RENDER_VERCEL_DEPLOYMENT.md) pour plus de détails.

## 🐛 Troubleshooting

### Common Issues

**App won't start**
- Check Node.js version (v14+)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall

**PWA not installing**
- Ensure HTTPS is enabled
- Check manifest.json is accessible
- Verify service worker registration

**API calls failing**
- Check environment variables
- Verify backend is running
- Enable mock data for testing

**Styling issues**
- Clear browser cache
- Check Tailwind CSS compilation
- Verify custom CSS imports

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**LikaFood MVP** - Empowering informal food vendors with digital tools 🍽️📱