/**
 * =============================================
 * Sarang AI Studio — AI Blockly Blocks
 * =============================================
 *
 * Defines drag-and-drop blocks for AI features:
 *   - Camera AI detection
 *   - Hand gesture events
 *   - Pose detection events
 *   - Face detection events
 *   - Speech command events
 *   - AI → Hardware control
 *
 * Supports bilingual: English + Marathi (मराठी)
 *
 * Author: Sarang AI Studio Team
 */

// ==========================================
// AI Block Colors
// ==========================================
const AI_COLORS = {
    camera: '#9c27b0',     // Purple — matches AI Camera sidebar category
    hand: '#00bcd4',       // Cyan   — matches Hand Gesture sidebar category
    pose: '#ff9800',       // Orange — matches Body Pose sidebar category
    face: '#4caf50',       // Green  — matches Face sidebar category
    speech: '#2196f3',     // Blue   — matches Speech sidebar category
    aiControl: '#e91e63',  // Pink   — matches AI Control sidebar category
};

// ==========================================
// Block Translations
// ==========================================
const BLOCK_TRANSLATIONS = {
    en: {
        // Camera blocks
        whenAIDetects: 'When AI detects',
        do: 'do',
        aiPredictionResult: 'AI Prediction Result',
        aiConfidence: 'AI Confidence (%)',
        startAIPrediction: 'Start AI Prediction',
        stopAIPrediction: 'Stop AI Prediction',
        // Hand blocks
        whenHandGesture: 'When hand gesture',
        openHand: 'Open Hand',
        closedFist: 'Closed Fist',
        pointingUp: 'Pointing Up',
        thumbUp: 'Thumb Up',
        anyGesture: 'Any Gesture',
        currentHandGesture: 'Current Hand Gesture',
        handDetected: 'Hand Detected?',
        // Pose blocks
        whenPose: 'When pose',
        handsRaised: 'Hands Raised',
        armsWide: 'Arms Wide',
        handRaised: 'Hand Raised',
        activeMovement: 'Active Movement',
        standingStill: 'Standing Still',
        anyMovement: 'Any Movement',
        currentBodyPose: 'Current Body Pose',
        // Face blocks
        whenFaceExpression: 'When face expression',
        faceForward: 'Face Forward',
        lookingLeft: 'Looking Left',
        lookingRight: 'Looking Right',
        headUp: 'Head Up',
        headDown: 'Head Down',
        smiling: 'Smiling',
        anyFace: 'Any Face',
        faceDetectedQ: 'Face Detected?',
        faceExpression: 'Face Expression',
        // Speech blocks
        whenISay: 'When I say',
        lastVoiceCommand: 'Last Voice Command',
        startListening: 'Start Listening',
        stopListening: 'Stop Listening',
        // AI Control blocks
        setPin: '   Set Pin',
        motor: '   Motor',
        forward: 'Forward',
        backward: 'Backward',
        stop: 'Stop',
        servoPin: '   Servo Pin',
        angle: 'Angle',
        showAIResultLCD: 'Show AI Result on LCD',
        // Tooltips
        tipWhenDetected: 'Runs when the camera AI detects the specified class.',
        tipPredictionResult: 'Returns the current AI prediction class name.',
        tipConfidence: 'Returns the AI confidence percentage (0-100).',
        tipStartPred: 'Start the AI camera prediction.',
        tipStopPred: 'Stop the AI camera prediction.',
        tipWhenHand: 'Runs when the specified hand gesture is detected.',
        tipCurrentHand: 'Returns the currently detected hand gesture.',
        tipHandDetected: 'Returns TRUE if a hand is currently detected.',
        tipWhenPose: 'Runs when the specified body pose is detected.',
        tipCurrentPose: 'Returns the currently detected body pose.',
        tipWhenFace: 'Runs when the specified face expression is detected.',
        tipFaceDetected: 'Returns TRUE if a face is currently detected.',
        tipFaceExpression: 'Returns the currently detected face expression.',
        tipWhenSpeech: 'Runs when the specified voice command is recognized.',
        tipLastVoice: 'Returns the last recognized voice command.',
        tipStartListen: 'Start the speech recognition engine.',
        tipStopListen: 'Stop the speech recognition engine.',
        tipControlDevice: 'Control a hardware pin based on AI detection.',
        tipControlMotor: 'Control a motor based on AI detection.',
        tipControlServo: 'Control a servo motor based on AI detection.',
        tipPrintResult: 'Display the current AI prediction on LCD or Serial.',
    },
    mr: {
        // Camera blocks
        whenAIDetects: 'AI ओळखल्यावर',
        do: 'करा',
        aiPredictionResult: 'AI अंदाज निकाल',
        aiConfidence: 'AI विश्वास (%)',
        startAIPrediction: 'AI अंदाज सुरू करा',
        stopAIPrediction: 'AI अंदाज थांबवा',
        // Hand blocks
        whenHandGesture: 'हाताचा हावभाव',
        openHand: 'उघडा हात',
        closedFist: 'मूठ बंद',
        pointingUp: 'वर बोट',
        thumbUp: 'अंगठा वर',
        anyGesture: 'कोणताही हावभाव',
        currentHandGesture: 'सध्याचा हाताचा हावभाव',
        handDetected: 'हात ओळखला?',
        // Pose blocks
        whenPose: 'पोझ ओळखल्यावर',
        handsRaised: 'हात वर',
        armsWide: 'हात पसरलेले',
        handRaised: 'हात वर',
        activeMovement: 'सक्रिय हालचाल',
        standingStill: 'स्थिर उभे',
        anyMovement: 'कोणतीही हालचाल',
        currentBodyPose: 'सध्याचा शरीर पोझ',
        // Face blocks
        whenFaceExpression: 'चेहर्‍याचा भाव',
        faceForward: 'चेहरा समोर',
        lookingLeft: 'डावीकडे पाहत',
        lookingRight: 'उजवीकडे पाहत',
        headUp: 'डोके वर',
        headDown: 'डोके खाली',
        smiling: 'हसणे',
        anyFace: 'कोणताही चेहरा',
        faceDetectedQ: 'चेहरा ओळखला?',
        faceExpression: 'चेहर्‍याचा भाव',
        // Speech blocks
        whenISay: 'मी बोललो तर',
        lastVoiceCommand: 'शेवटचा आवाज कमांड',
        startListening: 'ऐकणे सुरू करा',
        stopListening: 'ऐकणे थांबवा',
        // AI Control blocks
        setPin: '   पिन सेट करा',
        motor: '   मोटर',
        forward: 'पुढे',
        backward: 'मागे',
        stop: 'थांबा',
        servoPin: '   सर्वो पिन',
        angle: 'कोन',
        showAIResultLCD: 'AI निकाल LCD वर दाखवा',
        // Tooltips
        tipWhenDetected: 'कॅमेरा AI ने निर्दिष्ट वर्ग ओळखल्यावर चालते.',
        tipPredictionResult: 'सध्याच्या AI अंदाज वर्गाचे नाव परत करते.',
        tipConfidence: 'AI विश्वास टक्केवारी (0-100) परत करते.',
        tipStartPred: 'AI कॅमेरा अंदाज सुरू करा.',
        tipStopPred: 'AI कॅमेरा अंदाज थांबवा.',
        tipWhenHand: 'निर्दिष्ट हाताचा हावभाव ओळखल्यावर चालते.',
        tipCurrentHand: 'सध्या ओळखलेला हाताचा हावभाव परत करते.',
        tipHandDetected: 'हात ओळखला असेल तर TRUE परत करते.',
        tipWhenPose: 'निर्दिष्ट शरीर पोझ ओळखल्यावर चालते.',
        tipCurrentPose: 'सध्या ओळखलेला शरीर पोझ परत करते.',
        tipWhenFace: 'निर्दिष्ट चेहर्‍याचा भाव ओळखल्यावर चालते.',
        tipFaceDetected: 'चेहरा ओळखला असेल तर TRUE परत करते.',
        tipFaceExpression: 'सध्या ओळखलेला चेहर्‍याचा भाव परत करते.',
        tipWhenSpeech: 'निर्दिष्ट आवाज कमांड ओळखल्यावर चालते.',
        tipLastVoice: 'शेवटचा ओळखलेला आवाज कमांड परत करते.',
        tipStartListen: 'आवाज ओळख इंजिन सुरू करा.',
        tipStopListen: 'आवाज ओळख इंजिन थांबवा.',
        tipControlDevice: 'AI ओळखीवर आधारित हार्डवेअर पिन नियंत्रित करा.',
        tipControlMotor: 'AI ओळखीवर आधारित मोटर नियंत्रित करा.',
        tipControlServo: 'AI ओळखीवर आधारित सर्वो मोटर नियंत्रित करा.',
        tipPrintResult: 'सध्याचा AI अंदाज LCD किंवा Serial वर दाखवा.',
    }
};

