/**
 * =============================================
 * ESPY IDE — AI Engine Module
 * =============================================
 *
 * This module provides:
 *   - Camera AI Training (Teachable Machine style)
 *   - Hand Gesture Recognition
 *   - Body Pose Detection
 *   - Face Detection
 *   - Speech Recognition
 *   - Live AI Prediction
 *   - AI ↔ Block integration (events)
 *
 * Uses:
 *   - TensorFlow.js for model training/inference
 *   - MediaPipe for hand/pose/face
 *   - Web Speech API for voice commands
 *
 * Author: Sarang AI Studio Team
 */

// ==========================================
// AI Studio State. 
// ==========================================

/** Current language for AI Studio: 'en' or 'mr' */
let aiLang = 'en';

/** Marathi Translation Dictionary */
const AI_TRANSLATIONS = {
    en: {
        // Panel header
        aiStudio: 'AI Studio',
        // Tabs
        tabCamera: 'Camera AI',
        tabHand: 'Hand',
        tabPose: 'Pose',
        tabFace: 'Face',
        tabSpeech: 'Speech',
        // Camera badge
        cameraOff: 'Camera Off',
        cameraOn: 'Camera On',
        // Prediction
        livePrediction: 'Live Prediction',
        noPredictionYet: 'No prediction yet',
        // Camera AI Mode
        trainingClasses: 'Training Classes',
        addClass: 'Add Class',
        trainModel: 'Train Model',
        training: 'Training...',
        startPrediction: 'Start Prediction',
        stop: 'Stop',
        capture: 'Capture',
        burst: 'Burst (10)',
        samples: 'samples',
        noSamplesYet: 'No samples yet',
        removeClass: 'Remove class',
        // Hand mode
        handTitle: 'Hand Gesture Detection',
        handDesc: 'Show your hand to the camera. The AI will detect:',
        handHint: 'Use gesture blocks to trigger actions!',
        openHand: 'Open Hand',
        closedFist: 'Closed Fist',
        pointingUp: 'Pointing Up',
        thumbUp: 'Thumb Up',
        handDetected: 'Hand Detected',
        // Pose mode
        poseTitle: 'Body Pose Detection',
        poseDesc: 'Stand in front of the camera. The AI will detect:',
        poseHint: 'Use pose blocks to control devices!',
        handsRaised: 'Hands Raised',
        armsWide: 'Arms Wide',
        activeMovement: 'Active Movement',
        standingStill: 'Standing Still',
        slightMovement: 'Slight Movement',
        handRaised: 'Hand Raised',
        movementDetected: 'Movement Detected',
        // Face mode
        faceTitle: 'Face Detection',
        faceDesc: 'Look at the camera. The AI will detect:',
        faceHint: 'Use face blocks to trigger smart actions!',
        faceForward: 'Face Forward',
        lookingLeft: 'Looking Left',
        lookingRight: 'Looking Right',
        headUp: 'Head Up',
        headDown: 'Head Down',
        smileDetection: 'Smile Detection',
        faceDetected: 'Face Detected',
        // Speech mode
        speechTitle: 'Speech Recognition',
        saySomething: 'Say something...',
        startListening: 'Start Listening',
        commandHistory: 'Command History',
        noCommandsYet: 'No commands yet',
        speechHint: 'Try: "Start", "Stop", "Forward", "Light ON"',
        // AI Log
        aiLog: 'AI Log',
        // Status
        aiStandby: 'AI: Standby',
        // Log messages
        logCameraStarted: 'Camera started successfully',
        logCameraError: 'Camera error:',
        logClassAdded: 'Added class:',
        logClassRemoved: 'Removed class:',
        logCaptured: 'Captured sample for',
        logTotal: 'total',
        logBurstComplete: 'Burst capture complete:',
        logSamplesFor: 'samples for',
        logNeedClasses: 'Need at least 2 classes to train',
        logNeedSamples: 'Each class needs at least 3 samples',
        logTraining: 'Training AI model...',
        logTrainSuccess: 'Model trained successfully!',
        logTrainStats: '',
        logClasses: 'classes',
        logTotalSamples: 'total samples',
        logTrainError: 'Training error:',
        logTrainFirst: 'Train a model first!',
        logStartPred: 'Started live prediction',
        logStopPred: 'Prediction stopped',
        logNoCameraFeed: 'No camera feed available',
        logHandMode: 'Hand Gesture mode activated',
        logShowHand: 'Show your hand to the camera',
        logPoseMode: 'Body Pose mode activated',
        logStandCamera: 'Stand in front of the camera',
        logFaceMode: 'Face Detection mode activated',
        logLookCamera: 'Look at the camera',
        logSpeechStarted: 'Speech Recognition started',
        logSpeechHint: 'Say commands like: "Start", "Stop", "Forward", "Light ON"',
        logSpeechStopped: 'Speech Recognition stopped',
        logSpeechUnsupported: 'Speech Recognition not supported in this browser',
        logSpeechError: 'Speech error:',
        logVoice: 'Voice:',
        logModelTrained: 'AI Model trained successfully!',
        confidence: 'confidence',
        // AI Studio button
        aiStudioBtn: 'AI Studio',
    },
    mr: {
        // Panel header
        aiStudio: 'AI स्टुडिओ',
        // Tabs
        tabCamera: 'कॅमेरा AI',
        tabHand: 'हात',
        tabPose: 'पोझ',
        tabFace: 'चेहरा',
        tabSpeech: 'आवाज',
        // Camera badge
        cameraOff: 'कॅमेरा बंद',
        cameraOn: 'कॅमेरा चालू',
        // Prediction
        livePrediction: 'लाइव्ह अंदाज',
        noPredictionYet: 'अजून अंदाज नाही',
        // Camera AI Mode
        trainingClasses: 'प्रशिक्षण वर्ग',
        addClass: 'वर्ग जोडा',
        trainModel: 'मॉडेल प्रशिक्षित करा',
        training: 'प्रशिक्षण...',
        startPrediction: 'अंदाज सुरू करा',
        stop: 'थांबवा',
        capture: 'कॅप्चर',
        burst: 'बर्स्ट (१०)',
        samples: 'नमुने',
        noSamplesYet: 'अजून नमुने नाहीत',
        removeClass: 'वर्ग काढा',
        // Hand mode
        handTitle: 'हाताच्या हावभावांची ओळख',
        handDesc: 'कॅमेर्‍यासमोर हात दाखवा. AI ओळखेल:',
        handHint: 'हावभाव ब्लॉक्स वापरून कृती करा!',
        openHand: 'उघडा हात',
        closedFist: 'मूठ बंद',
        pointingUp: 'वर बोट',
        thumbUp: 'अंगठा वर',
        handDetected: 'हात ओळखला',
        // Pose mode
        poseTitle: 'शरीर पोझ ओळख',
        poseDesc: 'कॅमेर्‍यासमोर उभे राहा. AI ओळखेल:',
        poseHint: 'पोझ ब्लॉक्स वापरून उपकरणे नियंत्रित करा!',
        handsRaised: 'हात वर',
        armsWide: 'हात पसरलेले',
        activeMovement: 'सक्रिय हालचाल',
        standingStill: 'स्थिर उभे',
        slightMovement: 'हलकी हालचाल',
        handRaised: 'हात वर',
        movementDetected: 'हालचाल ओळखली',
        // Face mode
        faceTitle: 'चेहरा ओळख',
        faceDesc: 'कॅमेर्‍याकडे पहा. AI ओळखेल:',
        faceHint: 'चेहरा ब्लॉक्स वापरून स्मार्ट कृती करा!',
        faceForward: 'चेहरा समोर',
        lookingLeft: 'डावीकडे पाहत',
        lookingRight: 'उजवीकडे पाहत',
        headUp: 'डोके वर',
        headDown: 'डोके खाली',
        smileDetection: 'हसण्याची ओळख',
        faceDetected: 'चेहरा ओळखला',
        // Speech mode
        speechTitle: 'आवाज ओळख',
        saySomething: 'काहीतरी बोला...',
        startListening: 'ऐकणे सुरू करा',
        commandHistory: 'कमांड इतिहास',
        noCommandsYet: 'अजून कमांड नाहीत',
        speechHint: 'बोला: "सुरू", "थांबा", "पुढे", "लाइट चालू"',
        // AI Log
        aiLog: 'AI लॉग',
        // Status
        aiStandby: 'AI: स्टँडबाय',
        // Log messages
        logCameraStarted: 'कॅमेरा यशस्वीरित्या सुरू',
        logCameraError: 'कॅमेरा त्रुटी:',
        logClassAdded: 'वर्ग जोडला:',
        logClassRemoved: 'वर्ग काढला:',
        logCaptured: 'नमुना कॅप्चर केला',
        logTotal: 'एकूण',
        logBurstComplete: 'बर्स्ट कॅप्चर पूर्ण:',
        logSamplesFor: 'नमुने',
        logNeedClasses: 'प्रशिक्षणासाठी किमान २ वर्ग हवेत',
        logNeedSamples: 'प्रत्येक वर्गाला किमान ३ नमुने हवेत',
        logTraining: 'AI मॉडेल प्रशिक्षित होत आहे...',
        logTrainSuccess: 'मॉडेल यशस्वीरित्या प्रशिक्षित!',
        logTrainStats: '',
        logClasses: 'वर्ग',
        logTotalSamples: 'एकूण नमुने',
        logTrainError: 'प्रशिक्षण त्रुटी:',
        logTrainFirst: 'आधी मॉडेल प्रशिक्षित करा!',
        logStartPred: 'लाइव्ह अंदाज सुरू',
        logStopPred: 'अंदाज थांबला',
        logNoCameraFeed: 'कॅमेरा फीड उपलब्ध नाही',
        logHandMode: 'हाताच्या हावभाव मोड सक्रिय',
        logShowHand: 'कॅमेर्‍यासमोर हात दाखवा',
        logPoseMode: 'शरीर पोझ मोड सक्रिय',
        logStandCamera: 'कॅमेर्‍यासमोर उभे राहा',
        logFaceMode: 'चेहरा ओळख मोड सक्रिय',
        logLookCamera: 'कॅमेर्‍याकडे पहा',
        logSpeechStarted: 'आवाज ओळख सुरू',
        logSpeechHint: 'कमांड बोला: "सुरू", "थांबा", "पुढे", "लाइट चालू"',
        logSpeechStopped: 'आवाज ओळख थांबली',
        logSpeechUnsupported: 'या ब्राउझरमध्ये आवाज ओळख उपलब्ध नाही',
        logSpeechError: 'आवाज त्रुटी:',
        logVoice: 'आवाज:',
        logModelTrained: 'AI मॉडेल यशस्वीरित्या प्रशिक्षित!',
        confidence: 'विश्वास',
        // AI Studio button
        aiStudioBtn: 'AI स्टुडिओ',
    }
};

