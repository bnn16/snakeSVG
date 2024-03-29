# Snake Game in TypeScript

This is a classic Snake game implemented in TypeScript, utilizing the D3 library for SVG rendering. The game is built with Yarn as the package manager and incorporates ESLint and Prettier for code linting and formatting, ensuring clean and consistent code.

## Features

- Classic Snake gameplay experience.
- Smooth rendering using SVG with D3.
- TypeScript for type-safe development.
- Yarn for dependency management.
- ESLint and Prettier for code quality.

## Installation

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/bnn16/snakeSVG.git
   ```

2. Navigate to the project directory:

   ```bash
   cd snake-game
   ```

3. Install dependencies using Yarn:

   ```bash
   yarn install
   ```

## Usage

To run the game, just open the index.html file :D

## Acknowledgements

- [D3.js](https://d3js.org/) - Data-Driven Documents library for SVG rendering.
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at Any Scale.
- [Yarn](https://yarnpkg.com/) - Fast, reliable, and secure dependency management.
- [ESLint](https://eslint.org/) - Pluggable JavaScript linter.
- [Prettier](https://prettier.io/) - Opinionated code formatter.

## Known Bugs

- When a player starts spamming the Spacebar button, the snake's speed will increase exponentially while the menu is open.   
I'm suspecting it's from the event listener and it just can't execute everything on time.

Enjoy playing the game! 🐍🎮