/**
 * Block translation helper — reads from the global aiLang variable
 * @param {string} key
 * @returns {string}
 */
function bT(key) {
    const lang = (typeof aiLang !== 'undefined') ? aiLang : 'en';
    return (BLOCK_TRANSLATIONS[lang] && BLOCK_TRANSLATIONS[lang][key]) || BLOCK_TRANSLATIONS.en[key] || key;
}

// ==========================================
// CAMERA AI BLOCKS
// ==========================================

Blockly.Blocks['ai_when_detected'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('whenAIDetects'))
            .appendField(new Blockly.FieldTextInput('Class 1'), 'CLASS_NAME');
        this.appendStatementInput('DO')
            .appendField(bT('do'));
        this.setColour(AI_COLORS.camera);
        this.setTooltip(bT('tipWhenDetected'));
        this.setHelpUrl('');
    }
};

Blockly.Blocks['ai_get_prediction'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('aiPredictionResult'));
        this.setOutput(true, 'String');
        this.setColour(AI_COLORS.camera);
        this.setTooltip(bT('tipPredictionResult'));
    }
};

Blockly.Blocks['ai_get_confidence'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('aiConfidence'));
        this.setOutput(true, 'Number');
        this.setColour(AI_COLORS.camera);
        this.setTooltip(bT('tipConfidence'));
    }
};