/**
 * Get translated text
 * @param {string} key - Translation key
 * @returns {string}
 */
function aiT(key) {
    return (AI_TRANSLATIONS[aiLang] && AI_TRANSLATIONS[aiLang][key]) || AI_TRANSLATIONS.en[key] || key;
}

/**
 * Set AI Studio language and update all UI text
 * @param {string} lang - 'en' or 'mr'
 */
function aiSetLanguage(lang) {
    aiLang = lang;
    aiUpdateAllText();
}

/**
 * Update all AI Studio text to current language
 */
function aiUpdateAllText() {
    // Panel header
    const titleSpan = document.getElementById('aiStudioTitleText');
    if (titleSpan) titleSpan.textContent = aiT('aiStudio');

    // Tabs
    const tabMap = {
        aiTabCameraText: 'tabCamera',
        aiTabHandText: 'tabHand',
        aiTabPoseText: 'tabPose',
        aiTabFaceText: 'tabFace',
        aiTabSpeechText: 'tabSpeech'
    };
    for (const [id, key] of Object.entries(tabMap)) {
        const el = document.getElementById(id);
        if (el) el.textContent = aiT(key);
    }

    // Camera badge
    const badgeText = document.getElementById('aiCameraBadgeText');
    if (badgeText) badgeText.textContent = AIStudio.stream ? aiT('cameraOn') : aiT('cameraOff');

    // Prediction box
    const predTitle = document.getElementById('aiLivePredTitle');
    if (predTitle) predTitle.textContent = aiT('livePrediction');
    const predLabel = document.getElementById('aiPredLabel');
    if (predLabel && (predLabel.textContent === 'No prediction yet' || predLabel.textContent === 'अजून अंदाज नाही')) {
        predLabel.textContent = aiT('noPredictionYet');
    }

    // Camera AI Mode
    const camTitle = document.getElementById('aiTrainingClassesTitle');
    if (camTitle) camTitle.textContent = aiT('trainingClasses');
    const addClassBtnText = document.getElementById('aiAddClassBtnText');
    if (addClassBtnText) addClassBtnText.textContent = aiLang === 'mr' ? 'वर्ग जोडा' : 'Add Class';
    const trainBtn = document.getElementById('aiTrainBtn');
    if (trainBtn && !AIStudio.isTraining) trainBtn.textContent = aiT('trainModel');
    const startPredBtnText = document.getElementById('aiStartPredBtnText');
    if (startPredBtnText) startPredBtnText.textContent = aiLang === 'mr' ? 'अंदाज सुरू करा' : 'Start Prediction';
    const stopPredBtnText = document.getElementById('aiStopPredBtnText');
    if (stopPredBtnText) stopPredBtnText.textContent = aiLang === 'mr' ? 'थांबवा' : 'Stop';

    // Hand Mode
    const handTitle = document.getElementById('aiHandTitle');
    if (handTitle) handTitle.textContent = aiT('handTitle');
    const handDesc = document.getElementById('aiHandDesc');
    if (handDesc) handDesc.textContent = aiT('handDesc');
    const handHint = document.getElementById('aiHandHint');
    if (handHint) handHint.textContent = aiT('handHint');
    document.querySelectorAll('.ai-hand-feat').forEach(feat => {
        const key = feat.dataset.key;
        if (key) feat.textContent = aiT(key);
    });

    // Pose Mode
    const poseTitle = document.getElementById('aiPoseTitle');
    if (poseTitle) poseTitle.textContent = aiT('poseTitle');
    const poseDesc = document.getElementById('aiPoseDesc');
    if (poseDesc) poseDesc.textContent = aiT('poseDesc');
    const poseHint = document.getElementById('aiPoseHint');
    if (poseHint) poseHint.textContent = aiT('poseHint');
    document.querySelectorAll('.ai-pose-feat').forEach(feat => {
        const key = feat.dataset.key;
        if (key) feat.textContent = aiT(key);
    });

    // Face Mode
    const faceTitle = document.getElementById('aiFaceTitle');
    if (faceTitle) faceTitle.textContent = aiT('faceTitle');
    const faceDesc = document.getElementById('aiFaceDesc');
    if (faceDesc) faceDesc.textContent = aiT('faceDesc');
    const faceHint = document.getElementById('aiFaceHint');
    if (faceHint) faceHint.textContent = aiT('faceHint');
    document.querySelectorAll('.ai-face-feat').forEach(feat => {
        const key = feat.dataset.key;
        if (key) feat.textContent = aiT(key);
    });

    // Speech Mode
    const speechTitle = document.getElementById('aiSpeechTitle');
    if (speechTitle) speechTitle.textContent = aiT('speechTitle');
    const speechText = document.getElementById('aiSpeechText');
    if (speechText && (speechText.textContent === 'Say something...' || speechText.textContent === 'काहीतरी बोला...')) {
        speechText.textContent = aiT('saySomething');
    }
    const startListenBtnText = document.getElementById('aiStartListenBtnText');
    if (startListenBtnText) startListenBtnText.textContent = aiLang === 'mr' ? 'ऐकणे सुरू करा' : 'Start Listening';
    const stopListenBtnText = document.getElementById('aiStopListenBtnText');
    if (stopListenBtnText) stopListenBtnText.textContent = aiLang === 'mr' ? 'थांबवा' : 'Stop';
    const cmdHistTitle = document.getElementById('aiCmdHistoryTitle');
    if (cmdHistTitle) cmdHistTitle.textContent = aiT('commandHistory');
    const speechHint = document.getElementById('aiSpeechHint');
    if (speechHint) speechHint.textContent = aiT('speechHint');
    const noCmdsYet = document.getElementById('aiNoCmdsYet');
    if (noCmdsYet && AIStudio.speechCommands.length === 0) {
        noCmdsYet.textContent = aiT('noCommandsYet');
    }

    // AI Console header
    const consoleHeader = document.getElementById('aiConsoleHeader');
    if (consoleHeader) consoleHeader.textContent = aiT('aiLog');

    // AI Studio button in header
    const aiBtn = document.getElementById('btnAIStudio');
    if (aiBtn) aiBtn.innerHTML = `<span class="btn__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/><path d="M12 14a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0v-2a5 5 0 0 0-5-5z"/><path d="M7 7h10"/><path d="M7 17h10"/></svg></span> ${aiT('aiStudioBtn')}`;

    // Status bar AI status
    const aiStatusText = document.getElementById('aiStatusText');
    if (aiStatusText && (aiStatusText.textContent === 'AI: Standby' || aiStatusText.textContent === 'AI: स्टँडबाय')) {
        aiStatusText.textContent = aiT('aiStandby');
    }

    // Re-render class list with new language
    aiRenderClassList();
}


