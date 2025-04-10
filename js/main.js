console.log("Language Learning Tool script loaded.");

// --- DOM Elements ---
const setupSection = document.getElementById("setup-section");
const learningSection = document.getElementById("learning-section");
// Use standard select elements now
const sourceLanguageSelect = document.getElementById("source-language");
const targetLanguageSelect = document.getElementById("target-language");
const translatorStatusDiv = document.getElementById("translator-status");
// Other elements
const cameraButton = document.getElementById("camera-button");
const fileInput = document.getElementById("file-input");
const selectedImage = document.getElementById("selected-image");
const descriptionText = document.getElementById("description-text");
const questionCarousel = document.getElementById("question-carousel");
const answerDialog = document.getElementById("answer-dialog");
const dialogQuestionText = document.getElementById("dialog-question-text");
const dialogAnswerTextarea = document.getElementById("dialog-answer");
const dialogFeedback = document.getElementById("dialog-feedback");
const dialogCloseButton = document.getElementById("dialog-close-button");
const dialogSubmitButton = document.getElementById("dialog-submit-button");
const dialogForm = answerDialog.querySelector("form");

// --- State ---
let sourceLanguage = "en"; // Default
let targetLanguage = "fr"; // Default
let currentImageData = null;
let currentQuestions = [];
let currentQuestionIndex = -1;
let languageModel = null;

// --- Initialization ---
async function initializeApp() {
  console.log("Initializing app...");
  // Set initial select values from state
  sourceLanguageSelect.value = sourceLanguage;
  targetLanguageSelect.value = targetLanguage;
  await checkTranslationAvailability(); // Initial check
  addEventListeners();
  console.log("App initialized.");
}

// --- Translator API Check ---
async function checkTranslationAvailability() {
  translatorStatusDiv.textContent = "Checking compatibility...";
  translatorStatusDiv.className = "checking"; // Reset and set checking class

  if (!navigator.languages || !navigator.languages.canTranslate) {
    console.warn(
      "Translator API (navigator.languages.canTranslate) not available."
    );
    translatorStatusDiv.textContent =
      "Translator API not supported by browser.";
    translatorStatusDiv.className = "unavailable";
    return false; // Indicate unavailability
  }

  try {
    // Add a small delay to allow UI to update before potentially blocking check
    await new Promise((resolve) => setTimeout(resolve, 50));
    const canTranslate = await navigator.languages.canTranslate(
      sourceLanguage,
      targetLanguage
    );
    console.log(
      `Can translate ${sourceLanguage} -> ${targetLanguage}: ${canTranslate}`
    );
    if (canTranslate) {
      translatorStatusDiv.textContent = "Language pair supported.";
      translatorStatusDiv.className = "available";
      return true;
    } else {
      translatorStatusDiv.textContent = "Language pair not supported.";
      translatorStatusDiv.className = "unavailable";
      return false;
    }
  } catch (error) {
    console.error("Error checking translation availability:", error);
    translatorStatusDiv.textContent = "Error checking compatibility.";
    translatorStatusDiv.className = "unavailable";
    return false;
  }
}

// --- Event Listeners ---
function addEventListeners() {
  // Use standard change listeners for the select elements
  sourceLanguageSelect.addEventListener("change", handleSourceLanguageChange);
  targetLanguageSelect.addEventListener("change", handleTargetLanguageChange);
  cameraButton.addEventListener("click", handleCameraButtonClick);
  fileInput.addEventListener("change", handleFileInputChange);
  questionCarousel.addEventListener("click", handleCarouselClick); // Event delegation
  dialogForm.addEventListener("submit", handleDialogSubmit);
}

// --- Event Handlers ---
function handleSourceLanguageChange(event) {
  const newValue = event.target.value;
  if (sourceLanguage !== newValue) {
    sourceLanguage = newValue;
    console.log("Source language changed to:", sourceLanguage);
    checkTranslationAvailability(); // Check compatibility on change
    // Optionally clear learning section if language changes?
    // learningSection.hidden = true;
    // selectedImage.src = "#";
  }
}

function handleTargetLanguageChange(event) {
  const newValue = event.target.value;
  if (targetLanguage !== newValue) {
    targetLanguage = newValue;
    console.log("Target language changed to:", targetLanguage);
    checkTranslationAvailability(); // Check compatibility on change
    // Optionally clear learning section if language changes?
    // learningSection.hidden = true;
    // selectedImage.src = "#";
  }
}

async function handleCameraButtonClick() {
  console.log("Camera button clicked - Not implemented yet.");
  // TODO: Implement camera access
}

