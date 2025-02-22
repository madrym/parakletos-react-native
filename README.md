# Parakletos React Native App

A React Native application with Convex backend for note-taking and Bible verse integration.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Convex CLI (`npm install -g convex`)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/madrym/parakletos-react-native.git
cd parakletos-react-native
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up Convex:
   - Create a Convex account at [https://dashboard.convex.dev](https://dashboard.convex.dev)
   - Create a new project in the Convex dashboard
   - Copy your deployment URL
   - Create a `.env` file in the root directory and add:
```bash
CONVEX_URL=your_deployment_url_here
```

## Running the Development Environment

1. Start the Convex development server:
```bash
npx convex dev
```

2. In a new terminal, start the Expo development server:
```bash
npx expo start
```

3. Choose your preferred way to run the app:
   - Press `i` to open in iOS simulator
   - Press `a` to open in Android emulator
   - Scan the QR code with your phone's camera to open in Expo Go app

## Project Structure

- `/app` - Main application code
- `/components` - Reusable React components
- `/convex` - Convex backend code and mutations
- `/assets` - Static assets like images and fonts

## Features

- Note-taking with rich text editing
- Bible verse integration
- Tag management
- Folder organization
- Real-time updates via Convex

## Development Notes

- The app uses Expo Router for navigation
- Rich text editing is handled by `react-native-pell-rich-editor`
- Bible verse data is managed through Convex backend
- Authentication is handled by Clerk

## Troubleshooting

If you encounter any issues:

1. Make sure all environment variables are properly set
2. Ensure Convex development server is running
3. Try clearing Expo cache:
```bash
expo start -c
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 