const AIStudio = {
    // Current mode: 'camera', 'hand', 'pose', 'face', 'speech', null
    activeMode: null,

    // Camera stream
    stream: null,
    videoEl: null,

    // Training data for Camera AI
    classes: [],        // [{ name, samples: [ImageData], color }]
    trainedModel: null,
    isTraining: false,
    isPredicting: false,

    // Prediction callback
    onPrediction: null,

    // MediaPipe instances
    hands: null,
    pose: null,
    faceDetection: null,

    // Speech Recognition
    speechRecognition: null,
    speechActive: false,
    speechCommands: [],

    // Animation frame
    animFrameId: null,

    // Canvas for processing
    canvas: null,
    ctx: null,

    // Confidence threshold
    confidenceThreshold: 0.7,

    // Last prediction result
    lastPrediction: null,

    // Event listeners for AI predictions
    eventListeners: {},
};

// ==========================================
// Camera Management
// ==========================================

/**
 * Stop all AI modes and cleanup
 */
function aiStopAllModes() {
    // Stop prediction
    AIStudio.isPredicting = false;
    
    // Cancel any running animation frame
    if (AIStudio.animFrameId) {
        cancelAnimationFrame(AIStudio.animFrameId);
        AIStudio.animFrameId = null;
    }
    
    // Stop camera
    aiStopCamera();
    
    // Reset active mode
    AIStudio.activeMode = null;
}

/**
 * Start camera stream
 * @returns {Promise<MediaStream>}
 */
async function aiStartCamera() {
    try {
        if (AIStudio.stream) {
            aiStopCamera();
        }

        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        };

        AIStudio.stream = await navigator.mediaDevices.getUserMedia(constraints);

        const video = document.getElementById('aiVideoFeed');
        if (video) {
            video.srcObject = AIStudio.stream;
            video.play();
            AIStudio.videoEl = video;
        }

        aiLog('success', aiT('logCameraStarted'));
        const badgeText = document.getElementById('aiCameraBadgeText');
        if (badgeText) badgeText.textContent = aiT('cameraOn');
        return AIStudio.stream;
    } catch (err) {
        aiLog('error', `${aiT('logCameraError')} ${err.message}`);
        throw err;
    }
}

/**
 * Stop camera stream
 */
function aiStopCamera() {
    if (AIStudio.stream) {
        AIStudio.stream.getTracks().forEach(t => t.stop());
        AIStudio.stream = null;
    }
    if (AIStudio.videoEl) {
        AIStudio.videoEl.srcObject = null;
    }
    if (AIStudio.animFrameId) {
        cancelAnimationFrame(AIStudio.animFrameId);
        AIStudio.animFrameId = null;
    }
}

/**
 * Capture current frame from video
 * @returns {ImageData}
 */
function aiCaptureFrame() {
    const video = AIStudio.videoEl || document.getElementById('aiVideoFeed');
    if (!video || !video.videoWidth) return null;

    if (!AIStudio.canvas) {
        AIStudio.canvas = document.createElement('canvas');
        AIStudio.ctx = AIStudio.canvas.getContext('2d');
    }

    AIStudio.canvas.width = 224;
    AIStudio.canvas.height = 224;
    AIStudio.ctx.drawImage(video, 0, 0, 224, 224);

    return AIStudio.ctx.getImageData(0, 0, 224, 224);
}

// ==========================================
// Camera AI Training (Teachable Machine)
// ==========================================

/**
 * Add a new training class
 * @param {string} name
 */
function aiAddClass(name) {
    const colors = ['#e94560', '#00d68f', '#00b4d8', '#ffaa00', '#e040fb', '#76ff03', '#ff6d00', '#8c9eff'];
    const color = colors[AIStudio.classes.length % colors.length];

    AIStudio.classes.push({
        name: name || `Class ${AIStudio.classes.length + 1}`,
        samples: [],
        color: color,
        id: Date.now()
    });

    aiRenderClassList();
    aiLog('info', `${aiT('logClassAdded')} "${name || 'Class ' + AIStudio.classes.length}"`);
}

/**
 * Remove training class
 * @param {number} index
 */
function aiRemoveClass(index) {
    const className = AIStudio.classes[index]?.name;
    AIStudio.classes.splice(index, 1);
    aiRenderClassList();
    aiLog('info', `${aiT('logClassRemoved')} "${className}"`);
}

/**
 * Capture sample for a class
 * @param {number} classIndex
 */
function aiCaptureSample(classIndex) {
    const frame = aiCaptureFrame();
    if (!frame) {
        aiLog('error', aiT('logNoCameraFeed'));
        return;
    }

    if (classIndex >= 0 && classIndex < AIStudio.classes.length) {
        AIStudio.classes[classIndex].samples.push(frame);
        aiRenderClassList();
        aiLog('info', `${aiT('logCaptured')} "${AIStudio.classes[classIndex].name}" (${AIStudio.classes[classIndex].samples.length} ${aiT('logTotal')})`);
    }
}

