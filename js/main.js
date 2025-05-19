console.log("Language Learning Tool script loaded.");

// --- DOM Elements ---
const learningSection = document.getElementById("learning-section");
const translationSection = document.getElementById("translation-section");

const setupSection = document.getElementById("setup-section");
// Use standard select elements now
const sourceLanguageSelect = document.getElementById("source-language");
const targetLanguageSelect = document.getElementById("target-language");
const proficiencySelect = document.getElementById("proficiency");
const translatorStatusDiv = document.getElementById("translator-status");
// Other elements
const descriptionText = document.getElementById("description-text");
const questionSection = document.getElementById("question-section");
const questionDiv = document.getElementById("questions");

const cameraPermissionElement = document.getElementById(
  "camera-permission-element"
);
const cameraDialog = document.getElementById("camera-dialog");
const cameraVideo = document.getElementById("camera-video");
const cameraCanvas = document.getElementById("camera-canvas");
const cameraCaptureButton = document.getElementById("camera-capture-button");

const btnStart = document.getElementById("start");
const cameraButton = document.getElementById("camera-button");

// --- State ---
let sourceLanguage = "en"; // Default
let targetLanguage = "fr"; // Default
let proficiency = "beginner"; // Default
let currentImageBlob = null; // Store image data as Blob
let currentQuestions = [];
let languageModel = null; // Added for on-device AI model
let currentCameraStream = null; // To hold the active camera stream
let currentObjectUrl = null; // To hold temporary URL for Blob preview

const languageMap = {
  en: "English",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  de: "German",
  it: "Italian",
  jp: "Japanese",
};

