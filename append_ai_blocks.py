import os

# Define the colors
colors = {
    'ai_camera': '#9c27b0',
    'hand_gesture': '#00bcd4',
    'body_pose': '#ff9800',
    'face': '#4caf50',
    'speech': '#2196f3',
    'ai_control': '#e91e63'
}

blocks_js = f"""
// ==========================================
// AI Blocks Definitions
// ==========================================

// AI Camera
Blockly.Blocks['ai_when_detected'] = {{
    init: function() {{
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("When object")
            .appendField(new Blockly.FieldDropdown([["person", "person"], ["bottle", "bottle"], ["car", "car"]]), "OBJECT")
            .appendField("detected");
        this.setColour('{colors['ai_camera']}');
        this.setTooltip("Runs when a specific object is detected");
    }}
}};
Blockly.Blocks['ai_get_prediction'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Get prediction");
        this.setOutput(true, "String");
        this.setColour('{colors['ai_camera']}');
    }}
}};
Blockly.Blocks['ai_get_confidence'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Get confidence");
        this.setOutput(true, "Number");
        this.setColour('{colors['ai_camera']}');
    }}
}};
Blockly.Blocks['ai_start_prediction'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Start prediction");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('{colors['ai_camera']}');
    }}
}};
Blockly.Blocks['ai_stop_prediction'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Stop prediction");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('{colors['ai_camera']}');
    }}
}};

// Hand Gesture
Blockly.Blocks['ai_when_hand'] = {{
    init: function() {{
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("When hand gesture")
            .appendField(new Blockly.FieldDropdown([["open hand", "open"], ["closed fist", "fist"], ["thumbs up", "thumbs up"]]), "GESTURE")
            .appendField("detected");
        this.setColour('{colors['hand_gesture']}');
    }}
}};
Blockly.Blocks['ai_get_hand_gesture'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Get hand gesture");
        this.setOutput(true, "String");
        this.setColour('{colors['hand_gesture']}');
    }}
}};
Blockly.Blocks['ai_hand_detected'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Hand detected");
        this.setOutput(true, "Boolean");
        this.setColour('{colors['hand_gesture']}');
    }}
}};

// Body Pose
Blockly.Blocks['ai_when_pose'] = {{
    init: function() {{
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("When body pose")
            .appendField(new Blockly.FieldDropdown([["standing", "standing"], ["sitting", "sitting"]]), "POSE")
            .appendField("detected");
        this.setColour('{colors['body_pose']}');
    }}
}};
Blockly.Blocks['ai_get_pose'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Get body pose");
        this.setOutput(true, "String");
        this.setColour('{colors['body_pose']}');
    }}
}};

// Face
Blockly.Blocks['ai_when_face'] = {{
    init: function() {{
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("When face expression")
            .appendField(new Blockly.FieldDropdown([["happy", "happy"], ["sad", "sad"], ["surprised", "surprised"]]), "EXPRESSION")
            .appendField("detected");
        this.setColour('{colors['face']}');
    }}
}};
Blockly.Blocks['ai_face_detected'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Face detected");
        this.setOutput(true, "Boolean");
        this.setColour('{colors['face']}');
    }}
}};
Blockly.Blocks['ai_get_face_expression'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Get face expression");
        this.setOutput(true, "String");
        this.setColour('{colors['face']}');
    }}
}};

// Speech
Blockly.Blocks['ai_when_speech'] = {{
    init: function() {{
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("When speech heard:")
            .appendField(new Blockly.FieldTextInput("hello"), "TEXT");
        this.setColour('{colors['speech']}');
    }}
}};
Blockly.Blocks['ai_get_speech'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Get heard speech");
        this.setOutput(true, "String");
        this.setColour('{colors['speech']}');
    }}
}};
Blockly.Blocks['ai_start_listening'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Start listening");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('{colors['speech']}');
    }}
}};
Blockly.Blocks['ai_stop_listening'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Stop listening");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('{colors['speech']}');
    }}
}};

// AI Control
Blockly.Blocks['ai_control_device'] = {{
    init: function() {{
        this.appendDummyInput()
            .appendField("Control device")
            .appendField(new Blockly.FieldDropdown([["light", "light"], ["fan", "fan"]]), "DEVICE")
            .appendField("state")
            .appendField(new Blockly.FieldDropdown([["ON", "ON"], ["OFF", "OFF"]]), "STATE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('{colors['ai_control']}');
    }}
}};
Blockly.Blocks['ai_control_motor'] = {{
    init: function() {{
        this.appendValueInput("SPEED")
            .setCheck("Number")
            .appendField("Control motor")
            .appendField(new Blockly.FieldDropdown([["forward", "forward"], ["backward", "backward"], ["stop", "stop"]]), "DIR")
            .appendField("speed");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('{colors['ai_control']}');
    }}
}};
Blockly.Blocks['ai_control_servo'] = {{
    init: function() {{
        this.appendValueInput("ANGLE")
            .setCheck("Number")
            .appendField("Control servo pin")
            .appendField(new Blockly.FieldNumber(9, 0, 39), "PIN")
            .appendField("angle");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('{colors['ai_control']}');
    }}
}};
Blockly.Blocks['ai_print_result'] = {{
    init: function() {{
        this.appendDummyInput().appendField("Print AI result");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('{colors['ai_control']}');
    }}
}};
"""