/**
 * Capture multiple samples rapidly
 * @param {number} classIndex
 * @param {number} count
 * @param {number} interval
 */
function aiBurstCapture(classIndex, count = 10, interval = 200) {
    let captured = 0;
    const timer = setInterval(() => {
        if (captured >= count) {
            clearInterval(timer);
            aiLog('success', `${aiT('logBurstComplete')} ${count} ${aiT('logSamplesFor')} "${AIStudio.classes[classIndex].name}"`);
            return;
        }
        aiCaptureSample(classIndex);
        captured++;
    }, interval);
}

/**
 * Train the AI model using captured samples
 * Uses a simple KNN classifier for real-time training
 */
async function aiTrainModel() {
    if (AIStudio.classes.length < 2) {
        aiLog('error', aiT('logNeedClasses'));
        return;
    }

    const hassamples = AIStudio.classes.every(c => c.samples.length >= 3);
    if (!hassamples) {
        aiLog('error', aiT('logNeedSamples'));
        return;
    }

    AIStudio.isTraining = true;
    aiUpdateTrainButton(true);
    aiLog('info', aiT('logTraining'));

    try {
        // Build a simple feature extraction + nearest neighbor classifier
        // We extract color histogram features from each sample
        const classFeatures = AIStudio.classes.map(cls => {
            return cls.samples.map(sample => extractFeatures(sample));
        });

        AIStudio.trainedModel = {
            type: 'knn',
            classes: AIStudio.classes.map(c => c.name),
            features: classFeatures,
            timestamp: Date.now()
        };

        aiLog('success', aiT('logTrainSuccess'));
        aiLog('info', `${aiT('logTrainStats')} ${AIStudio.classes.length} ${aiT('logClasses')} | ${AIStudio.classes.reduce((a, c) => a + c.samples.length, 0)} ${aiT('logTotalSamples')}`);

        if (typeof showToast === 'function') {
            showToast('success', aiT('logModelTrained'));
        }
    } catch (err) {
        aiLog('error', `${aiT('logTrainError')} ${err.message}`);
    } finally {
        AIStudio.isTraining = false;
        aiUpdateTrainButton(false);
    }
}

/**
 * Extract features from an ImageData
 * @param {ImageData} imgData
 * @returns {number[]}
 */
function extractFeatures(imgData) {
    const data = imgData.data;
    const features = [];

    // Color histogram (8 bins per channel = 24 features)
    const bins = 8;
    const rHist = new Array(bins).fill(0);
    const gHist = new Array(bins).fill(0);
    const bHist = new Array(bins).fill(0);

    const totalPixels = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
        rHist[Math.floor(data[i] / (256 / bins))]++;
        gHist[Math.floor(data[i + 1] / (256 / bins))]++;
        bHist[Math.floor(data[i + 2] / (256 / bins))]++;
    }

    // Normalize
    for (let i = 0; i < bins; i++) {
        features.push(rHist[i] / totalPixels);
        features.push(gHist[i] / totalPixels);
        features.push(bHist[i] / totalPixels);
    }

    // Spatial features (divide into 4x4 grid, get average brightness)
    const gridSize = 4;
    const w = imgData.width;
    const h = imgData.height;
    const cellW = Math.floor(w / gridSize);
    const cellH = Math.floor(h / gridSize);

    for (let gy = 0; gy < gridSize; gy++) {
        for (let gx = 0; gx < gridSize; gx++) {
            let sum = 0;
            let count = 0;
            for (let py = gy * cellH; py < (gy + 1) * cellH; py++) {
                for (let px = gx * cellW; px < (gx + 1) * cellW; px++) {
                    const idx = (py * w + px) * 4;
                    sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    count++;
                }
            }
            features.push(sum / count / 255);
        }
    }

    return features;
}

/**
 * Predict class of current frame
 * @returns {{ className: string, confidence: number, allScores: object }}
 */
function aiPredict() {
    if (!AIStudio.trainedModel) return null;

    const frame = aiCaptureFrame();
    if (!frame) return null;

    const features = extractFeatures(frame);
    const model = AIStudio.trainedModel;

    // KNN prediction
    let bestClass = 0;
    let bestDist = Infinity;
    const distances = [];

    model.features.forEach((classFeats, classIdx) => {
        let minDist = Infinity;
        classFeats.forEach(feat => {
            let dist = 0;
            for (let i = 0; i < features.length; i++) {
                dist += (features[i] - feat[i]) ** 2;
            }
            dist = Math.sqrt(dist);
            if (dist < minDist) minDist = dist;
        });
        distances.push(minDist);
        if (minDist < bestDist) {
            bestDist = minDist;
            bestClass = classIdx;
        }
    });

    // Convert distances to confidence scores
    const totalDist = distances.reduce((a, b) => a + b, 0);
    const scores = {};
    distances.forEach((d, i) => {
        scores[model.classes[i]] = Math.max(0, 1 - d / totalDist);
    });

    // Normalize scores
    const scoreSum = Object.values(scores).reduce((a, b) => a + b, 0);
    Object.keys(scores).forEach(k => { scores[k] /= scoreSum; });

    const result = {
        className: model.classes[bestClass],
        confidence: scores[model.classes[bestClass]],
        allScores: scores
    };

    AIStudio.lastPrediction = result;
    return result;
}

/**
 * Start continuous prediction loop
 */
function aiStartPrediction() {
    // Speech mode uses the Web Speech API — no trained model needed
    if (AIStudio.activeMode === 'speech') {
        AIStudio.isPredicting = true;
        aiLog('info', aiT('logStartPred'));
        aiStartSpeech();
        return;
    }

    // All other modes require a trained camera model
    if (!AIStudio.trainedModel) {
        aiLog('error', aiT('logTrainFirst'));
        return;
    }

    AIStudio.isPredicting = true;
    aiLog('info', aiT('logStartPred'));

    let lastTime = 0;
    const fps = 15; // Limit to 15 FPS
    const interval = 1000 / fps;

    function predictionLoop(timestamp) {
        if (!AIStudio.isPredicting) return;

        // Rate limiting
        if (timestamp - lastTime < interval) {
            AIStudio.animFrameId = requestAnimationFrame(predictionLoop);
            return;
        }
        lastTime = timestamp;

        const result = aiPredict();
        if (result) {
            aiUpdatePredictionDisplay(result);

            // Fire events for block programming
            aiFireEvent('prediction', result);

            if (result.confidence >= AIStudio.confidenceThreshold) {
                aiFireEvent(`class_${result.className}`, result);
            }
        }

        AIStudio.animFrameId = requestAnimationFrame(predictionLoop);
    }

    AIStudio.animFrameId = requestAnimationFrame(predictionLoop);
}

/**
 * Stop prediction
 */
function aiStopPrediction() {
    AIStudio.isPredicting = false;
    if (AIStudio.animFrameId) {
        cancelAnimationFrame(AIStudio.animFrameId);
        AIStudio.animFrameId = null;
    }
    aiLog('info', aiT('logStopPred'));
}

// ==========================================
// Hand Gesture Recognition
// ==========================================

/**
 * Start hand gesture detection
 * Uses canvas-based simple motion/skin detection
 */
