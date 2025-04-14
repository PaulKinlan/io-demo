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
// Camera/Permission Dialog elements
const permissionDialog = document.getElementById("permission-dialog");
const cameraPermissionElement = document.getElementById(
  "camera-permission-element"
);
const permissionContext = document.getElementById("permission-context");
const cameraDialog = document.getElementById("camera-dialog");
const cameraVideo = document.getElementById("camera-video");
const cameraCanvas = document.getElementById("camera-canvas");
const cameraCancelButton = document.getElementById("camera-cancel-button");
const cameraCaptureButton = document.getElementById("camera-capture-button");

// --- State ---
let sourceLanguage = "en"; // Default
let targetLanguage = "fr"; // Default
let currentImageBlob = null; // Store image data as Blob
let currentQuestions = [];
let currentQuestionIndex = -1;
let languageModel = null; // Added for on-device AI model
let currentCameraStream = null; // To hold the active camera stream
let currentObjectUrl = null; // To hold temporary URL for Blob preview

// --- Initialization ---
async function initializeApp() {
  console.log("Initializing app...");
  // Set initial select values from state
  sourceLanguageSelect.value = sourceLanguage;
  targetLanguageSelect.value = targetLanguage;
  await checkTranslationAvailability(); // Initial check

  // Initialize the Language Model
  try {
    // Check if the API exists (now directly on window)
    if (typeof LanguageModel !== "undefined") {
      console.log("Attempting to create LanguageModel...");
      // Assuming multimodal input is needed based on techContext flags
      languageModel = await LanguageModel.create({
        // Use LanguageModel.create
        expectedInputs: [{ type: "image" }],
      });
      console.log("LanguageModel created successfully.");
    } else {
      console.error(
        "On-device Language Model API (LanguageModel) not available." // Updated error message
      );
      // Optionally disable features that rely on it
      translatorStatusDiv.textContent += " (Language Model API unavailable)";
      translatorStatusDiv.className = "unavailable";
    }
  } catch (error) {
    console.error("Error creating LanguageModel:", error);
    translatorStatusDiv.textContent += " (Error initializing Language Model)";
    translatorStatusDiv.className = "unavailable";
  }

  addEventListeners();
  console.log("App initialized.");
}

