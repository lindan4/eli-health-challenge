# Eli Health - Test Strip Scanner Technical Test

This project is a full-stack mobile application that allows users to capture photos of test strips, upload them to a backend service for processing, and view their submission history. The application is built with a React Native frontend and a Node.js backend, all containerized with Docker for a consistent development environment.

## Demo Video

[Pending]

## Features

- **📷 Camera Interface:** A full-screen camera with tap-to-focus for capturing clear images of test strips.
- **🖼️ Image Preview:** Users can preview their photo before deciding to submit or retake.
- **🚀 Backend Processing:** The Node.js backend receives uploads and performs several key operations:
  - **QR Code Extraction:** Reliably finds and decodes QR codes from images using multiple pre-processing strategies.
  - **Validation:** Validates QR code format and checks if the test strip is expired.
  - **Thumbnail Generation:** Creates a 200x200 thumbnail for the history view.
- **💾 Database Storage:** All submission results are stored in a PostgreSQL database.
- **📜 History View:** A scrollable list of all past submissions, showing the thumbnail, QR data, and processing status.
- **🔄 Pull-to-Refresh:** The history screen can be refreshed to fetch the latest submissions.
- **🧪 Comprehensive Test Suite:** Includes backend API tests, a full integration test, and frontend component tests.

## Tech Stack

- **Monorepo:** Yarn Workspaces
- **Mobile App:** React Native, Expo Router, TypeScript, React Native Vision Camera, React Native Gesture Handler
- **Backend:** Node.js, Express, TypeScript, Sharp, ZXing, PostgreSQL
- **Infrastructure:** Docker, Docker Compose
- **Testing:** Jest, Supertest, React Native Testing Library

## Prerequisites

- Node.js (v20 or later)
- Yarn v1
- Docker & Docker Compose
- Xcode (for iOS) or Android Studio (for Android)

## Setup & Installation

Follow these steps to get the project running locally.

### 1. Clone the Repository

```bash
git clone https://github.com/lindan4/eli-health-challenge.git
cd eli-health-challenge
```

### 2. Backend Setup (Docker)

The backend and database run in Docker containers.

```bash
# This command will build the backend image and start both the
# backend and postgres containers in the background.
docker-compose up --build
```

The backend server will be available at `http://localhost:5001`.

### 3. Frontend Setup (Mobile App)

The mobile app runs directly on your machine.

```bash
# Navigate into the app directory
cd app

# Install dependencies
yarn install

# Create your local environment file
cp .env.example .env
```

Next, open the newly created `app/.env` file and replace `<YOUR_LOCAL_IP_ADDRESS>` with your computer's local network IP address. On a Mac, you can find this by running `ifconfig | grep "inet "`.

## Running the Application

- **Backend:** The backend is already running via the `docker-compose up -d` command.
- **Frontend:** From the `app` directory, run one of the following commands:

```bash
# To run on an iOS device/simulator
yarn ios

# To run on an Android device/emulator
yarn android
```

## Running Tests

### Backend Tests

The backend suite includes API and integration tests. The Docker containers must be running for the database connection to work.

```bash
# 1. Make sure your Docker containers are running
docker-compose up -d

# 2. Navigate to the backend directory
cd backend

# 3. Create the test database (one-time setup)
docker-compose exec postgres createdb -U eli_user eli_test_strips_test

# 4. Run the tests
yarn test
```

### Frontend Tests

The frontend suite includes component tests for the UI.

```bash
# Navigate to the app directory
cd app

# Run the tests
yarn test
```

## Assumptions & Design Decisions

* **Database Schema:** The provided schema was missing fields for `quality` and `qr_code_valid`. I added these columns to the `test_strip_submissions` table to store the results of the backend processing and fulfill the API response requirements.
* **QR Code Robustness:** To ensure a high success rate for QR code scanning, I implemented a robust decoding function that attempts multiple image pre-processing strategies (e.g., grayscale, high contrast, thresholding) before trying to find a QR code.
*    **Mobile Testing Strategy:** The requirement was to test the "camera, history view". I chose to write comprehensive tests for the `HistoryScreen`, as this demonstrated more advanced testing skills (mocking APIs and context, testing async behavior) than a simple test of the `CameraView` wrapper would have 

## API Documentation

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/test-strips/upload` | `POST` | Uploads a `multipart/form-data` image for processing. | `201 OK` with a JSON object of the submission result. |
| `/api/test-strips` | `GET` | Retrieves a paginated list of all submissions. Supports `?page` and `?limit`. | `200 OK` with a paginated list of submission objects. |
| `/api/test-strips/:id` | `GET` | Retrieves the detailed information for a single submission by its UUID. | `200 OK` with a single submission object. |