Blockly.Blocks['ai_start_prediction'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('startAIPrediction'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(AI_COLORS.camera);
        this.setTooltip(bT('tipStartPred'));
    }
};

Blockly.Blocks['ai_stop_prediction'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('stopAIPrediction'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(AI_COLORS.camera);
        this.setTooltip(bT('tipStopPred'));
    }
};

// ==========================================
// HAND GESTURE BLOCKS
// ==========================================

Blockly.Blocks['ai_when_hand'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('whenHandGesture'))
            .appendField(new Blockly.FieldDropdown([
                [bT('openHand'), 'open_hand'],
                [bT('closedFist'), 'closed_fist'],
                [bT('pointingUp'), 'pointing_up'],
                [bT('thumbUp'), 'thumb_up'],
                [bT('anyGesture'), 'any']
            ]), 'GESTURE');
        this.appendStatementInput('DO')
            .appendField(bT('do'));
        this.setColour(AI_COLORS.hand);
        this.setTooltip(bT('tipWhenHand'));
    }
};

Blockly.Blocks['ai_get_hand_gesture'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('currentHandGesture'));
        this.setOutput(true, 'String');
        this.setColour(AI_COLORS.hand);
        this.setTooltip(bT('tipCurrentHand'));
    }
};

Blockly.Blocks['ai_hand_detected'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('handDetected'));
        this.setOutput(true, 'Boolean');
        this.setColour(AI_COLORS.hand);
        this.setTooltip(bT('tipHandDetected'));
    }
};

// ==========================================
// BODY POSE BLOCKS
// ==========================================

Blockly.Blocks['ai_when_pose'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('whenPose'))
            .appendField(new Blockly.FieldDropdown([
                [bT('handsRaised'), 'hands_raised'],
                [bT('armsWide'), 'arms_wide'],
                [bT('handRaised'), 'hand_raised'],
                [bT('activeMovement'), 'active_movement'],
                [bT('standingStill'), 'standing_still'],
                [bT('anyMovement'), 'any']
            ]), 'POSE');
        this.appendStatementInput('DO')
            .appendField(bT('do'));
        this.setColour(AI_COLORS.pose);
        this.setTooltip(bT('tipWhenPose'));
    }
};

Blockly.Blocks['ai_get_pose'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('currentBodyPose'));
        this.setOutput(true, 'String');
        this.setColour(AI_COLORS.pose);
        this.setTooltip(bT('tipCurrentPose'));
    }
};

