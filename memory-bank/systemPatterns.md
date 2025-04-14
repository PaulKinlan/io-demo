# System Patterns

_This document outlines the system architecture, key technical decisions, design patterns employed, component relationships, and critical implementation paths._

## System Architecture

_(Provide a high-level overview of the system's structure. Diagrams (e.g., Mermaid) can be useful here.)_

- Simple client-side web application.
- Structure:
  ```
  /
  ├── index.html      (Entry point)
  ├── css/style.css   (Styling)
  ├── js/main.js      (Client-side logic, Prompt API interaction)
  ├── images/         (User-uploaded image assets - temporary storage/display)
  ├── audio/          (Potential future use for audio input/output)
  └── memory-bank/    (Project documentation)
  ```
- No backend server component. All logic resides in the browser, leveraging on-device AI via the Prompt API.
- Key UI Components in `index.html`:
  - Image Input (Camera/File buttons)
  - Image Display Area
  - Language Selectors (Source/Target - Customizable Select)
  - Image Description Display Area
  - Question Carousel (`<ul class="carousel">`)
  - Answer Modal (`<dialog>`)
  - PEPC Permission Dialog (`<dialog id="permission-dialog">` with `<permission type="camera">`)
  - Camera Preview/Capture Dialog (`<dialog id="camera-dialog">` with `<video>` and `<canvas>`)

## Key Technical Decisions

_(List major architectural and technical choices made and the reasoning behind them.)_

- TBD

## Design Patterns

_(Identify and describe the main design patterns used throughout the codebase.)_

- TBD

## Component Relationships

_(Describe how the major components of the system interact with each other.)_

- `index.html`: Defines the structure containing all UI elements (image input, display, selectors, description, carousel, dialog). Loads `css/style.css` and `js/main.js`.
- `css/style.css`: Provides styling for all elements, including the specific styles for the question carousel and potentially the customizable selects.
- `js/main.js`:
  - Handles user interactions (button clicks, language selection changes, camera capture/cancel).
  - Manages image capture/loading (file input stores `File` Blob, camera stream via `getUserMedia` captured to `Blob` via `canvas.toBlob()`). Uses `URL.createObjectURL` for previews and revokes them.
  - Handles camera permissions using `navigator.permissions.query`, attaching `onchange` listener to `PermissionStatus`, and integrating with the PEPC dialog (`<permission>` element's `promptdismiss` event).
  - Interacts with the **On-Device AI APIs**:
    - **`Translator` API (Global Object)**:
      - Checks language pair availability (`Translator.availability()`).
      - Creates translator instances (`Translator.create()`), using the `monitor` option to track model download progress and update the `translatorStatusDiv`.
      - Translates the image description from source to target language (`translator.translate()`).
    - **`LanguageModel` (Prompt API)**: (API name corrected)
      - Initialized via `LanguageModel.create()` in `initializeApp`.
      - `getImageDescription`: Called with `prompt(['describe this image', {type: 'image', content: [imageBlob]}])`. Accepts and passes `Blob`.
      - `getQuestions`: Called with `prompt([prompt_string])` where `prompt_string` requests 20-30 questions in the target language based on the translated description. Expects newline-separated output.
      - `getAnswerFeedback`: Called with `prompt([prompt_string])` where `prompt_string` requests evaluation of the user's answer for a specific question.
  - Updates the DOM dynamically to:
    - Display the selected image.
    - Show the generated description (original source language).
    - Update the `translatorStatusDiv` with download progress and status.
    - Populate the question carousel (`<ul>`).
    - Open/close and populate the answer `<dialog>`.
    - Display feedback within the dialog.
- **On-Device AI APIs (`Translator`, `LanguageModel`):** External dependencies accessed via JavaScript. Perform core AI tasks (translation check, translation, description, question generation, evaluation). Require specific Chrome flags to run. (API name corrected)

## Critical Implementation Paths

_(Highlight key workflows or data flows within the system.)_

1.  **Initialization:** Page loads, `js/main.js` initializes, checks Translator API availability using `Translator.availability()`, initializes `LanguageModel`.
2.  **Language Selection:** User selects source/target languages. `js/main.js` stores selections and re-checks translator availability (`Translator.availability()`) for the new pair.
3.  **Image Input (File):** User selects file -> `handleFileInputChange` stores `File` (Blob) in `currentImageBlob`, creates/sets preview URL (`URL.createObjectURL`) -> `checkAndProcessImage(currentImageBlob)`.
4.  **Image Input (Camera):**
    a. User clicks Camera button -> `handleCameraButtonClick`.
    b. Check `navigator.permissions.query({ name: 'camera' })`. Attach `onchange` listener to status.
    c. If initial state `prompt`, show PEPC dialog (`#permission-dialog`). Listen for `promptdismiss` on `<permission>`.
    d. If initial state `granted` (or `onchange` event fires with `granted`), call `startCameraStream`.
    e. If initial state `denied` (or `onchange` event fires with `denied`), show message in PEPC dialog.
    f. `startCameraStream` calls `getUserMedia`, sets `video.srcObject`, shows camera dialog (`#camera-dialog`).
    g. User clicks Capture -> `handleCameraCapture` draws video to canvas, gets `Blob` via `canvas.toBlob()`, stores in `currentImageBlob`, creates/sets preview URL -> close camera dialog -> `checkAndProcessImage(currentImageBlob)` -> `stopCameraStream` (stops tracks).
    h. User clicks Cancel -> `handleCameraCancel` -> `stopCameraStream` (stops tracks) -> close camera dialog.
5.  **Check & Process (checkAndProcessImage):** Checks `Translator.availability()`. If available, calls `processImage(imageBlob)`. Handles unavailable case.
6.  **Processing (processImage(imageBlob)):**
    a. **Description Generation:** `js/main.js` calls `getImageDescription(imageBlob)` which uses `languageModel.prompt()` with the `Blob` -> Receives description string -> Updates description display area.
    b. **Description Translation:** `js/main.js` creates a translator (`Translator.create()`) with a `monitor` to track download progress -> Updates `translatorStatusDiv` during download -> Translates the description to the target language -> Updates `translatorStatusDiv` with success/failure.
    c. **Question Generation:** `js/main.js` calls `getQuestions(translatedDescription, targetLanguage)` which uses `languageModel.prompt()` -> Receives questions string -> Parses newline-separated questions -> Populates question carousel (`<ul>`).
7.  **Answering:** User clicks "Answer" on a question -> `js/main.js` opens `<dialog>`, populating it with the question.
8.  **Feedback:** User submits answer -> `js/main.js` calls `getAnswerFeedback(question, answer)` which uses `languageModel.prompt()` -> Receives feedback string -> Updates feedback area in `<dialog>` (correctness determination still placeholder).
9.  **Description Translation:** `js/main.js` creates a translator (`Translator.create()`) with a `monitor` to track download progress -> Updates `translatorStatusDiv` during download -> Translates the description to the target language -> Updates `translatorStatusDiv` with success/failure.
10. **Question Generation:** `js/main.js` calls `getQuestions(translatedDescription, targetLanguage)` which uses `languageModel.prompt()` -> Receives questions string -> Parses newline-separated questions -> Populates question carousel (`<ul>`).
11. **Answering:** User clicks "Answer" on a question -> `js/main.js` opens `<dialog>`, populating it with the question.
12. **Feedback:** User submits answer -> `js/main.js` calls `getAnswerFeedback(question, answer)` which uses `languageModel.prompt()` -> Receives feedback string -> Updates feedback area in `<dialog>` (correctness determination still placeholder).
