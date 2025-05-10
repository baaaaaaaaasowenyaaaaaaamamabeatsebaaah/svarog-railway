# Svarog UI with Storyblok

This project integrates Svarog UI components with Storyblok CMS to create a modern, component-based website.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Storyblok account with an API token

## Project Structure

```
├── lib/                     # Local dependencies
│   └── svarog-ui/           # Svarog UI library
├── public/                  # Static assets
├── src/
│   ├── cms/                 # CMS integration
│   │   ├── schema.js        # Storyblok schema validation
│   │   ├── storyblok.js     # Storyblok API client
│   │   └── storyblok-integration.js # Integration with Svarog
│   ├── components/          # Component adapters
│   │   ├── base/            # Base adapter classes
│   │   ├── contact/         # Contact components
│   │   ├── header/          # Header components
│   │   ├── navigation/      # Navigation components
│   │   ├── loader.js        # Component loader
│   │   └── registry.js      # Component registry
│   ├── utils/               # Utility functions
│   ├── app.js               # Main application
│   ├── index.js             # Entry point
│   └── styles.css           # Global styles
├── .env.example             # Example environment variables
├── package.json             # Project dependencies and scripts
├── server.js                # Express server for production
└── webpack.config.cjs       # Webpack configuration
```

## Installation

1. Clone this repository

   ```
   git clone <repository-url>
   cd svarog-storyblok
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Add Svarog UI library to the lib directory

   ```
   mkdir -p lib/svarog-ui
   # Copy Svarog UI files into lib/svarog-ui
   ```

4. Create a `.env` file from `.env.example`

   ```
   cp .env.example .env
   ```

5. Update the `.env` file with your Storyblok tokens and space ID.

## Development

Start the development server:

```
npm run dev
```

This will start a development server on http://localhost:3000.

## Building for Production

Build the project for production:

```
npm run build
```

The build output will be in the `dist` directory.

## Deployment

Deploy to Railway:

1. Connect your repository to Railway
2. Set the environment variables in Railway
3. Deploy the project

## Storyblok Setup

### 1. Create Content Types

#### CollapsibleHeader

- siteName (Text)
- navigation (Block)
- contactInfo (Block)
- logo (Asset)
- compactLogo (Asset)
- collapseThreshold (Number)
- callButtonText (Text)
- showStickyIcons (Boolean)

#### ContactInfo

- location (Text)
- phone (Text)
- email (Text)
- locationId (Text)

#### Navigation

- items (Blocks)

#### NavigationItem

- label (Text)
- href (Link)
- items (Blocks)
- disabled (Boolean)

#### SubNavigationItem

- Label (Text)
- URL (Link)

### 2. Create a Config Entry

Create a "Config" content entry with:

- SiteName
- SiteDescription
- Logo
- Theme
- And include a CollapsibleHeader component in the content

### 3. Create Pages

Create pages with the following structure:

- Home page with slug "home"
- Other pages with appropriate slugs

## Adding New Components

To add new Svarog UI components to the integration:

1. Create a new adapter in the appropriate directory under `src/components/`
2. Update the component registry in `src/components/registry.js`
3. Add schema validation in `src/cms/schema.js`
4. Create the content type in Storyblok

Example adapter:

```javascript
// src/components/custom/ExampleAdapter.js
import ComponentAdapter from '../base/ComponentAdapter.js';

export class ExampleAdapter extends ComponentAdapter {
  transformProps() {
    const data = this.storyblokData;

    return {
      // Map Storyblok data to Svarog props
      title: data.title || '',
      content: data.content || '',
      // Other props...
    };
  }

  createComponent(svarogComponents) {
    const { ExampleComponent } = svarogComponents;
    if (!ExampleComponent) {
      throw new Error('ExampleComponent not found in Svarog UI');
    }

    const props = this.transformProps();
    this.svarogComponent = new ExampleComponent(props);
    return this.svarogComponent;
  }
}
```

Then register it in `registry.js`:

```javascript
// Add to registerAdapters() method
registerAdapters() {
  return {
    // Existing adapters...
    'Example': ExampleAdapter
  };
}
```

## License

This project is licensed under the MIT License.