// ==========================================
// FACE DETECTION BLOCKS
// ==========================================

Blockly.Blocks['ai_when_face'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('whenFaceExpression'))
            .appendField(new Blockly.FieldDropdown([
                [bT('faceForward'), 'face_forward'],
                [bT('lookingLeft'), 'looking_left'],
                [bT('lookingRight'), 'looking_right'],
                [bT('headUp'), 'head_up'],
                [bT('headDown'), 'head_down'],
                [bT('smiling'), 'smiling'],
                [bT('anyFace'), 'any']
            ]), 'EXPRESSION');
        this.appendStatementInput('DO')
            .appendField(bT('do'));
        this.setColour(AI_COLORS.face);
        this.setTooltip(bT('tipWhenFace'));
    }
};

Blockly.Blocks['ai_face_detected'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('faceDetectedQ'));
        this.setOutput(true, 'Boolean');
        this.setColour(AI_COLORS.face);
        this.setTooltip(bT('tipFaceDetected'));
    }
};

Blockly.Blocks['ai_get_face_expression'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('faceExpression'));
        this.setOutput(true, 'String');
        this.setColour(AI_COLORS.face);
        this.setTooltip(bT('tipFaceExpression'));
    }
};

// ==========================================
// SPEECH RECOGNITION BLOCKS
// ==========================================

Blockly.Blocks['ai_when_speech'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('whenISay'))
            .appendField(new Blockly.FieldTextInput('start'), 'COMMAND');
        this.appendStatementInput('DO')
            .appendField(bT('do'));
        this.setColour(AI_COLORS.speech);
        this.setTooltip(bT('tipWhenSpeech'));
    }
};

Blockly.Blocks['ai_get_speech'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('lastVoiceCommand'));
        this.setOutput(true, 'String');
        this.setColour(AI_COLORS.speech);
        this.setTooltip(bT('tipLastVoice'));
    }
};

Blockly.Blocks['ai_start_listening'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('startListening'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(AI_COLORS.speech);
        this.setTooltip(bT('tipStartListen'));
    }
};

Blockly.Blocks['ai_stop_listening'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('stopListening'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(AI_COLORS.speech);
        this.setTooltip(bT('tipStopListen'));
    }
};

// ==========================================
// AI CONTROL BLOCKS
// ==========================================

Blockly.Blocks['ai_control_device'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('whenAIDetects'))
            .appendField(new Blockly.FieldTextInput('Class 1'), 'TRIGGER');
        this.appendDummyInput()
            .appendField(bT('setPin'))
            .appendField(new Blockly.FieldNumber(2, 0, 40), 'PIN')
            .appendField(new Blockly.FieldDropdown([
                ['HIGH', 'HIGH'],
                ['LOW', 'LOW']
            ]), 'STATE');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(AI_COLORS.aiControl);
        this.setTooltip(bT('tipControlDevice'));
    }
};

Blockly.Blocks['ai_control_motor'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('whenAIDetects'))
            .appendField(new Blockly.FieldTextInput('gesture'), 'TRIGGER');
        this.appendDummyInput()
            .appendField(bT('motor'))
            .appendField(new Blockly.FieldDropdown([
                [bT('forward'), 'FORWARD'],
                [bT('backward'), 'BACKWARD'],
                [bT('stop'), 'STOP']
            ]), 'DIRECTION');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(AI_COLORS.aiControl);
        this.setTooltip(bT('tipControlMotor'));
    }
};

Blockly.Blocks['ai_control_servo'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(bT('whenAIDetects'))
            .appendField(new Blockly.FieldTextInput('gesture'), 'TRIGGER');
        this.appendDummyInput()
            .appendField(bT('servoPin'))
            .appendField(new Blockly.FieldNumber(13, 0, 40), 'PIN')
            .appendField(bT('angle'))
            .appendField(new Blockly.FieldNumber(90, 0, 180), 'ANGLE');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(AI_COLORS.aiControl);
        this.setTooltip(bT('tipControlServo'));
    }
};

Blockly.Blocks['ai_print_result'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('📢')
            .appendField(bT('showAIResultLCD'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(AI_COLORS.aiControl);
        this.setTooltip(bT('tipPrintResult'));
    }
};
