# Progress

_This document tracks what currently works, what remains to be built, the overall project status, known issues, and the evolution of project decisions._

## What Works

_(List the features or components that are currently functional.)_

- Memory Bank structure initialized and updated (`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`).
- Basic project file structure created.
- Development environment setup (npm, Vite).
- **`js/main.js`:**
  - Basic DOM element references and state variables.
  - Event listeners for language selection and file input.
  - **Translator API Integration:**
    - Checks language pair availability using `Translator.availability()`.
    - Creates translator instance using `Translator.create()` with `monitor` option to track model download progress via `translatorStatusDiv`.
    - Translates image description using `translator.translate()`.
  - **Prompt API (`LanguageModel`) Integration:** (API name corrected)
    - `languageModel` initialized in `initializeApp` using `LanguageModel.create()`.
    - `getImageDescription` implemented to get description from image data (accepts and passes `Blob`).
    - `getQuestions` implemented to generate questions from description.
    - `getAnswerFeedback` implemented to evaluate user answers.
  - **Camera Input & PEPC:**
    - Added dialogs for PEPC permission (`#permission-dialog`) and camera preview/capture (`#camera-dialog`) in `index.html`.
    - Implemented `handleCameraButtonClick` to check permissions using `navigator.permissions.query`, attach `onchange` listener to `PermissionStatus`, handle initial states, and show PEPC dialog.
    - Implemented `showPermissionContextInfo` to handle PEPC `promptdismiss` event.
    - Implemented camera stream handling (`startCameraStream`, `stopCameraStream`) using `getUserMedia`.
    - Implemented photo capture (`handleCameraCapture`) using `<canvas>` to get `Blob`.
    - Added event listeners for camera buttons and PEPC dismissal.
  - **Image Handling:**
    - Stores image data as `Blob` (`currentImageBlob`).
    - Uses `URL.createObjectURL` for image previews (`selectedImage.src`).
    - Revokes object URLs (`URL.revokeObjectURL`) appropriately to manage memory (fixed race condition for camera preview).
    - `handleFileInputChange` stores `File` (Blob) and generates preview URL.
    - `handleCameraCapture` uses `canvas.toBlob()` and generates preview URL.
    - Helper `checkAndProcessImage` centralizes logic after obtaining a Blob.
    - `processImage` accepts and passes `Blob` to `getImageDescription`.
  - Basic logic for handling image selection (file input works, camera capture implemented), processing (including translation check, download monitoring, description generation, question generation), populating carousel, and opening/submitting answer dialog (feedback generation implemented, correctness check still placeholder).

## What's Left to Build

_(Outline the remaining tasks, features, or components.)_

- Implement language selection UI (replace standard selects with customizable selects + flags).
- Implement question display carousel styling (`css/style.css`).
- Implement answer modal dialog styling (`css/style.css`).
- Refine feedback display logic in `handleDialogSubmit` to determine correctness based on the actual feedback string from `getAnswerFeedback`.
- Testing and refinement of the entire workflow with actual AI API responses, including error handling and Blob passing.

## Current Status

_(Provide a brief summary of the project's current state.)_

- Project Pivot: Shifted to Language Learning Tool.
- Development Environment Setup: Complete.
- **Core AI Integration:**
  - `Translator` API integrated: `Translator.availability()` for checks, `Translator.create()` with `monitor` for download progress feedback, and `translator.translate()` for translation.
  - `LanguageModel` (Prompt API) integrated: `languageModel` initialized, `getImageDescription`, `getQuestions`, and `getAnswerFeedback` implemented. (API name corrected)
- **Image Input:** File input functional. Camera input implemented using `getUserMedia` and PEPC for permissions (refined handling with `onchange` and `promptdismiss`). Image data is now handled as `Blob` objects for the `LanguageModel` API, with `URL.createObjectURL` used for previews (preview race condition fixed).
- **Documentation:** Memory Bank files (`activeContext.md`, `progress.md`, `systemPatterns.md`) updated to reflect Prompt API, Camera/PEPC, Blob handling, and preview fix. `techContext.md` is up-to-date.
- **Next Steps:** Focus shifts to implementing remaining core UI features (language selects, carousel styling) and testing the end-to-end flow.

## Known Issues

_(List any bugs, limitations, or areas needing improvement.)_

- TBD

## Evolution of Decisions

_(Track significant changes in direction, requirements, or technical approach over time.)_

- **[Date of Change - e.g., 2025-04-10]:** Project pivoted from a general Chrome features demo (IO Demo) to a specific Language Learning Tool application based on updated `projectbrief.md`. Core requirements now focus on image-based question generation and answering using the Prompt API.
