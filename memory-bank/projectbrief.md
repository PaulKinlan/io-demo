# Project Brief

A client-side language learning tool.

## Core Requirements

- Take an image either from the camera or from a file
  - Use the on-device prompt API to describe the image into the user's default language.
- The user will be able to select their source language (defaulting to their device language) and the target language (defaulting to French). It should be two customizable selects boxes. Each select should be a list of languages with a flag in. The user should be able to select the source and target language from the list.
- Using the on-device prompt API, take the description of the image and create 20-30 questions in the target language. The questions should be in a `<ul> list format and should be displayed on the screen.

  - The <ul> will be horizontally scrollable using scroll-snap with something like this:

    ```CSS
    .carousel {
      list-style-type: none;
      container-type: size;
      inline-size: 100cqi 826.656px;
      block-size: min(60svh, 720px);
      display: grid;
      grid-auto-flow: column;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      overscroll-behavior-x: contain;
      gap: 1rem;
      padding-inline: 1rem;
      scroll-padding-inline: 1rem;
      padding-block: 30px 60px;
      margin-block-end: var(--size-7);
    }

    .carousel::scroll-button(inline-start) {
      z-index: 20;
      background: oklch(from var(--surface-1) l c h / 50%);
      backdrop-filter: blur(10px);
    }

    .carousel::&::scroll-button(inline-end) {
        z-index: 20;
        background: oklch(from var(--surface-1) l c h / 50%);
        backdrop-filter: blur(10px);
    }
    ```

    All the code is on @url https://chrome.dev/carousel/horizontal/app-switcher/

  - Each 'li' should be the generated question with a button to answer the question. The button should open a modal <dialog> with the question and a text input or a microphone input to answer the question. The user should be able to submit their answer and get feedback on whether they are correct or not using the on-device prompt API. The feedback should be displayed in a `<p>` element below the question.

## Project Goals

_(Outline the high-level objectives and desired outcomes of the project.)_

- A simple single page app that has beautiful UI and UX.
- The app should be responsive and work on mobile devices.
- The app should be accessible and follow best practices for web accessibility.
- The app should be lightweight and fast.
- The app should be easy to use and understand.
- The app should be built using HTML, CSS, and JavaScript without any frameworks.

## Scope

- **In Scope:** On-device APIs, HTML, CSS, JavaScript, responsive design, accessibility, lightweight and fast performance.
- **Out of Scope:** Server side logic, database, user authentication, etc.