// --- Translator API Check ---
async function checkTranslationAvailability() {
  translatorStatusDiv.textContent = "Checking compatibility...";
  translatorStatusDiv.className = "checking"; // Reset and set checking class

  // Check for the Translator API directly on the window object
  if (typeof window.Translator === "undefined") {
    console.warn("Translator API (window.Translator) not available.");
    translatorStatusDiv.textContent = "Translator API not available.";
    translatorStatusDiv.className = "unavailable";
    return false; // Indicate unavailability
  }

  try {
    // Add a small delay to allow UI to update before potentially blocking check
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check availability directly using Translator.availability()
    const availability = await Translator.availability({
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });
    console.log(
      `Translator availability for ${sourceLanguage} -> ${targetLanguage}: ${availability}`
    );

    // availability returns "available", "readilyAvailable", "downloadRequired", or "notSupported"
    if (
      availability === "available" ||
      availability === "readilyAvailable" ||
      availability === "downloadRequired"
    ) {
      translatorStatusDiv.textContent = `Language pair supported (${availability}).`;
      translatorStatusDiv.className = "available";
      return true;
    } else {
      translatorStatusDiv.textContent = `Language pair not supported (${availability}).`;
      translatorStatusDiv.className = "unavailable";
      return false;
    }
  } catch (error) {
    console.error("Error checking Translator availability:", error);
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
  // Camera Dialog listeners
  cameraCaptureButton.addEventListener("click", handleCameraCapture);
  cameraCancelButton.addEventListener("click", handleCameraCancel);
  // PEPC listener
  if (cameraPermissionElement) {
    cameraPermissionElement.addEventListener(
      "promptdismiss",
      showPermissionContextInfo
    );
  } else {
    console.warn("Camera permission element not found.");
  }
  // Revoke object URL when image changes or is no longer needed
  selectedImage.addEventListener("load", () => {
    if (currentObjectUrl && selectedImage.src !== currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      console.log("Revoked previous object URL:", currentObjectUrl);
      currentObjectUrl = null;
    }
  });
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

// --- Camera Permission and Handling ---

async function handleCameraButtonClick() {
  console.log("Camera button clicked");
  permissionContext.textContent = ""; // Clear previous context messages

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Camera access (getUserMedia) is not supported by your browser.");
    return;
  }
  if (!navigator.permissions || !navigator.permissions.query) {
    alert("Permissions API is not supported by your browser.");
    // Fallback or disable camera button? For now, attempt getUserMedia directly.
    console.warn(
      "Permissions API not supported, attempting getUserMedia directly."
    );
    startCameraStream();
    return;
  }

  try {
    const permissionStatus = await navigator.permissions.query({
      name: "camera",
    });
    console.log("Initial camera permission status:", permissionStatus.state);

    // Define the handler for permission changes
    const handlePermissionChange = () => {
      console.log(
        "Camera permission status changed to:",
        permissionStatus.state
      );
      if (permissionStatus.state === "granted") {
        if (permissionDialog.open) permissionDialog.close();
        startCameraStream();
      } else if (permissionStatus.state === "denied") {
        if (permissionDialog.open) permissionDialog.close();
        permissionContext.textContent =
          "Camera access has been denied. Please enable it in your browser settings to use this feature.";
        // Show the dialog again to make the message visible if it wasn't already
        if (!permissionDialog.open) permissionDialog.showModal();
      }
      // If state becomes 'prompt' again (unlikely but possible), do nothing here,
      // the user needs to click the button again.
    };

    // Attach the change listener *before* the initial check
    permissionStatus.removeEventListener("change", handlePermissionChange); // Remove previous listener if any
    permissionStatus.addEventListener("change", handlePermissionChange);

    // Handle the initial state
    if (permissionStatus.state === "granted") {
      startCameraStream();
    } else if (permissionStatus.state === "prompt") {
      // Show the PEPC dialog which contains the <permission> element
      permissionDialog.showModal();
    } else if (permissionStatus.state === "denied") {
      permissionContext.textContent =
        "Camera access is denied. Please enable it in your browser settings to use this feature.";
      permissionDialog.showModal(); // Show dialog to display the message
    }
  } catch (error) {
    console.error("Error handling camera permissions:", error);
    // Attempt direct access as a fallback if query fails?
    // alert("Could not check camera permissions. Attempting direct access...");
    // startCameraStream();
    alert(`Error checking camera permissions: ${error.message}`);
  }
}

function showPermissionContextInfo() {
  // This is called when the user dismisses the <permission> element's prompt
  // inside the permissionDialog.
  if (permissionDialog.open) {
    // Check the current state again, as it might have changed just before dismissal
    navigator.permissions.query({ name: "camera" }).then((status) => {
      if (status.state === "prompt") {
        permissionContext.textContent =
          "Camera access is needed for this feature. If you change your mind, click the camera button again.";
      }
    });
  }
}

async function startCameraStream() {
  console.log("Starting camera stream...");
  try {
    currentCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }, // Prefer back camera
      audio: false,
    });
    cameraVideo.srcObject = currentCameraStream;
    // Ensure the video plays when the stream is ready
    cameraVideo.onloadedmetadata = () => {
      cameraDialog.showModal();
      console.log("Camera stream active and dialog shown.");
    };
  } catch (error) {
    console.error("Error accessing camera:", error);
    // Handle specific errors
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      permissionContext.textContent =
        "Camera access was denied. Please enable it in browser settings.";
      if (!permissionDialog.open) permissionDialog.showModal(); // Show context if dialog closed
    } else if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {
      alert("No camera found on this device.");
    } else {
      alert(`Error starting camera: ${error.message}`);
    }
    stopCameraStream(); // Clean up if stream partially started
  }
}

function stopCameraStream() {
  if (currentCameraStream) {
    console.log("Stopping camera stream tracks..."); // Updated log message
    currentCameraStream.getTracks().forEach((track) => track.stop());
    currentCameraStream = null;
    cameraVideo.srcObject = null;
  }
  // DO NOT revoke URL here - it might still be needed for display by the img tag
}

