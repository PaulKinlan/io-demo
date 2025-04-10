# Product Context

_This document explains why this project exists, the problems it aims to solve, how it should function from a user's perspective, and the overall user experience goals._

## Problem Statement

Learning a new language often requires engaging, context-rich practice that connects vocabulary and grammar to real-world scenarios. Traditional methods like flashcards or textbook exercises can sometimes feel repetitive or disconnected. There's an opportunity to leverage visual context (images) and on-device AI to create a more dynamic and personalized learning experience.

## Proposed Solution

This project is a client-side language learning tool designed to bridge this gap. It allows users to:

1.  Select their native (source) language and the language they want to learn (target).
2.  Provide an image, either by taking a photo with their device camera or uploading a file.
3.  Utilize the on-device Prompt API to automatically generate a description of the image in their source language, providing immediate visual context understanding.
4.  Leverage the Prompt API again to generate 20-30 relevant practice questions in the target language, directly related to the image's content and description.
5.  Interact with these questions through a user-friendly carousel interface.
6.  Answer questions within a modal dialog, receiving AI-powered feedback on their responses.

This approach aims to make language practice more engaging by grounding it in visual context provided by the user.

## User Experience Goals

- **Intuitive:** The user flow from image selection to question answering should be clear and straightforward.
- **Engaging:** The use of user-provided images and AI-generated questions should make the learning process more interactive and less repetitive.
- **Visually Appealing:** A clean, modern UI that presents the image, description, and questions clearly.
- **Responsive:** The application must adapt seamlessly to various screen sizes, including mobile devices.
- **Performant:** As a client-side application relying on on-device AI, it should feel fast and responsive without noticeable lag.
- **Accessible:** Adhere to web accessibility best practices (WCAG).

## Key Workflows

1.  **Language Selection:** User selects source and target languages via two customizable select dropdowns (featuring language names and flags). Defaults are device language (source) and French (target).
2.  **Image Input:** User clicks a button to either activate the device camera or open a file picker to select an image.
3.  **Image Display & Description:** The selected image is displayed. The app calls the Prompt API (`languageModel.prompt(['describe this image', {type: 'image', content: image_data}])`) to get a description in the source language, which is then displayed near the image.
4.  **Question Generation:** The app calls the Prompt API again, providing the image description and target language, requesting 20-30 questions (`languageModel.prompt(['generate 20-30 questions in {target_language} based on the description: {image_description}'])`).
5.  **Question Display:** The generated questions are displayed as individual items (`<li>`) within a horizontally scrolling carousel (`<ul class="carousel">`). Each item shows the question text and an "Answer" button.
6.  **Answering:** User clicks the "Answer" button on a question card.
7.  **Answer Modal:** A `<dialog>` element opens modally, displaying the selected question. It contains an input field (e.g., `<textarea>`) and potentially a microphone button for voice input (future enhancement).
8.  **Submission & Feedback:** User types (or speaks) their answer and submits. The app calls the Prompt API (`languageModel.prompt(['evaluate this answer: {user_answer} for the question: {question_text} in {target_language}'])`) to check correctness and provide feedback (e.g., "Correct!", "Almost! Try focusing on [aspect]", "Incorrect. The answer relates to [topic]"). The feedback appears within the dialog.
9.  **Dialog Closure:** User closes the dialog and can choose another question from the carousel.