// --- Initialization ---
async function initializeApp() {
  console.log("Initializing app...");
  // Set initial select values from state
  sourceLanguageSelect.value = sourceLanguage;
  targetLanguageSelect.value = targetLanguage;
  proficiencySelect.value = proficiency;
  await checkTranslationAvailability(); // Initial check

  addEventListeners();
  // Initialize the Language Model
  try {
    // Check if the API exists (now directly on window)
    if (typeof LanguageModel !== "undefined") {
      console.log("Checking availability...");
      const availabilty = await LanguageModel.availability({
        expectedInputs: [{ type: "image" }],
      });
      console.log("LanguageModel availability:", availabilty);
      if (availabilty !== "available") {
        console.error("LanguageModel not available for image input.");
        return "Error: Language Model not available for image input.";
      }
      console.log("Attempting to create LanguageModel...");
      // Assuming multimodal input is needed based on techContext flags
      languageModel = await LanguageModel.create({
        // Use LanguageModel.create
        expectedInputs: [{ type: "image" }],
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {
            console.log(
              `Language Model: Image, Downloaded ${e.loaded} of ${e.total} bytes.`
            );
          });
        },
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

async function checkCameraPermission() {
  const permission = await navigator.permissions.query({
    name: "camera",
  });

  if (permission.state === "granted") {
    console.log("Camera permission granted.");
    return true;
  }
  return false;
}

async function checkMicrophonePermission() {
  const permission = await navigator.permissions.query({
    name: "microphone",
  });

  if (permission.state === "granted") {
    console.log("Microphone permission granted.");
    return true;
  }
  return false;
}

// --- Event Listeners ---
function addEventListeners() {
  // Use standard change listeners for the select elements
  sourceLanguageSelect.addEventListener("change", handleSourceLanguageChange);
  targetLanguageSelect.addEventListener("change", handleTargetLanguageChange);
  proficiencySelect.addEventListener("change", handleProficiencyChange);
  cameraButton.addEventListener("click", handleCameraButtonClick);

  btnStart.addEventListener("click", startTranslation);

  // Camera Dialog listeners
  cameraCaptureButton.addEventListener("click", handleCameraCapture);
  // // PEPC listener
  // if (cameraPermissionElement) {
  //   cameraPermissionElement.addEventListener(
  //     "promptdismiss",
  //     handleCameraButtonClick
  //   );
  //   cameraPermissionElement.addEventListener(
  //     "promptaction",
  //     handleCameraButtonClick
  //   );
  // } else {
  //   console.warn("Camera permission element not found.");
  // }
}

// --- Event Handlers ---
async function handleSourceLanguageChange(event) {
  const newValue = event.target.value;
  if (sourceLanguage !== newValue) {
    sourceLanguage = newValue;
    console.log("Source language changed to:", sourceLanguage);
    await checkTranslationAvailability(); // Check compatibility on change
  }
}

async function handleTargetLanguageChange(event) {
  const newValue = event.target.value;
  if (targetLanguage !== newValue) {
    targetLanguage = newValue;
    console.log("Target language changed to:", targetLanguage);
    await checkTranslationAvailability(); // Check compatibility on change
  }
}

function handleProficiencyChange() {
  const newValue = event.target.value;
  if (proficiency !== newValue) {
    proficiency = newValue;
    console.log("proficiency changed to:", proficiency);
  }
}

async function startTranslation() {
  console.log("Starting translation...");

  const canProceed = await checkTranslationAvailability();
  if (!canProceed) {
    alert(
      "Selected language pair is not supported for translation. Please choose different languages."
    );
    return;
  }

  const translator = await Translator.create({
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
  });
  console.log("Translator initialized:", translator);
  let idx = 0;

  for (const question of currentQuestions) {
    console.log("Translating question:", question);
    const translation = await translator.translate(question);
    console.log("Translation result:", translation);
    addTranslationToUI(question, translation, idx++);
  }

  document.startViewTransition(() => {
    translationSection.classList.add("visible");
    questionSection.classList.remove("visible");
  });
}

async function checkAnswer(questionSource, questionTranslated, providedAnswer) {
  // It's a hack to be pulling from the DOM, but this is a demo.
  const description = `<description>${descriptionText.textContent}</description>`;

  const answerModel = await LanguageModel.create({
    expectedInputs: [{ type: "text" }, { type: "image" }],
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => {
        console.log(
          `Language Model: Text, Downloaded ${e.loaded} of ${e.total} bytes.`
        );
      });
    },
  });

  const prompt = `The user is a ${proficiency} learning ${languageMap[targetLanguage]} and is trying to answer the provided question. 
  
  Question (${languageMap[targetLanguage]}): ${questionTranslated}
  
  They're answer in (${languageMap[targetLanguage]}) is: ${providedAnswer}

  Using the attached image and description (<description>) is the answer they provided correct?`;

  const output = await answerModel.prompt(
    [
      { type: "text", content: prompt },
      { type: "image", content: await createImageBitmap(currentImageBlob) },
      { type: "text", content: description },
    ],
    {
      responseConstraint: {
        type: "object",
        properties: {
          correct: {
            type: "boolean",
            description: "True if the answer is correct, false otherwise.",
          },
          reason: {
            type: "string",
            description:
              "Explanation of the answer correctness. Help the user understand where they went wrong or could improve their answer. Tell them what the answer should have been if it can be determined",
          },
        },
        additionalProperties: false,
      },
    }
  );

  console.log("Answer Model output:", output);
  return JSON.parse(output);
}

function addTranslationToUI(inputText, translation, idx) {
  const template = document.createElement("template");
  template.innerHTML = `
  <div class="text-question">
  <div class="question"> 
    <span class="question-text">${translation}</span>
    <form>
      <input type="text" class="answer-input" placeholder="Your answer here..." />
      <button class="check-answer-button">Check</button>
    </form
    </div>
    <div class="answer"><!-- answer.correct / answer.incorrect -->
      <div class="incorrect">
        <p><img src="./images/wrong.svg"> Incorrect</p>
        <p>Question: ${inputText}</p>
      </div>
      <div class="correct"><p><img src="./images/tick.svg">Well done!</p></div>
      <div class="reason"></div>    
    </div>
  </div>
  `;

  const translationDiv = document.createElement("div");
  translationDiv.className = "translation";
  translationDiv.style.viewTransitionName = "translation" + idx; // Set view transition name

  const liveNode = template.content.cloneNode(true);
  const answerButton = liveNode.querySelector(".check-answer-button");
  const answerForm = liveNode.querySelector("form");

  const answerInput = async (event) => {
    event.preventDefault(); // Prevent form submission
    const root = event.target.parentElement.parentElement.parentElement;
    const answerInput = root.querySelector(".answer-input");
    const answerElement = root.querySelector(".answer");
    const reasonElement = root.querySelector(".reason");
    const userAnswer = answerInput.value;

    const { correct: isAnswerCorrect, reason } = await checkAnswer(
      inputText,
      translation,
      userAnswer
    );
    console.log("Answer correctness:", isAnswerCorrect);

    const isCorrectTransition = document.startViewTransition(() => {
      answerElement.classList.add(isAnswerCorrect ? "correct" : "incorrect");
      if (isAnswerCorrect == false && reason != undefined) {
        reasonElement.innerText = reason;
      }
    });

    await isCorrectTransition.finished; // Wait for the transition to finish

    root.parentElement.nextElementSibling.scrollIntoView({
      container: "nearest",
    }); // Show the answer
  };

  answerButton.addEventListener("click", answerInput);
  answerForm.addEventListener("submit", answerInput);

  translationDiv.appendChild(liveNode);
  translationSection.appendChild(translationDiv);
}
// --- Camera Permission and Handling ---

async function handleCameraButtonClick() {
  console.log("Camera button clicked");

  // const cameraPermission = await checkCameraPermission();
  // const microphonePermission = await checkMicrophonePermission();

  // if (cameraPermission && microphonePermission == false) {
  //   console.log("Camera and microphone permissions not granted.");
  //   return;
  // }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Camera access (getUserMedia) is not supported by your browser.");
    return;
  }

  await startCameraStream();
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
    cameraVideo.onloadedmetadata = async () => {
      const changeToToggle = document.startViewTransition(() => {
        setupSection.classList.add("move");
      });

      await changeToToggle.finished;

      const showCamera = document.startViewTransition(() => {
        cameraDialog.showModal();
        console.log("Camera stream active and dialog shown.");
      });
    };
  } catch (error) {
    console.error("Error accessing camera:", error);

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

    //learningSection.className = "visible"; // Show learning section

    currentObjectUrl = URL.createObjectURL(blob);
    const newImage = new Image();
    newImage.id = "selected-image"; // Set ID for the new image
    newImage.src = currentObjectUrl; // Set the src to the Object URL

    await new Promise((resolve) => {
      newImage.onload = () => {
        console.log("Image preview loaded.");
        resolve();
      };
    });

    const cameraParent = cameraVideo.parentElement;
    cameraParent.appendChild(newImage); // Append the new image to the camera parent

    //cameraVideo.style.viewTransitionName = "selected-image-transition"; // Set view
    const transition = document.startViewTransition(async () => {
      stopCameraStream(); // Stop tracks now

      const imageParent = document.getElementById("image-display");

      imageParent.append(newImage); // Append the new image to the camera parent
      imageParent.parentElement.classList.add("visible"); // Show image display section

      cameraDialog.close();
    });

    await transition.finished; // Wait for the transition to finish

    await checkAndProcessImage(currentImageBlob);
  }, "image/png"); // Specify image format if needed
}