async function handleCameraCapture() {
  console.log("Capturing photo...");
  if (!cameraVideo.srcObject) {
    console.error("Camera stream not active for capture.");
    return;
  }

  // Set canvas dimensions to match video stream dimensions
  cameraCanvas.width = cameraVideo.videoWidth;
  cameraCanvas.height = cameraVideo.videoHeight;

  // Draw the current video frame onto the canvas
  const context = cameraCanvas.getContext("2d");
  context.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);

  // Get the image data as a Blob
  cameraCanvas.toBlob(async (blob) => {
    if (!blob) {
      console.error("Canvas toBlob failed.");
      stopCameraStream();
      cameraDialog.close();
      return;
    }
    console.log("Photo captured as Blob:", blob);
    currentImageBlob = blob; // Store the Blob

    // Create an Object URL for preview
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl); // Revoke previous URL if exists
    }
    currentObjectUrl = URL.createObjectURL(blob);
    selectedImage.src = currentObjectUrl; // Update image preview

    // Close the dialog first, allowing the image to potentially load
    cameraDialog.close();

    // Check translation availability and process the Blob
    await checkAndProcessImage(currentImageBlob);

    // Stop the stream AFTER processing is initiated (or completed)
    // This ensures the source isn't cut off while the blob might be needed
    // or the preview is loading. The tracks are stopped, so the camera light should go off.
    stopCameraStream(); // Stop tracks now
  }, "image/png"); // Specify image format if needed
}

function handleCameraCancel() {
  console.log("Camera cancelled.");
  stopCameraStream();
  cameraDialog.close();
}

// --- File Input Handling ---

function handleFileInputChange(event) {
  const file = event.target.files[0]; // file is already a Blob
  if (file && file.type.startsWith("image/")) {
    console.log("Image file selected:", file.name);
    currentImageBlob = file; // Store the File (Blob) directly

    // Create an Object URL *only* for preview purposes
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl); // Revoke previous URL if exists
    }
    currentObjectUrl = URL.createObjectURL(file);
    selectedImage.src = currentObjectUrl; // Update image preview
    console.log("Image preview loaded.");

    // Proceed to check compatibility and process the Blob
    checkAndProcessImage(currentImageBlob);
  } else {
    console.log("No valid image file selected.");
    currentImageBlob = null;
    selectedImage.src = "#";
    learningSection.hidden = true;
    // Revoke URL if selection is cleared
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }
}