async function aiStartHandGesture() {
    // Stop any existing modes first
    aiStopAllModes();
    
    AIStudio.activeMode = 'hand';
    await aiStartCamera();

    aiLog('info', aiT('logHandMode'));
    aiLog('info', aiT('logShowHand'));

    // Start hand detection loop
    const video = AIStudio.videoEl;
    const overlay = document.getElementById('aiCanvasOverlay');
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    let lastTime = 0;
    const fps = 15; // Limit to 15 FPS to reduce CPU usage
    const interval = 1000 / fps;

    function detectHands(timestamp) {
        if (AIStudio.activeMode !== 'hand') return;

        // Rate limiting
        if (timestamp - lastTime < interval) {
            AIStudio.animFrameId = requestAnimationFrame(detectHands);
            return;
        }
        lastTime = timestamp;

        if (video.readyState >= 2) {
            overlay.width = video.videoWidth || 640;
            overlay.height = video.videoHeight || 480;

            ctx.drawImage(video, 0, 0, overlay.width, overlay.height);
            const imageData = ctx.getImageData(0, 0, overlay.width, overlay.height);

            // Simple skin color detection
            const result = detectSkinRegions(imageData, overlay.width, overlay.height);

            // Draw overlay
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            if (result.detected) {
                // Draw hand region
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 3;
                ctx.strokeRect(result.x, result.y, result.w, result.h);

                // Draw label
                ctx.fillStyle = '#00ff88';
                ctx.font = '16px Inter, sans-serif';
                ctx.fillText(`${result.gesture}`, result.x, result.y - 10);

                // Fire event
                aiFireEvent('hand_gesture', {
                    gesture: result.gesture,
                    confidence: result.confidence,
                    position: { x: result.x, y: result.y }
                });

                aiUpdatePredictionDisplay({
                    className: result.gesture,
                    confidence: result.confidence,
                    allScores: { [result.gesture]: result.confidence }
                });
            }
        }

        AIStudio.animFrameId = requestAnimationFrame(detectHands);
    }

    AIStudio.animFrameId = requestAnimationFrame(detectHands);
}

/**
 * Simple skin color detection for hand detection
 */
function detectSkinRegions(imageData, w, h) {
    const data = imageData.data;
    let skinPixels = 0;
    let totalX = 0, totalY = 0;
    let minX = w, minY = h, maxX = 0, maxY = 0;

    for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
            const idx = (y * w + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];

            // Skin color detection in RGB
            if (r > 95 && g > 40 && b > 20 &&
                r > g && r > b &&
                (r - g) > 15 &&
                Math.abs(r - g) > 15 &&
                r - b > 15) {
                skinPixels++;
                totalX += x;
                totalY += y;
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }

    const threshold = (w * h / 4) * 0.03; // At least 3% of sampled pixels

    if (skinPixels > threshold) {
        const regionW = maxX - minX;
        const regionH = maxY - minY;
        const ratio = regionW > 0 ? regionH / regionW : 1;

        // Improved gesture classification based on region shape, size, and density
        let gesture = aiT('handDetected');
        let confidence = Math.min(skinPixels / (threshold * 10), 0.99);

        // Calculate additional features for classification
        const regionArea = regionW * regionH;
        const frameArea = w * h / 4; // divided by 4 since we sample every 2 pixels
        const fillRatio = skinPixels / (regionArea / 4 || 1); // how filled is the bounding box
        const sizeRatio = regionArea / (frameArea || 1); // region size relative to frame

        // Center of mass relative to bounding box center
        const comX = totalX / skinPixels;
        const comY = totalY / skinPixels;
        const boxCenterX = minX + regionW / 2;
        const boxCenterY = minY + regionH / 2;
        const comOffsetX = (comX - boxCenterX) / (regionW || 1);
        const comOffsetY = (comY - boxCenterY) / (regionH || 1);

        if (sizeRatio < 0.02 && regionW < 120 && regionH < 120) {
            // Small compact region → Closed Fist
            gesture = aiT('closedFist');
            confidence = Math.min(confidence * 1.1, 0.95);
        } else if (ratio > 1.8) {
            // Very tall and narrow → Pointing Up
            gesture = aiT('pointingUp');
            confidence = Math.min(confidence * 1.05, 0.95);
        } else if (ratio > 1.3 && comOffsetY < -0.1) {
            // Tall with center of mass shifted up → Thumb Up
            gesture = aiT('thumbUp');
            confidence = Math.min(confidence * 1.0, 0.92);
        } else if (ratio < 0.8 && fillRatio < 0.5) {
            // Wide with low fill (fingers spread) → Open Hand
            gesture = aiT('openHand');
            confidence = Math.min(confidence * 1.1, 0.95);
        } else if (ratio >= 0.8 && ratio <= 1.3 && fillRatio > 0.55) {
            // Square-ish and dense → Closed Fist
            gesture = aiT('closedFist');
            confidence = Math.min(confidence * 0.9, 0.88);
        } else if (ratio < 0.8) {
            // Wide shape → Open Hand
            gesture = aiT('openHand');
        } else {
            // Default fallback
            gesture = aiT('handDetected');
        }

        return {
            detected: true,
            gesture,
            confidence,
            x: minX, y: minY,
            w: regionW, h: regionH,
            centerX: totalX / skinPixels,
            centerY: totalY / skinPixels
        };
    }

    return { detected: false };
}

// ==========================================
// Body Pose Detection
// ==========================================

/**
 * Start body pose detection
 * Simple motion-based pose detection
 */
async function aiStartPoseDetection() {
    // Stop any existing modes first
    aiStopAllModes();
    
    AIStudio.activeMode = 'pose';
    await aiStartCamera();

    aiLog('info', aiT('logPoseMode'));
    aiLog('info', aiT('logStandCamera'));

    const video = AIStudio.videoEl;
    const overlay = document.getElementById('aiCanvasOverlay');
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    let prevFrame = null;
    let lastTime = 0;
    const fps = 15; // Limit to 15 FPS
    const interval = 1000 / fps;

    function detectPose(timestamp) {
        if (AIStudio.activeMode !== 'pose') return;

        // Rate limiting
        if (timestamp - lastTime < interval) {
            AIStudio.animFrameId = requestAnimationFrame(detectPose);
            return;
        }
        lastTime = timestamp;

        if (video.readyState >= 2) {
            overlay.width = video.videoWidth || 640;
            overlay.height = video.videoHeight || 480;

            ctx.drawImage(video, 0, 0, overlay.width, overlay.height);
            const currentFrame = ctx.getImageData(0, 0, overlay.width, overlay.height);

            if (prevFrame) {
                const motion = detectMotion(prevFrame, currentFrame, overlay.width, overlay.height);
                ctx.clearRect(0, 0, overlay.width, overlay.height);

                if (motion.regions.length > 0) {
                    // Draw motion regions
                    motion.regions.forEach(region => {
                        ctx.strokeStyle = '#e040fb';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(region.x, region.y, region.w, region.h);
                    });

                    // Draw skeleton-like connections
                    if (motion.regions.length >= 2) {
                        ctx.strokeStyle = '#76ff03';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(motion.regions[0].cx, motion.regions[0].cy);
                        for (let i = 1; i < motion.regions.length; i++) {
                            ctx.lineTo(motion.regions[i].cx, motion.regions[i].cy);
                        }
                        ctx.stroke();
                    }

                    // Draw dots at centers
                    motion.regions.forEach(region => {
                        ctx.fillStyle = '#ff4081';
                        ctx.beginPath();
                        ctx.arc(region.cx, region.cy, 6, 0, Math.PI * 2);
                        ctx.fill();
                    });

                    // Pose classification
                    const poseResult = classifyPose(motion, overlay.height);
                    ctx.fillStyle = '#76ff03';
                    ctx.font = 'bold 18px Inter, sans-serif';
                    ctx.fillText(`${poseResult.pose}`, 20, 30);

                    aiFireEvent('pose_detected', poseResult);
                    aiUpdatePredictionDisplay({
                        className: poseResult.pose,
                        confidence: poseResult.confidence,
                        allScores: { [poseResult.pose]: poseResult.confidence }
                    });
                }
            }

            prevFrame = currentFrame;
        }

        AIStudio.animFrameId = requestAnimationFrame(detectPose);
    }

    AIStudio.animFrameId = requestAnimationFrame(detectPose);
}

