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
  - Handles user interactions (button clicks, language selection changes).
  - Manages image capture/loading.
  - Interacts with the **Prompt API** for:
    - Describing the image based on input image data.
    - Generating questions based on the description and target language.
    - Evaluating user answers provided in the dialog.
  - Updates the DOM dynamically to:
    - Display the selected image.
    - Show the generated description.
    - Populate the question carousel (`<ul>`).
    - Open/close and populate the answer `<dialog>`.
    - Display feedback within the dialog.
- **Prompt API (On-Device Model):** External dependency accessed via JavaScript, performs core AI tasks (description, question generation, evaluation). Requires specific Chrome flags to run.

## Critical Implementation Paths

_(Highlight key workflows or data flows within the system.)_

1.  **Initialization:** Page loads, `js/main.js` initializes, potentially checks Prompt API availability (`LanguageModel.availability`).
2.  **Language Selection:** User selects source/target languages. `js/main.js` stores selections.
3.  **Image Input:** User provides image (camera/file). `js/main.js` gets image data.
4.  **Description Generation:** `js/main.js` sends image data to Prompt API -> Receives description -> Updates description display area in `index.html`.
5.  **Question Generation:** `js/main.js` sends description + target language to Prompt API -> Receives questions -> Populates question carousel (`<ul>`) in `index.html`.
6.  **Answering:** User clicks "Answer" on a question -> `js/main.js` opens `<dialog>`, populating it with the question.
7.  **Feedback:** User submits answer -> `js/main.js` sends question + answer + target language to Prompt API -> Receives feedback -> Updates feedback area in `<dialog>`.
