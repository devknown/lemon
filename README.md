# 🍋 Lemon LTE Control

A powerful, modern desktop application for managing and monitoring Huawei LTE routers. Built with Electron, React, and TypeScript for a seamless cross-platform experience.

![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)

---

## Features

- Real-Time Monitoring**: Track your LTE connection status, signal strength, and network information in real-time
- Speed Testing**: Built-in Cloudflare speed test integration for testing your connection speed
- Network Management**: Switch between 2G, 3G, 4G, and Auto modes with a single click
- Performance Analytics**: View detailed charts and statistics about your connection performance
- SMS Management**: Send and receive SMS directly from the application
- Device Information**: Display comprehensive device and network band information
- Modern UI**: Clean, intuitive interface built with React and Tailwind CSS
- Secure Authentication**: Simple and secure login interface for router access
- System Management**: Reboot and manage your device directly from the app
- Multi-Language Support**: Flag icons for international connectivity information

---

## Use Cases

- Monitor your mobile data usage and connection quality
- Test internet speeds and troubleshoot connectivity issues
- Switch network modes based on your current needs
- Send SMS messages from your desktop
- Manage multiple Huawei LTE routers from a single application

---

## 📋 Requirements

### For Running

- **Node.js**: v16 or higher
- **npm** or **pnpm**: Latest version recommended
- **Operating System**: Windows, macOS, or Linux
- **Huawei LTE Router**: Any supported Huawei LTE router with web interface access

### For Development

- **Git**: For version control
- **VS Code** or any modern code editor
- **TypeScript Knowledge**: For contributing to the project

---

## Installation

### Binary Installation

Download the latest release from the [Releases](https://github.com/devknown/lemon/releases) page:

- **Windows**: `Lemon-LTE-Control-x.x.x.exe`
- **macOS**: `Lemon-LTE-Control-x.x.x.dmg`
- **Linux**: `Lemon-LTE-Control-x.x.x.AppImage`

### From Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/devknown/lemon.git
   cd lemon
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

---

## Development

### Project Structure

```
lemon/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main entry point
│   │   ├── store.ts       # Persistent storage
│   │   └── huawei-service.ts  # Huawei API integration
│   ├── preload/           # Preload scripts
│   ├── renderer/          # React application
│   │   ├── src/
│   │   │   ├── pages/     # Application pages
│   │   │   ├── components/# Reusable components
│   │   │   ├── lib/       # Utilities & hooks
│   │   │   └── assets/    # Styles & images
├── build/                 # Build configuration
├── resources/             # App resources
└── electron.vite.config.ts # Vite configuration
```

### Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload

# Building
pnpm build           # Build application (typecheck + electron-vite build)
pnpm build:win       # Build Windows executable
pnpm build:mac       # Build macOS application
pnpm build:linux     # Build Linux AppImage

# Code Quality
pnpm lint            # Run ESLint
pnpm format          # Format code with Prettier
pnpm typecheck       # Run TypeScript type checking
```

### Technology Stack

- **Electron**: Cross-platform desktop framework
- **React**: UI library (v19)
- **TypeScript**: Type-safe JavaScript
- **Vite**: Next-generation build tool
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Recharts/Chart.js**: Data visualization
- **Zustand**: State management
- **React Router**: Client-side routing
- **Electron Store**: Persistent local storage

---

## Building

### Build for Current Platform

```bash
pnpm build
```

### Build for Specific Platform

```bash
# Windows
pnpm build:win

# macOS (requires macOS to build)
pnpm build:mac

# Linux
pnpm build:linux

# Development build (without code signing)
pnpm build:unpack
```

Build artifacts will be created in the `dist/` directory.

---

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   pnpm lint
   pnpm typecheck
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add your feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Code Style

- **Prettier**: Automatic code formatting
- **ESLint**: Code quality and style rules
- **TypeScript**: Strict type checking

Format your code before committing:
```bash
pnpm format
```

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Community & Support

- **Website**: [devknown.com](https://devknown.com)
- **Issues**: [GitHub Issues](https://github.com/devknown/lemon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/devknown/lemon/discussions)

---

## Troubleshooting

### Cannot connect to router

1. Ensure the router is powered on and accessible
2. Check that you're using the correct IP address (usually `192.168.1.1`)
3. Verify your credentials are correct
4. Try pinging the router: `ping 192.168.1.1`

### Speed test not working

1. Check your internet connection
2. Ensure Cloudflare Speedtest servers are accessible from your location
3. Try disabling any VPN or proxy services

### Application won't start

1. Clear the application cache: Remove `~/.lemon` directory
2. Reinstall the application
3. Check system logs for error messages

---

## Credits

**Developer**: [Devknown](https://devknown.com)

Built with ❤️ for the open-source community.