/**
 * Detect motion between two frames
 */
function detectMotion(prev, curr, w, h) {
    const regions = [];
    const blockSize = 32;
    const threshold = 30;

    for (let by = 0; by < h; by += blockSize) {
        for (let bx = 0; bx < w; bx += blockSize) {
            let diff = 0;
            let count = 0;

            for (let y = by; y < Math.min(by + blockSize, h); y += 2) {
                for (let x = bx; x < Math.min(bx + blockSize, w); x += 2) {
                    const idx = (y * w + x) * 4;
                    diff += Math.abs(curr.data[idx] - prev.data[idx]);
                    diff += Math.abs(curr.data[idx + 1] - prev.data[idx + 1]);
                    diff += Math.abs(curr.data[idx + 2] - prev.data[idx + 2]);
                    count++;
                }
            }

            if (count > 0 && diff / count / 3 > threshold) {
                regions.push({
                    x: bx, y: by,
                    w: blockSize, h: blockSize,
                    cx: bx + blockSize / 2,
                    cy: by + blockSize / 2,
                    intensity: diff / count / 3
                });
            }
        }
    }

    return { regions, motionLevel: regions.length };
}

/**
 * Classify pose based on motion regions
 */
function classifyPose(motion, frameHeight) {
    const regions = motion.regions;
    if (regions.length === 0) return { pose: aiT('standingStill'), confidence: 0.5 };

    // Find topmost and bottommost motion
    const topRegion = regions.reduce((a, b) => a.cy < b.cy ? a : b);
    const bottomRegion = regions.reduce((a, b) => a.cy > b.cy ? a : b);
    const leftRegion = regions.reduce((a, b) => a.cx < b.cx ? a : b);
    const rightRegion = regions.reduce((a, b) => a.cx > b.cx ? a : b);

    const spread = rightRegion.cx - leftRegion.cx;
    const height = bottomRegion.cy - topRegion.cy;
    const topPosition = topRegion.cy / frameHeight;

    let pose = aiT('movementDetected');
    let confidence = 0.6;

    if (topPosition < 0.2 && spread > 200) {
        pose = aiT('handsRaised');
        confidence = 0.85;
    } else if (spread > 300) {
        pose = aiT('armsWide');
        confidence = 0.8;
    } else if (motion.motionLevel > 20) {
        pose = aiT('activeMovement');
        confidence = 0.75;
    } else if (motion.motionLevel > 10) {
        pose = aiT('slightMovement');
        confidence = 0.7;
    } else if (topPosition < 0.3) {
        pose = aiT('handRaised');
        confidence = 0.75;
    }

    return { pose, confidence, motionLevel: motion.motionLevel };
}

// ==========================================
// Face Detection
// ==========================================

/**
 * Start face detection
 */