function handleCameraCancel() {
  console.log("Camera cancelled.");
  stopCameraStream();
  cameraDialog.close();
}

// Helper function to avoid duplicating the check/process logic
async function checkAndProcessImage(imageBlob) {
  if (!imageBlob) {
    console.warn("checkAndProcessImage called with no Blob.");
    return;
  }
  console.log("Checking compatibility and processing image Blob...");

  descriptionText.textContent = "Checking languages..."; // Initial status

  const canProceed = await checkTranslationAvailability();
  if (canProceed) {
    await processImage(imageBlob); // Start the AI processing with the Blob
  } else {
    alert(
      "Selected language pair is not supported for translation. Please choose different languages."
    );
    // Optionally clear image/description/questions
    learningSection.hidden = true;
    //selectedImage.src = "#"; // Clear preview
    descriptionText.textContent = "Description will appear here...";
    // Revoke URL if processing fails due to language
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }
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

  // 1. Get description using the image Blob
  const description = await getImageDescription(imageBlob); // Pass Blob
  descriptionText.textContent =
    description || "Could not generate description.";

  if (description && !description.startsWith("Error:")) {
    // Check for errors from getImageDescription
    currentQuestions = await getQuestions(description, imageBlob);
    populateQuestions(currentQuestions); // Populate the questions list
  } else {
    currentQuestions = [];
  }
}