with open('blocks/custom_blocks.js', 'a') as f:
    f.write(blocks_js)

print("Added blocks to custom_blocks.js")

generator_js = """
// ==========================================
// AI Generators (Stubs)
// ==========================================
Blockly.Arduino['ai_when_detected'] = function(block) { return '// AI when detected\\n'; };
Blockly.Arduino['ai_get_prediction'] = function(block) { return ['"prediction"', Blockly.Arduino.ORDER_ATOMIC]; };
Blockly.Arduino['ai_get_confidence'] = function(block) { return ['0', Blockly.Arduino.ORDER_ATOMIC]; };
Blockly.Arduino['ai_start_prediction'] = function(block) { return '// start prediction\\n'; };
Blockly.Arduino['ai_stop_prediction'] = function(block) { return '// stop prediction\\n'; };

Blockly.Arduino['ai_when_hand'] = function(block) { return '// AI when hand\\n'; };
Blockly.Arduino['ai_get_hand_gesture'] = function(block) { return ['"gesture"', Blockly.Arduino.ORDER_ATOMIC]; };
Blockly.Arduino['ai_hand_detected'] = function(block) { return ['false', Blockly.Arduino.ORDER_ATOMIC]; };

Blockly.Arduino['ai_when_pose'] = function(block) { return '// AI when pose\\n'; };
Blockly.Arduino['ai_get_pose'] = function(block) { return ['"pose"', Blockly.Arduino.ORDER_ATOMIC]; };

Blockly.Arduino['ai_when_face'] = function(block) { return '// AI when face\\n'; };
Blockly.Arduino['ai_face_detected'] = function(block) { return ['false', Blockly.Arduino.ORDER_ATOMIC]; };
Blockly.Arduino['ai_get_face_expression'] = function(block) { return ['"expression"', Blockly.Arduino.ORDER_ATOMIC]; };

Blockly.Arduino['ai_when_speech'] = function(block) { return '// AI when speech\\n'; };
Blockly.Arduino['ai_get_speech'] = function(block) { return ['"speech"', Blockly.Arduino.ORDER_ATOMIC]; };
Blockly.Arduino['ai_start_listening'] = function(block) { return '// start listening\\n'; };
Blockly.Arduino['ai_stop_listening'] = function(block) { return '// stop listening\\n'; };

Blockly.Arduino['ai_control_device'] = function(block) { return '// control device\\n'; };
Blockly.Arduino['ai_control_motor'] = function(block) { return '// control motor\\n'; };
Blockly.Arduino['ai_control_servo'] = function(block) { return '// control servo\\n'; };
Blockly.Arduino['ai_print_result'] = function(block) { return '// print AI result\\n'; };
"""

# Append to arduino_generator.js
with open('generator/arduino_generator.js', 'a') as f:
    f.write(generator_js)

# Replace Blockly.Arduino with Blockly.MicroPython for python generator
micropython_js = generator_js.replace('Blockly.Arduino', 'Blockly.MicroPython')
# Python uses "None", "False", etc.
micropython_js = micropython_js.replace("['false'", "['False'")
micropython_js = micropython_js.replace("['0'", "['0'")

with open('generator/micropython_generator.js', 'a') as f:
    f.write(micropython_js)

print("Added generators")