async function aiStartFaceDetection() {
    // Stop any existing modes first
    aiStopAllModes();
    
    AIStudio.activeMode = 'face';
    await aiStartCamera();

    aiLog('info', aiT('logFaceMode'));
    aiLog('info', aiT('logLookCamera'));

    const video = AIStudio.videoEl;
    const overlay = document.getElementById('aiCanvasOverlay');
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    let lastTime = 0;
    const fps = 15; // Limit to 15 FPS
    const interval = 1000 / fps;

    function detectFaces(timestamp) {
        if (AIStudio.activeMode !== 'face') return;

        // Rate limiting
        if (timestamp - lastTime < interval) {
            AIStudio.animFrameId = requestAnimationFrame(detectFaces);
            return;
        }
        lastTime = timestamp;

        if (video.readyState >= 2) {
            overlay.width = video.videoWidth || 640;
            overlay.height = video.videoHeight || 480;

            ctx.drawImage(video, 0, 0, overlay.width, overlay.height);
            const imageData = ctx.getImageData(0, 0, overlay.width, overlay.height);

            // Simple face detection using skin color + shape
            const faceResult = detectFaceRegion(imageData, overlay.width, overlay.height);

            ctx.clearRect(0, 0, overlay.width, overlay.height);

            if (faceResult.detected) {
                // Draw face rectangle with rounded corners
                ctx.strokeStyle = '#00d68f';
                ctx.lineWidth = 3;
                drawRoundedRect(ctx, faceResult.x, faceResult.y, faceResult.w, faceResult.h, 12);
                ctx.stroke();

                // Face landmarks (approximate)
                ctx.fillStyle = '#00d68f';
                const midX = faceResult.x + faceResult.w / 2;
                const midY = faceResult.y + faceResult.h / 2;

                // Eyes
                ctx.beginPath();
                ctx.arc(midX - faceResult.w * 0.15, midY - faceResult.h * 0.1, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(midX + faceResult.w * 0.15, midY - faceResult.h * 0.1, 4, 0, Math.PI * 2);
                ctx.fill();

                // Nose
                ctx.beginPath();
                ctx.arc(midX, midY + faceResult.h * 0.05, 3, 0, Math.PI * 2);
                ctx.fill();

                // Mouth line
                ctx.beginPath();
                ctx.arc(midX, midY + faceResult.h * 0.2, faceResult.w * 0.12, 0, Math.PI);
                ctx.stroke();

                // Label
                ctx.fillStyle = '#00d68f';
                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.fillText(`${faceResult.expression}`, faceResult.x, faceResult.y - 12);
                ctx.font = '13px Inter, sans-serif';
                ctx.fillText(`${Math.round(faceResult.confidence * 100)}% confidence`, faceResult.x, faceResult.y - 30);

                aiFireEvent('face_detected', faceResult);
                aiUpdatePredictionDisplay({
                    className: faceResult.expression,
                    confidence: faceResult.confidence,
                    allScores: { [faceResult.expression]: faceResult.confidence }
                });
            }
        }

        AIStudio.animFrameId = requestAnimationFrame(detectFaces);
    }

    AIStudio.animFrameId = requestAnimationFrame(detectFaces);
}

/**
 * Simple face detection
 */
function detectFaceRegion(imageData, w, h) {
    const data = imageData.data;
    let skinPixels = 0;
    let totalX = 0, totalY = 0;
    let minX = w, minY = h, maxX = 0, maxY = 0;

    // Focus on upper portion (face area)
    const scanHeight = Math.floor(h * 0.75);

    for (let y = 0; y < scanHeight; y += 2) {
        for (let x = 0; x < w; x += 2) {
            const idx = (y * w + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];

            // Skin detection
            if (r > 95 && g > 40 && b > 20 &&
                r > g && r > b &&
                (r - g) > 15) {
                skinPixels++;
                totalX += x;
                totalY += y;
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }

    const threshold = (w * scanHeight / 4) * 0.02;

    if (skinPixels > threshold) {
        const regionW = maxX - minX;
        const regionH = maxY - minY;
        const ratio = regionH / Math.max(regionW, 1);
        const centerY = totalY / skinPixels;

        let expression = aiT('faceDetected');
        let confidence = Math.min(0.6 + skinPixels / (threshold * 20), 0.95);

        // Estimate expression based on region properties
        if (ratio > 1.0 && ratio < 1.8) {
            expression = aiT('faceForward');
            if (centerY < h * 0.25) {
                expression = aiT('headUp');
            } else if (centerY > h * 0.4) {
                expression = aiT('headDown');
            }
        }

        const cx = totalX / skinPixels;
        const upperFaceY = minY + regionH * 0.3;
        const lowerFaceY = minY + regionH * 0.7;

        // Detect smile: look for relative brightness difference in lower face
        // (mouth region tends to be brighter when smiling due to teeth)
        let upperBrightness = 0, lowerBrightness = 0, upperCount = 0, lowerCount = 0;
        for (let y2 = Math.floor(upperFaceY); y2 < Math.floor(lowerFaceY); y2 += 2) {
            for (let x2 = Math.max(0, Math.floor(minX)); x2 < Math.min(w, Math.floor(maxX)); x2 += 2) {
                const idx2 = (y2 * w + x2) * 4;
                const brightness = (data[idx2] + data[idx2+1] + data[idx2+2]) / 3;
                if (y2 < (upperFaceY + lowerFaceY) / 2) {
                    upperBrightness += brightness; upperCount++;
                } else {
                    lowerBrightness += brightness; lowerCount++;
                }
            }
        }
        const smileBrightnessRatio = upperCount > 0 && lowerCount > 0
            ? (lowerBrightness / lowerCount) / (upperBrightness / upperCount)
            : 1;
        const isSmiling = smileBrightnessRatio > 1.08;

        if (cx < w * 0.35) {
            expression = aiT('lookingRight');
        } else if (cx > w * 0.65) {
            expression = aiT('lookingLeft');
        } else if (isSmiling) {
            expression = 'Smiling';
        }

        return {
            detected: true,
            expression,
            confidence,
            x: Math.max(0, minX - 20),
            y: Math.max(0, minY - 20),
            w: regionW + 40,
            h: regionH + 40,
            centerX: cx,
            centerY: centerY
        };
    }

    return { detected: false };
}

/**
 * Draw rounded rectangle
 */
function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ==========================================
// Speech Recognition
// ==========================================

/**
 * Start speech recognition
 */
function aiStartSpeech() {
    AIStudio.activeMode = 'speech';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        aiLog('error', aiT('logSpeechUnsupported'));
        return;
    }

    AIStudio.speechRecognition = new SpeechRecognition();
    AIStudio.speechRecognition.continuous = true;
    AIStudio.speechRecognition.interimResults = true;
    AIStudio.speechRecognition.lang = aiLang === 'mr' ? 'mr-IN' : 'en-US';

    AIStudio.speechRecognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Show interim results
        const speechDisplay = document.getElementById('aiSpeechText');
        if (speechDisplay) {
            speechDisplay.textContent = finalTranscript || interimTranscript;
        }

        if (finalTranscript) {
            const command = finalTranscript.trim().toLowerCase();
            aiLog('info', `${aiT('logVoice')} "${finalTranscript.trim()}"`);

            // Add to speech commands list
            AIStudio.speechCommands.push({
                text: finalTranscript.trim(),
                timestamp: Date.now()
            });

            // Fire event
            aiFireEvent('speech_command', {
                command: command,
                fullText: finalTranscript.trim(),
                confidence: event.results[event.resultIndex][0].confidence
            });

            // Update display
            aiUpdatePredictionDisplay({
                className: `Voice: "${finalTranscript.trim()}"`,
                confidence: event.results[event.resultIndex][0].confidence || 0.8,
                allScores: { [finalTranscript.trim()]: 1.0 }
            });

            // Update speech history
            aiRenderSpeechHistory();

            // Check for built-in commands
            processVoiceCommand(command);
        }
    };

    AIStudio.speechRecognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
            aiLog('error', `${aiT('logSpeechError')} ${event.error}`);
        }
    };

    AIStudio.speechRecognition.onend = () => {
        // Restart if still active
        if (AIStudio.activeMode === 'speech') {
            try {
                AIStudio.speechRecognition.start();
            } catch (e) {
                // Already started
            }
        }
    };

    AIStudio.speechRecognition.start();
    AIStudio.speechActive = true;
    aiLog('success', aiT('logSpeechStarted'));
    aiLog('info', aiT('logSpeechHint'));
}

/**
 * Stop speech recognition
 */
function aiStopSpeech() {
    if (AIStudio.speechRecognition) {
        AIStudio.speechRecognition.stop();
        AIStudio.speechRecognition = null;
    }
    AIStudio.speechActive = false;
    AIStudio.activeMode = null;
    aiLog('info', aiT('logSpeechStopped'));
}

/**
 * Process built-in voice commands
 */
function processVoiceCommand(command) {
    const commands = {
        'start': () => aiLog('success', 'Command: START'),
        'stop': () => aiLog('success', 'Command: STOP'),
        'forward': () => aiLog('success', 'Command: FORWARD'),
        'backward': () => aiLog('success', 'Command: BACKWARD'),
        'left': () => aiLog('success', 'Command: LEFT'),
        'right': () => aiLog('success', 'Command: RIGHT'),
        'light on': () => aiLog('success', 'Command: LIGHT ON'),
        'light off': () => aiLog('success', 'Command: LIGHT OFF'),
        'motor on': () => aiLog('success', 'Command: MOTOR ON'),
        'motor off': () => aiLog('success', 'Command: MOTOR OFF'),
    };

    for (const [key, action] of Object.entries(commands)) {
        if (command.includes(key)) {
            action();
            break;
        }
    }
}

// ==========================================
// AI Event System (for block integration)
// ==========================================

/**
 * Register an event listener
 */
function aiOnEvent(eventName, callback) {
    if (!AIStudio.eventListeners[eventName]) {
        AIStudio.eventListeners[eventName] = [];
    }
    AIStudio.eventListeners[eventName].push(callback);
}

/**
 * Fire an event
 */
function aiFireEvent(eventName, data) {
    const listeners = AIStudio.eventListeners[eventName] || [];
    listeners.forEach(cb => {
        try { cb(data); } catch (e) { console.error('AI Event error:', e); }
    });

    // Also update the global AI state for blocks to read
    window.__aiLastEvent = { name: eventName, data, timestamp: Date.now() };
}

// ==========================================
// UI Rendering Helpers
// ==========================================

/**
 * Render class list in training panel
 */
