# GrowFolio

## Introduction

[DreamAI](https://dream-ai-omega.vercel.app/) is a dream interpreting web application built with the robust React framework, powered by NextJS and fully implemented in TypeScript. DreamAI offers a seamless and responsive experience across all devices, leveraging cutting-edge technologies for optimal performance and user engagement.

## Technologies Used

- **ReactJS**: [React](https://reactjs.org/) - A JavaScript library for building user interfaces with components, allowing for fast and scalable front-end development.

- **NextJS**: [Vite](https://NextJS.dev/) - A modern frontend build tool that provides a faster and leaner development experience for modern web projects.

- **TypeScript**: [TypeScript](https://www.typescriptlang.org/) - A strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.

- **TailwindCSS**: [TailwindCSS](https://tailwindcss.com/) - A utility-first CSS framework for rapidly building custom designs without leaving your HTML.

- **Shadcn**: [Shadcn UI](https://ui.shadcn.com/) - A React UI library that provides a collection of high-quality components and templates to kickstart your application designs.

- **Google Ai Studio**: [Google/generative-ai](@google/generative-ai) - Google's state-of-the-art generative AI models to build AI-powered features and applications.

- **Supabase**: [Supabase](https://supabase.com/) - Supabase is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade open source tools. Hosted Postgres Database.

- **Vercel**: [Vercel](https://vercel.com/) - A platform for frontend frameworks and static sites, built to integrate with your headless content, commerce, or database.

## Screenshots

<!-- - ###### Home Page - Desktop -->
<!-- ![HomePage Desktop](</src/assets//homepage_desktop.png>) -->

<!-- ## Router Architecture -->

<!-- ![Architecture Diagram](/src/assets//router_diagram.png) -->

## Features

- Responsive layout compatible with various screen sizes.
<!-- - Theming support with Dark and Light mode preferences. -->
- Comprehensive typing with TypeScript for robustness.

## Local Development

To run DreamAI locally:

```bash
git clone git@github.com/ceejeey/DreamAi.git
cd DreamAi
pnpm install
npm run dev
```

## Code Structure

- `components/`: Houses all custom components.
- `components/ui`: Stores core components provided by Shadcn.
- `constants/`: Contains various constants used throughout the application.
  <!-- - `context/`: Includes React context files, particularly for authentication functions. -->
  <!-- - `hooks/`: Comprises all custom and reusable React hooks. -->
- `layouts/`: Contains layout components, like `DashboardLayout` and `UnAuthLayout`.
- `lib/`: Main utility files such as `utils.ts` are found here.
- `app/`: Parent pages that are configured in the router.
<!-- - `types/`: Reusable TypeScript types for the application. -->

<!-- ### Usage Instructions

To begin using our platform, simply enter a valid email address for login; the system will verify the format to ensure it's correct. After logging in, you'll be directed to the homepage, which displays an extensive list of stocks for you to explore.

#### Navigating Stocks
- **Selecting Stocks**: Navigate through the stocks using the horizontal list located at the top of the page.
- **Viewing Stock Information**: Once a stock is selected, detailed information, including a dynamic chart of the stock's performance, will appear below. This allows you to analyze the stock's historical data at a glance.

#### Customizing Your Experience
- **Timeframe Adjustment**: Customize the chart view by switching between different timeframes. The chart will update automatically to reflect the selected period, providing you with tailored insights into the stock's performance.
- **Theme Preferences**: Enhance your viewing experience by toggling between Dark and Light themes. This feature allows you to choose the interface appearance that best suits your preference or current lighting conditions.

#### Managing Your Account
- **Profile Overview**: Access your profile to view the email address you're currently logged in with, ensuring you're always aware of which account you're using.
- **Logout Functionality**: Securely log out of your account when needed. Our system ensures your login remains persistent through the use of `localStorage`, so you won't have to log in every time you visit. -->

## Styling

TailwindCSS has been the primary tool for crafting the application's design. Shadcn components were integrated due to their seamless compatibility with TailwindCSS, ensuring a cohesive look and feel.

## Best Practices

- Strongly typed components and utilities with TypeScript.
- Performance optimization through `useMemo` & `useCallback`.
- Emphasis on component structuring and reusability for maintainable code.
- Separation of logic and UI with custom hooks.

<!-- #####Example for custom hook:  -->
<!-- ![Architecture Diagram](<./src/assets//hook_diagram.png>) -->

## Credit Resources

- https://supabase.com/blog/openai-embeddings-postgres-vector
- https://supabase.com/docs/guides/auth/auth-helpers/nextjs

rlEHw3Sd70OlRBoI
