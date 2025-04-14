# Active Context

_This document tracks the current focus of work, recent changes, immediate next steps, active decisions, important patterns, and key learnings._

## Current Focus

_(What is the main area of work right now?)_

- Implementing remaining core UI features: language selection (customizable selects), carousel styling, answer dialog styling.
- Refining feedback display logic in `handleDialogSubmit`.
- Testing the end-to-end flow, including camera and file input with Blob handling.
- Updating Memory Bank documentation.

## Recent Changes

_(List significant changes made in the last work session.)_

- **`index.html`:**
  - Added `<dialog>` for PEPC camera permission (`#permission-dialog`) containing `<permission type="camera">`.
  - Added `<dialog>` for camera preview/capture (`#camera-dialog`) with `<video>` and `<canvas>` elements.
  - Added basic CSS styles for PEPC and camera dialog elements.
- **`js/main.js`:**
  - Changed image data handling to use `Blob` objects instead of Data URLs for `LanguageModel` API.
  - Renamed state variable `currentImageData` to `currentImageBlob`.
  - Added state variable `currentObjectUrl` for Blob preview URLs.
  - Modified `handleFileInputChange` to store `File` (Blob) directly and use `URL.createObjectURL` for preview.
  - Modified `handleCameraCapture` to use `canvas.toBlob()` and `URL.createObjectURL` for preview.
  - Added helper function `checkAndProcessImage` to handle common logic after getting a Blob.
  - Modified `processImage` and `getImageDescription` to accept and correctly pass `Blob` objects.
  - Added `URL.revokeObjectURL` calls to manage memory (including fixing race condition in camera capture preview).
  - Modified `stopCameraStream` to only stop media tracks, not revoke URLs.
  - Adjusted `handleCameraCapture` to call `stopCameraStream` after initiating image processing.
  - (Previous session) Added DOM references for new dialogs and camera elements.
  - (Previous session) Refined `handleCameraButtonClick`: Uses `navigator.permissions.query({ name: 'camera' })`, attaches an `onchange` listener to the `PermissionStatus`, and handles initial states (`granted`, `prompt`, `denied`) appropriately, showing the PEPC dialog for `prompt`.
  - (Previous session) Refined `showPermissionContextInfo`: Handles the `promptdismiss` event from the `<permission>` element to provide user context if the prompt was dismissed without a choice.
  - (Previous session) Implemented `startCameraStream` using `navigator.mediaDevices.getUserMedia`.
  - (Previous session) Implemented `handleCameraCancel`.
  - (Previous session) Added event listeners for camera dialog buttons and PEPC `promptdismiss`.
  - (Previous session) Initialized `languageModel` in `initializeApp` using `LanguageModel.create()`. (API name corrected)
  - (Previous session) Implemented `getQuestions` using `languageModel.prompt()` with a prompt requesting questions based on the description in the target language. Added logic to parse newline-separated questions.
  - Implemented `getAnswerFeedback` using `languageModel.prompt()` with a prompt requesting evaluation of the user's answer for a given question.
  - (Previous session) Added `monitor` option to `Translator.create` call to track model download progress.
  - (Previous session) Updated `translatorStatusDiv` to display download percentage and status messages during translation.
  - (Previous session) Corrected the Translator API availability check to use `Translator.availability()`.
- **Memory Bank:**
  - Updated `activeContext.md` (this file).
  - (Previous session) Updated `systemPatterns.md` to reflect the `monitor` usage in `Translator.create` and the updated UI feedback in `translatorStatusDiv`.
  - (Previous session) Updated `systemPatterns.md` to reference `Translator.availability()`.
  - (Previous session) Updated `techContext.md` to reference the global `Translator` object.

## Next Steps

_(What are the immediate tasks to be done?)_

- Update `progress.md` and `systemPatterns.md` to reflect the camera preview fix.
- Implement language selection UI (replace standard selects with customizable selects + flags).
- Implement question display carousel styling (`css/style.css`).
- Implement answer modal dialog styling (`css/style.css`).
- Refine feedback display in `handleDialogSubmit` based on actual `getAnswerFeedback` output (determine correctness).
- Start the Vite development server (`npm run dev`) and test the end-to-end flow.

## Active Decisions & Considerations

_(Record any ongoing discussions, decisions being weighed, or important considerations.)_

- TBD

## Important Patterns & Preferences

_(Note any recurring coding patterns, architectural choices, or user preferences observed.)_

- TBD

## Learnings & Insights

_(Capture any new understanding gained about the project, technology, or process.)_

- TBD