// Helper function to avoid duplicating the check/process logic
async function checkAndProcessImage(imageBlob) {
  if (!imageBlob) {
    console.warn("checkAndProcessImage called with no Blob.");
    return;
  }
  console.log("Checking compatibility and processing image Blob...");
  learningSection.hidden = false; // Show learning section
  descriptionText.textContent = "Checking languages..."; // Initial status

  const canProceed = await checkTranslationAvailability();
  if (canProceed) {
    processImage(imageBlob); // Start the AI processing with the Blob
  } else {
    alert(
      "Selected language pair is not supported for translation. Please choose different languages."
    );
    // Optionally clear image/description/questions
    learningSection.hidden = true;
    selectedImage.src = "#"; // Clear preview
    descriptionText.textContent = "Description will appear here...";
    questionCarousel.innerHTML = "<li>Select a supported language pair.</li>";
    // Revoke URL if processing fails due to language
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
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
async function processImage(imageBlob) {
  // Accept Blob
  if (!imageBlob) {
    console.error("processImage called without a Blob.");
    return;
  }

  // learningSection.hidden = false; // Already shown in checkAndProcessImage
  descriptionText.textContent = "Generating description...";
  questionCarousel.innerHTML = "<li>Generating questions...</li>";

  // 1. Get description using the image Blob
  const description = await getImageDescription(imageBlob); // Pass Blob
  descriptionText.textContent =
    description || "Could not generate description.";

  if (description && !description.startsWith("Error:")) {
    // Check for errors from getImageDescription
    // 2. Translate description to target language
    let translatedDescription = description; // Default to original if translation fails
    translatorStatusDiv.textContent = "Initializing translator..."; // Update status
    translatorStatusDiv.className = "checking";
    try {
      console.log(
        `Attempting to translate description from ${sourceLanguage} to ${targetLanguage}`
      );
      // Use Translator.create directly
      const translator = await Translator.create({
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        // Add monitor for download progress
        monitor: (monitor) => {
          monitor.addEventListener("downloadprogress", (e) => {
            const percent = e.total
              ? Math.round((e.loaded / e.total) * 100)
              : 0;
            translatorStatusDiv.textContent = `Downloading translation model: ${percent}%`;
            translatorStatusDiv.className = "checking"; // Keep checking style during download
            console.log(
              `Translator model downloaded ${e.loaded} of ${e.total} bytes (${percent}%).`
            );
          });
          // Optional: Add listeners for 'downloadcomplete' or 'error' if needed
          // monitor.addEventListener('downloadcomplete', () => console.log('Translator model download complete.'));
          // monitor.addEventListener('error', (e) => console.error('Translator model download error:', e));
        },
      });
      translatedDescription = await translator.translate(description);
      console.log("Translated description:", translatedDescription);
      translatorStatusDiv.textContent = "Translation successful."; // Update status on success
      translatorStatusDiv.className = "available";
      // Optionally display the translated description somewhere?
      // Or just use it for question generation.
    } catch (error) {
      console.error("Error translating description:", error);
      translatorStatusDiv.textContent = "Translation failed."; // Update status on error
      translatorStatusDiv.className = "unavailable";
      // Keep original description if translation fails
      translatedDescription = description;
      // Optionally inform the user translation failed?
      // alert("Could not translate the description. Questions will be based on the original.");
    }

    // 3. Generate questions based on the (potentially translated) description in the target language
    currentQuestions = await getQuestions(
      translatedDescription,
      targetLanguage
    );
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
    //li.style.order = questions.length - index; //
    li.style.zIndex = questions.length - index; // Ensure correct stacking order
    const fig = document.createElement("figure");
    const caption = document.createElement("figcaption");
    caption.textContent = q;
    const img = document.createElement("img");
    img.src = "/images/test.png";
    fig.appendChild(img);
    fig.appendChild(caption);

    li.appendChild(fig);
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

// --- API Functions ---
async function getImageDescription(imageBlob) {
  // Accept Blob
  console.log("getImageDescription called with image Blob:", imageBlob);
  if (!languageModel) {
    console.error("LanguageModel not initialized.");
    return "Error: Language Model not available.";
  }
  if (!imageBlob) {
    // Check for Blob
    console.error("No image Blob provided to getImageDescription.");
    return "Error: No image data.";
  }

  try {
    console.log("Sending image Blob to LanguageModel for description...");
    // Pass the Blob directly in the content array
    const output = await languageModel.prompt([
      "describe this image",
      { type: "image", content: await createImageBitmap(imageBlob) }, // Pass Blob in array
    ]);
    console.log("LanguageModel description output:", output);
    return output; // Return the raw output from the model
  } catch (error) {
    console.error("Error getting image description from LanguageModel:", error);
    return `Error generating description: ${error.message}`;
  }
}

async function getQuestions(description, lang) {
  console.log(`getQuestions called for lang: ${lang}`);
  if (!languageModel) {
    console.error("LanguageModel not initialized.");
    return ["Error: Language Model not available."];
  }
  if (!description) {
    console.error("No description provided to getQuestions.");
    return ["Error: No description provided."];
  }

  try {
    console.log("Sending description to LanguageModel for questions...");
    const prompt = `Generate between 20 and 30 questions in ${lang} based on the following description. Each question should be on a new line:\n\n${description}`;
    const output = await languageModel.prompt([prompt]);
    console.log("LanguageModel questions output:", output);

    // Assuming the output is a single string with newline-separated questions
    const questions = output
      .split("\n")
      .map((q) => q.trim()) // Trim whitespace
      .filter((q) => q.length > 0); // Remove empty lines

    if (questions.length === 0) {
      console.warn("LanguageModel returned no questions.");
      return ["No questions could be generated."];
    }
    return questions;
  } catch (error) {
    console.error("Error getting questions from LanguageModel:", error);
    return [`Error generating questions: ${error.message}`];
  }
}

async function getAnswerFeedback(question, answer) {
  console.log(`getAnswerFeedback called for question: "${question}"`);
  if (!languageModel) {
    console.error("LanguageModel not initialized.");
    return "Error: Language Model not available.";
  }
  if (!question || !answer) {
    console.error("Missing question or answer for feedback.");
    return "Error: Missing question or answer.";
  }

  try {
    console.log("Sending question and answer to LanguageModel for feedback...");
    // Construct a prompt asking the model to evaluate the answer
    // The target language is implicitly handled by the context of the question/answer
    const prompt = `Evaluate the following answer: "${answer}" for the question: "${question}". Provide brief feedback on correctness.`;
    const output = await languageModel.prompt([prompt]);
    console.log("LanguageModel feedback output:", output);
    return output; // Return the raw feedback from the model
  } catch (error) {
    console.error("Error getting feedback from LanguageModel:", error);
    return `Error generating feedback: ${error.message}`;
  }
}

// --- Start the app ---
document.addEventListener("DOMContentLoaded", initializeApp);
