# Auction House – Semester Project 2

**Project Description**

This project is a fully functional Auction House web application developed as part of Semester Project 2.

- The application allows users to:
- Register and log in
- Create, edit, and delete auction listings
- Place bids on listings
- View user profiles
- Browse active auctions

The project focuses on integrating authentication, API communication, dynamic rendering, and conditional UI logic into one complete frontend system.

## Tech Stack

- HTML
- Tailwind CSS
- JavaScript
- Noroff Auction API (v2)
- Git & GitHub
- Node.js / npm (for tailwind build process)
- Cloudinary (image uploads)

## Dummy Login

```
email: bingi@stud.noroff.no
password: Bingi123
```

## Setup

1. Clone the repository

```
git clone https://github.com/emmelinlarina/semester-project-2.git
```

2. Navigate into the project folder

```
cd semester-project-2
```

3. Install dependencies

```
npm install
```

4. Start Tailwind in watch mode

```
npm run dev
```

5. Open index.html using Live Server

## Authentication

This project uses the Noroff Auction API (v2) for authentication.

- Users can register with a valid Noroff student email
- Login returns a token stored in localStorage
- Protected routes require a valid Bearer token

Conditional rendering is implemented to show different UI elements depending on authentication state.

## Project Structure

The project is structured to separate concerns:

- `api/` API communication logic
- `utils/` – Helper functions (authentication, storage, navigation)
- `render/` – Template rendering logic
- `css/` – Compiled Tailwind output
- `src/` – Tailwind input files

This structure helps improve maintainability and readability.

## Known Limitations

- Some functions could be further refactored for readability
- The design is intentionally minimal, with focus placed on functionality
- Additional UI polish and component abstraction could improve scalability

## Live Demo - GitHub Pages

(https://emmelinlarina.github.io/semester-project-2/index.html)