function populateQuestions(questions) {
  if (!questions || questions.length === 0) {
    questionDiv.innerHTML = "<li>No questions generated.</li>";
    return;
  }
  questionDiv.innerHTML = "";
  questions.forEach((q, index) => {
    const li = document.createElement("li");
    li.style.viewTransitionName = `question${index}`; // Unique name for each question
    const questionText = document.createElement("span");
    questionText.textContent = `${q}`;
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = `<span class="delete">Delete</span>`;
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", (event) => {
      const parent = event.target.parentElement;
      parent.style.viewTransitionName = `deleteQuestion`;
      document.startViewTransition(() => {
        let questionIdx = 0;
        let questionItr = parent;
        while (questionItr.previousElementSibling) {
          questionIdx++;
          questionItr = questionItr.previousElementSibling;
        }
        parent.remove();
        currentQuestions.splice(questionIdx, 1); // Remove question from array
        console.log("Question deleted:", q);
        // Optionally update the  or other UI elements
      });
    });

    li.appendChild(questionText);
    li.appendChild(deleteButton);

    questionDiv.appendChild(li);
    questionSection.className = "visible"; // Show questions section
  });
}

// --- API Functions ---
async function getImageDescription(imageBlob) {
  // Accept Blob
  console.log("getImageDescription called with image Blob:", imageBlob);

  if (!imageBlob) {
    // Check for Blob
    console.error("No image Blob provided to getImageDescription.");
    return "Error: No image data.";
  }

  try {
    console.log("Sending image Blob to LanguageModel for description...");
    const availabilty = await LanguageModel.availability({
      expectedInputs: [{ type: "image" }],
    });
    console.log("LanguageModel availability:", availabilty);
    if (availabilty !== "available") {
      console.error("LanguageModel not available for image input.");
      return "Error: Language Model not available for image input.";
    }

    languageModel = await LanguageModel.create({
      expectedInputs: [{ type: "image" }],
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          console.log(
            `Language Model: Image, Downloaded ${e.loaded} of ${e.total} bytes.`
          );
        });
      },
    });

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

async function getQuestions(description, imageBlob) {
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
    const prompt = `You are a language tutor helping a ${proficiency}. 
    
    Generate 20 to 30 questions in ${languageMap[sourceLanguage]} about the included image and description in <description>. The questions should be simple, clear and be something a ${proficiency} learner can answer.`;
    const output = await languageModel.prompt(
      [
        { type: "text", content: prompt },
        { type: "image", content: await createImageBitmap(imageBlob) },
        { type: "text", content: `<description>${description}</description>` },
        {
          type: "text",
          content: `The questions MUST be in ${languageMap[sourceLanguage]}`,
        },
      ],
      {
        responseConstraint: {
          type: "object",
          required: ["questions"],
          additionalProperties: false,
          properties: {
            questions: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
      }
    );
    console.log("LanguageModel questions output:", output);

    const generatedJSONData = JSON.parse(output).questions; // parseJavaScriptFromPromptString(output); // Assuming the output is a JSON array
    if (!Array.isArray(generatedJSONData)) {
      console.warn("LanguageModel returned non-array questions.");
      return ["No questions could be generated."];
    }

    // Assuming the output is a single string with newline-separated questions
    const questions = generatedJSONData
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

// --- Start the app ---
document.addEventListener("DOMContentLoaded", initializeApp);