function handleFileInputChange(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    console.log("Image file selected:", file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      // Make async to await check
      selectedImage.src = e.target.result;
      currentImageData = e.target.result; // Placeholder - needs conversion for Prompt API
      console.log("Image loaded.");
      // Check if translation is possible before processing
      const canProceed = await checkTranslationAvailability();
      if (canProceed) {
        processImage(currentImageData); // Start the AI processing
      } else {
        alert(
          "Selected language pair is not supported for translation. Please choose different languages."
        );
        // Optionally clear image/description/questions
        learningSection.hidden = true;
        selectedImage.src = "#";
        descriptionText.textContent = "Description will appear here...";
        questionCarousel.innerHTML =
          "<li>Select a supported language pair.</li>";
      }
    };
    reader.readAsDataURL(file);
  } else {
    console.log("No valid image file selected.");
    currentImageData = null;
    selectedImage.src = "#";
    learningSection.hidden = true;
  }
}

function handleCarouselClick(event) {
  if (event.target.classList.contains("answer-button")) {
    const questionIndex = parseInt(event.target.dataset.index, 10);
    if (
      !isNaN(questionIndex) &&
      questionIndex >= 0 &&
      questionIndex < currentQuestions.length
    ) {
      openAnswerDialog(questionIndex);
    }
  }
}

async function handleDialogSubmit(event) {
  event.preventDefault();
  const userAnswer = dialogAnswerTextarea.value.trim();
  if (!userAnswer || currentQuestionIndex < 0) return;

  console.log(
    `Submitting answer "${userAnswer}" for question index ${currentQuestionIndex}`
  );
  dialogFeedback.textContent = "Evaluating...";
  dialogFeedback.className = "";

  const feedback = await getAnswerFeedback(
    currentQuestions[currentQuestionIndex],
    userAnswer
  );
  // TODO: Determine correctness based on actual feedback from Prompt API
  const isCorrect = Math.random() > 0.5; // Placeholder

  displayFeedback(feedback, isCorrect);
}

// --- Core Logic Functions ---
async function processImage(imageData) {
  if (!imageData) return;

  learningSection.hidden = false;
  descriptionText.textContent = "Generating description...";
  questionCarousel.innerHTML = "<li>Generating questions...</li>";

  const description = await getImageDescription(imageData, sourceLanguage);
  descriptionText.textContent =
    description || "Could not generate description.";

  if (description) {
    currentQuestions = await getQuestions(description, targetLanguage);
    populateCarousel(currentQuestions);
  } else {
    questionCarousel.innerHTML =
      "<li>Could not generate questions without description.</li>";
    currentQuestions = [];
  }
}

function populateCarousel(questions) {
  if (!questions || questions.length === 0) {
    questionCarousel.innerHTML = "<li>No questions generated.</li>";
    return;
  }
  questionCarousel.innerHTML = "";
  questions.forEach((q, index) => {
    const li = document.createElement("li");
    const p = document.createElement("p");
    p.textContent = q;
    const button = document.createElement("button");
    button.textContent = "Answer";
    button.classList.add("answer-button");
    button.dataset.index = index;
    li.appendChild(p);
    li.appendChild(button);
    questionCarousel.appendChild(li);
  });
}

function openAnswerDialog(questionIndex) {
  currentQuestionIndex = questionIndex;
  dialogQuestionText.textContent = currentQuestions[questionIndex];
  dialogAnswerTextarea.value = "";
  dialogFeedback.textContent = "";
  dialogFeedback.className = "";
  answerDialog.showModal();
  console.log("Opened dialog for question index:", questionIndex);
}

function displayFeedback(feedback, isCorrect) {
  dialogFeedback.textContent = feedback;
  dialogFeedback.className = isCorrect ? "correct" : "incorrect";
}

// --- Placeholder API Functions ---
async function getImageDescription(imageData, lang) {
  console.warn("getImageDescription called - Not implemented");
  // TODO: Call Prompt API
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `Placeholder description in ${lang}.`;
}

async function getQuestions(description, lang) {
  console.warn("getQuestions called - Not implemented");
  // TODO: Call Prompt API
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return Array.from(
    { length: Math.floor(Math.random() * 11) + 5 },
    (_, i) => `Placeholder Question ${i + 1} in ${lang}?`
  );
}

async function getAnswerFeedback(question, answer) {
  console.warn("getAnswerFeedback called - Not implemented");
  // TODO: Call Prompt API
  await new Promise((resolve) => setTimeout(resolve, 800));
  return `Placeholder feedback for answer: ${answer}`;
}

// --- Start the app ---
document.addEventListener("DOMContentLoaded", initializeApp);
