# Air Hockey - Mobile First Web Game

A fast-paced, responsive Air Hockey game built with React, Tailwind CSS, and HTML5 Canvas. Designed with a "Mobile First" architecture, it provides a seamless arcade experience across mobile phones, tablets, and desktop computers.

**Google AI Studio Project Link:**
[https://aistudio.google.com/apps/drive/1FG4eiFMbfCZkmf_kFEw12Bs-KqWhYpvM?showAssistant=true&showPreview=true&resourceKey=](https://aistudio.google.com/apps/drive/1FG4eiFMbfCZkmf_kFEw12Bs-KqWhYpvM?showAssistant=true&showPreview=true&resourceKey=)

## 🎮 Gameplay & Rules

*   **Objective**: Hit the puck into the opponent's goal (Blue Zone).
*   **Controls**:
    *   **Touch/Mouse**: Drag anywhere on the screen to control the **Red Paddle**.
    *   **Reset**: Press `Alt + R` at any time to return to the home screen.
*   **Winning**: The game follows a "Best of 5" format (First to 3 goals wins).
*   **Start**: Click "Play" on the home screen and wait for the 5-second countdown.

## ✨ Features

*   **Responsive Physics Engine**: Custom collision detection ensuring the paddle doesn't "spin" or get stuck on the puck.
*   **Smart AI**: The CPU (Blue) dynamically adjusts between defense and attack modes.
*   **Leaderboard**: Local storage-based high score tracking displayed on the home screen.
*   **Mobile-First Design**: The interface is optimized for vertical screens but centers elegantly on desktop monitors.
*   **Visual Feedback**: Neon aesthetics with distinct Red (Player) vs. Blue (CPU) branding and goal indicators.

## 🛠️ Tech Stack

*   **Framework**: React 19
*   **Styling**: Tailwind CSS (via CDN)
*   **Rendering**: HTML5 `<canvas>` for high-performance 60FPS rendering.
*   **Icons**: Lucide React

## 📂 Project Structure

*   `index.html`: Entry point with Tailwind script and meta tags.
*   `App.tsx`: Main application layout, UI state management, and RWD logic.
*   `components/GameCanvas.tsx`: The core game loop, physics engine, and rendering logic.
*   `constants.ts`: Configuration for physics (speed, friction), colors, and rules.
*   `services/storageService.ts`: Handles saving/loading match results to LocalStorage.
