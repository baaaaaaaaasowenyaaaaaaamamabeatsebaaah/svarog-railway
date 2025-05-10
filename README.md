# Svarog UI - Component Library Template

A vanilla JavaScript component library with Storyblok CMS integration and theme system.

## 🚀 Features

- 🛠️ **Pure vanilla JavaScript** - No framework dependencies
- 🎨 **Theming system** - CSS variables for consistent styling
- 📱 **Responsive components** - Mobile-first design approach
- 💻 **Storyblok CMS integration** - For content management
- 🧩 **Component-based architecture** - For reusability
- 🌐 **SPA navigation** - For smooth user experience
- 📦 **Railway deployment ready** - Easy deployment setup

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Storyblok account (optional, for CMS features)

## 🛠️ Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/svarog-ui-template.git my-project
   cd my-project
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your Storyblok credentials
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

5. Build for production:

   ```bash
   npm run build
   ```

6. Start production server:
   ```bash
   npm start
   ```

## 🏗️ Project Structure

```
svarog-ui/
├── public/                  # Static assets
├── src/
│   ├── cms/                # CMS integration
│   │   └── storyblok.js    # Storyblok client setup
│   ├── utils/              # Utility functions
│   │   ├── componentRenderer.js  # Component renderer
│   │   ├── i18n.js         # Internationalization
│   │   └── theme.js        # Theme management
│   ├── index.js            # Application entry point
│   └── styles.css          # Global styles & themes
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
├── server.js               # Express server for production
├── webpack.config.cjs      # Webpack configuration
└── README.md               # Project documentation
```

## 🎨 Theming System

Svarog uses a CSS variable-based theme system with three themes included:

- `default-theme` - Blue primary colors
- `cabalou-theme` - Green/purple color scheme
- `muchandy-theme` - Orange/blue color scheme

To switch themes:

```javascript
import { themeManager } from './src/utils/theme';
themeManager.switchTheme('cabalou-theme');
```

To add new themes, edit the `src/styles.css` file and register the theme in `src/utils/theme.js`.

## 🔄 Storyblok Integration

This template includes a complete Storyblok CMS integration. To use it:

1. Create a Storyblok account and space
2. Add your API keys to the `.env` file
3. Create a "Config" content type with fields for site configuration

### Example Storyblok Schema

```
Config
├── SiteName (text)
├── SiteDescription (text)
├── Logo (asset)
├── PrimaryNavigation (blocks)
│   └── NavigationItem (component)
│       ├── Label (text)
│       └── URL (link)
├── FooterNavigation (blocks)
│   └── NavigationItem (component)
├── SocialLinks (blocks)
│   └── SocialLink (component)
└── Theme (select: default-theme, cabalou-theme, muchandy-theme)
```

## 🚂 Railway Deployment

This project is preconfigured for easy deployment on Railway:

1. Create a new project on Railway
2. Connect your GitHub repository
3. Set the required environment variables
4. Deploy

## 🧩 Component Development

To create new components following the Svarog pattern:

1. Create a component class that extends from Component base class
2. Implement the required `getElement()` method
3. Register theme variables in the CSS

Example component:

```javascript
// src/components/MyComponent/MyComponent.js
import './MyComponent.css';

export default class MyComponent {
  constructor(props) {
    this.props = props;
    this.element = this.createComponentElement();
  }

  createComponentElement() {
    const element = document.createElement('div');
    element.className = 'my-component';

    // Your component logic here

    return element;
  }

  getElement() {
    return this.element;
  }
}
```

## 📚 Documentation

For more detailed documentation, refer to:

- [Storyblok API Documentation](https://www.storyblok.com/docs/api/content-delivery)
- [Railway Documentation](https://docs.railway.app/)
- [Webpack Documentation](https://webpack.js.org/concepts/)

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