function aiRenderClassList() {
    const container = document.getElementById('aiClassList');
    if (!container) return;

    container.innerHTML = AIStudio.classes.map((cls, idx) => `
        <div class="ai-class-card" style="border-left: 4px solid ${cls.color}">
            <div class="ai-class-card__header">
                <input type="text" class="ai-class-card__name" value="${cls.name}" 
                    onchange="AIStudio.classes[${idx}].name = this.value" 
                    id="aiClassName${idx}"/>
                <span class="ai-class-card__count">${cls.samples.length} ${aiT('samples')}</span>
                <button class="ai-class-card__remove" onclick="aiRemoveClass(${idx})" title="${aiT('removeClass')}">✕</button>
            </div>
            <div class="ai-class-card__actions">
                <button class="btn btn--ai-capture" onclick="aiCaptureSample(${idx})" id="aiCaptureSample${idx}">
                    ${aiT('capture')}
                </button>
                <button class="btn btn--ai-burst" onclick="aiBurstCapture(${idx})" id="aiBurstCapture${idx}">
                    ${aiT('burst')}
                </button>
            </div>
            <div class="ai-class-card__samples" id="aiSamples${idx}">
                ${cls.samples.length > 0 ? `<span class="ai-sample-dots">
                    ${cls.samples.slice(-8).map(() => `<span class="ai-sample-dot" style="background:${cls.color}"></span>`).join('')}
                    ${cls.samples.length > 8 ? `<span class="ai-sample-more">+${cls.samples.length - 8}</span>` : ''}
                </span>` : `<span class="ai-no-samples">${aiT('noSamplesYet')}</span>`}
            </div>
        </div>
    `).join('');
}

/**
 * Update prediction display
 */
function aiUpdatePredictionDisplay(result) {
    const predLabel = document.getElementById('aiPredLabel');
    const predConf = document.getElementById('aiPredConfidence');
    const predBars = document.getElementById('aiPredBars');

    if (predLabel) {
        predLabel.textContent = result.className;
        predLabel.style.color = result.confidence > 0.7 ? '#00d68f' : '#ffaa00';
    }

    if (predConf) {
        predConf.textContent = `${Math.round(result.confidence * 100)}%`;
        predConf.style.width = `${Math.round(result.confidence * 100)}%`;
    }

    if (predBars && result.allScores) {
        predBars.innerHTML = Object.entries(result.allScores)
            .sort(([, a], [, b]) => b - a)
            .map(([name, score]) => `
                <div class="ai-pred-bar">
                    <span class="ai-pred-bar__label">${name}</span>
                    <div class="ai-pred-bar__track">
                        <div class="ai-pred-bar__fill" style="width:${Math.round(score * 100)}%;background:${score > 0.7 ? '#00d68f' : score > 0.4 ? '#ffaa00' : '#e94560'}"></div>
                    </div>
                    <span class="ai-pred-bar__value">${Math.round(score * 100)}%</span>
                </div>
            `).join('');
    }
}

/**
 * Update train button state
 */
function aiUpdateTrainButton(training) {
    const btn = document.getElementById('aiTrainBtn');
    if (btn) {
        btn.disabled = training;
        btn.innerHTML = training
            ? `<span class="ai-spinner"></span> ${aiT('training')}`
            : aiT('trainModel');
    }
}

/**
 * Render speech history
 */
function aiRenderSpeechHistory() {
    const container = document.getElementById('aiSpeechHistory');
    if (!container) return;

    const recent = AIStudio.speechCommands.slice(-5).reverse();
    container.innerHTML = recent.map(cmd => `
        <div class="ai-speech-item">
            <span class="ai-speech-item__icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></span>
            <span class="ai-speech-item__text">"${cmd.text}"</span>
            <span class="ai-speech-item__time">${new Date(cmd.timestamp).toLocaleTimeString()}</span>
        </div>
    `).join('');
}

/**
 * Log to AI console
 */
function aiLog(type, message) {
    // Use main console if available
    if (typeof logToConsole === 'function') {
        logToConsole(type, message);
    }

    // Also log to AI-specific log
    const aiConsole = document.getElementById('aiConsoleBody');
    if (aiConsole) {
        const colors = {
            info: '#00b4d8',
            success: '#00d68f',
            error: '#ff3d71',
            warning: '#ffaa00'
        };
        const line = document.createElement('div');
        line.className = 'ai-console-line';
        line.innerHTML = `
            <span class="ai-console-time">${new Date().toLocaleTimeString()}</span>
            <span style="color:${colors[type] || '#eaeaea'}">${message}</span>
        `;
        aiConsole.appendChild(line);
        aiConsole.scrollTop = aiConsole.scrollHeight;
    }
}

// ==========================================
// AI Studio Panel Management
// ==========================================

/**
 * Open AI Studio panel
 */
function aiOpenStudio() {
    const panel = document.getElementById('aiStudioPanel');
    if (panel) {
        panel.classList.add('ai-studio--open');
        document.getElementById('app').classList.add('app--ai-open');
    }
}

/**
 * Close AI Studio panel
 */
function aiCloseStudio() {
    aiStopAll();
    const panel = document.getElementById('aiStudioPanel');
    if (panel) {
        panel.classList.remove('ai-studio--open');
        document.getElementById('app').classList.remove('app--ai-open');
    }
}

/**
 * Stop all AI features
 */
function aiStopAll() {
    aiStopCamera();
    aiStopPrediction();
    aiStopSpeech();
    AIStudio.activeMode = null;
}

/**
 * Switch AI mode tab
 */
function aiSwitchMode(mode) {
    // Stop current mode
    aiStopAll();

    // Update tab UI
    document.querySelectorAll('.ai-tab').forEach(tab => {
        tab.classList.toggle('ai-tab--active', tab.dataset.mode === mode);
    });

    // Show relevant content
    document.querySelectorAll('.ai-mode-content').forEach(content => {
        content.classList.toggle('ai-mode-content--active', content.id === `aiMode_${mode}`);
    });

    // Start new mode
    switch (mode) {
        case 'camera':
            aiStartCamera();
            break;
        case 'hand':
            aiStartHandGesture();
            break;
        case 'pose':
            aiStartPoseDetection();
            break;
        case 'face':
            aiStartFaceDetection();
            break;
        case 'speech':
            aiStartSpeech();
            break;
    }

    AIStudio.activeMode = mode;
}

// ==========================================
// Project Save/Load for AI data
// ==========================================

/**
 * Get AI state for saving
 */
function aiGetSaveData() {
    return {
        classes: AIStudio.classes.map(c => ({
            name: c.name,
            sampleCount: c.samples.length,
            color: c.color
        })),
        speechCommands: AIStudio.speechCommands,
        confidenceThreshold: AIStudio.confidenceThreshold,
        hasTrainedModel: !!AIStudio.trainedModel
    };
}

/**
 * Restore AI state from saved data
 */
function aiLoadSaveData(data) {
    if (!data) return;
    if (data.confidenceThreshold) {
        AIStudio.confidenceThreshold = data.confidenceThreshold;
    }
    if (data.speechCommands) {
        AIStudio.speechCommands = data.speechCommands;
    }
}

// Make functions globally available
window.AIStudio = AIStudio;
window.aiOpenStudio = aiOpenStudio;
window.aiCloseStudio = aiCloseStudio;
window.aiSwitchMode = aiSwitchMode;
window.aiAddClass = aiAddClass;
window.aiRemoveClass = aiRemoveClass;
window.aiCaptureSample = aiCaptureSample;
window.aiBurstCapture = aiBurstCapture;
window.aiTrainModel = aiTrainModel;
window.aiStartPrediction = aiStartPrediction;
window.aiStopPrediction = aiStopPrediction;
window.aiStartSpeech = aiStartSpeech;
window.aiStopSpeech = aiStopSpeech;
window.aiStopAll = aiStopAll;
window.aiOnEvent = aiOnEvent;
window.aiFireEvent = aiFireEvent;
window.aiGetSaveData = aiGetSaveData;
window.aiLoadSaveData = aiLoadSaveData;
window.aiSetLanguage = aiSetLanguage;
window.aiT = aiT;
window.aiUpdateAllText = aiUpdateAllText;
