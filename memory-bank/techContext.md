# Tech Context

_This document details the technologies used, development environment setup, technical constraints, dependencies, and tool usage patterns._

## Technologies Used

_(List the primary languages, frameworks, libraries, databases, etc.)_

- HTML5 (including `<dialog>` element)
- CSS3 (including CSS Scroll Snap, Custom Properties)
- JavaScript (ES Modules)
- Web APIs:
  - `LanguageModel` (Prompt API - On-Device AI for text generation/evaluation) (API name corrected)
  - `Translator` API (Global Object - On-Device AI for translation)
  - Customizable Select API (for enhanced language selection dropdowns)
  - Media Capture and Streams API (`navigator.mediaDevices.getUserMedia`) (for camera input)
  - Permissions API (`navigator.permissions.query`) (for camera permission check)
  - Page Embedded Permission Control (PEPC) (`<permission>` element) (for camera permission UI)
  - File API / File System Access API (for file input)
- Vite (Development server and build tool)

We are explicitly avoiding the use of any runtime frameworks like React, Vue, or Angular to keep the project simple and lightweight. Vite is used solely for development purposes.

## Development Setup

_(Describe how to set up the development environment, including required tools and versions.)_

- Node.js (LTS version recommended) and npm
- Clone the repository.
- Run `npm install` in the project root directory to install development dependencies (Vite).

## Technical Constraints

_(Outline any limitations or constraints affecting technical decisions, e.g., performance requirements, browser compatibility, infrastructure limits.)_

- Targeting Chrome 137
- All of the project must be built using HTML, CSS, and JavaScript without any frameworks.
- The project must be responsive and work on mobile devices.
- The project must be accessible and follow best practices for web accessibility.
- The project is client-side only and does not require a backend server.

## Dependencies

_(List key external dependencies and services the project relies on.)_

- **Development Dependencies:**
  - Vite (`npm install vite --save-dev`)
- **Runtime Dependencies:**
  - None (No external frameworks are used at runtime).

## Tool Usage Patterns

_(Describe common patterns for using specific tools, linters, formatters, build systems, etc.)_

- **Development Server:** Run `npm run dev` to start the Vite development server. Access the application at the URL provided (usually `http://localhost:5173`).
- **Building for Production:** Run `npm run build` to create a production-ready build in the `dist/` directory.
- **Previewing Production Build:** Run `npm run preview` to serve the production build locally.
- **Testing with On-Device AI APIs:** When testing features that use the Prompt API (`LanguageModel`) or Translator API (`Translator`), launch Chrome Canary with the specific flags: `open -na 'Google Chrome Canary' --args --enable-features=OptimizationGuideOnDeviceModel:compatible_on_device_performance_classes/\*,AIPromptAPIMultimodalInput --user-data-dir=/Users/$USER/Downloads/user-data-dir --no-default-browser-check --no-first-run --use-mock-keychain  --optimization-guide-ondevice-model-execution-override=/Users/$USER/Downloads/gemini_audio_vision/ --optimization-guide-model-override=OPTIMIZATION_TARGET_MODEL_EXECUTION_FEATURE_PROMPT_API:/Users/$USER/Downloads/gemini_audio_vision/prompt_api_audio_vision.crx3` (Note: Ensure the paths to the user data directory and model files are correct for your system. Verify if additional flags are needed specifically for the Translator API if issues occur). (API name corrected in description)
