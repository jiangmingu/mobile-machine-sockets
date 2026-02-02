// Create connection to Node.js Server
const socket = io();

// Permission button (iOS)
let askButton;
let isMobileDevice = true;
let hasPermission = false;

// Device motion
let accX = 0;
let accY = 0;
let accZ = 0;
let rrateX = 0;
let rrateY = 0;
let rrateZ = 0;

// Device orientation
let rotateDegrees = 0;
let frontToBack = 0;
let leftToRight = 0;

function setup() {
  createCanvas(400, 400);
  rectMode(CENTER);
  angleMode(DEGREES);
  textSize(16);
  textAlign(CENTER);
  textWrap(WORD);

  // simplified DESKTOP vs. MOBILE DETECTION
  isMobileDevice = checkMobileDevice();

  // iOS permission handling
  if (
    typeof DeviceMotionEvent.requestPermission === "function" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    askButton = createButton("Enable Motion Sensors");
    askButton.position(10, 10);
    askButton.mousePressed(handlePermissionButtonPressed);
  } else {
    // Android / non-permission devices
    window.addEventListener("devicemotion", deviceMotionHandler, true);
    window.addEventListener("deviceorientation", deviceOrientationHandler, true);
    hasPermission = true;
  }
}

function draw() {
  background(240);


  // -------- DESKTOP MESSAGE --------
  if (!isMobileDevice) {
    displayDesktopMessage();
    return;// exit draw cycle early
  }

  // -------- WAITING FOR PERMISSION --------
  if (!hasPermission) {
    displayPermissionMessage();
    return;// exit draw cycle early
  }

  // MOBILE DEVICE VISUALISATION

  //debug / show my own data
  visualiseMyData();

  // Send my data to the server (throttle via frameRate if needed)
  emitData();

}


function visualiseMyData(){
   // Simple movement threshold visualisation
  let totalMovement =
    Math.abs(accX) + Math.abs(accY) + Math.abs(accZ);

  if (totalMovement > 2) {
    background(255, 0, 0);
  }

  // Orientation arrows
  push();
  translate(width / 2, height / 2);

  if (frontToBack > 40) {
    rotate(180);
    triangle(-30, -40, 0, -100, 30, -40);
  } else if (frontToBack < 0) {
    triangle(-30, -40, 0, -100, 30, -40);
  }

  if (leftToRight > 20) {
    rotate(90);
    triangle(-30, -40, 0, -100, 30, -40);
  } else if (leftToRight < -20) {
    rotate(-90);
    triangle(-30, -40, 0, -100, 30, -40);
  }

  pop();

  // Debug text
  fill(0);
  textSize(14);

  text("Acceleration:", 10, 60);
  text(
    `${accX.toFixed(2)}, ${accY.toFixed(2)}, ${accZ.toFixed(2)}`,
    10,
    80
  );

  text("Rotation rate:", 10, 120);
  text(
    `${rrateX.toFixed(2)}, ${rrateY.toFixed(2)}, ${rrateZ.toFixed(2)}`,
    10,
    140
  );

  text("Orientation:", 10, 180);
  text(
    `${rotateDegrees.toFixed(2)}, ${leftToRight.toFixed(2)}, ${frontToBack.toFixed(2)}`,
    10,
    200
  );
}

// SEND DATA TO SERVER
function emitData(){
  socket.emit("motionData", {
    acceleration: {
      x: accX,
      y: accY,
      z: accZ,
    },
    rotationRate: {
      alpha: rrateZ,
      beta: rrateX,
      gamma: rrateY,
    },
    orientation: {
      alpha: rotateDegrees,
      beta: frontToBack,
      gamma: leftToRight,
    },
    timestamp: Date.now(),
  });
}

//not mobile message
function displayDesktopMessage() {
  fill(0);
  let message = "This is a mobile experience. Please open this URL on your phone’s browser.";
  text(message, width / 2, height / 2, width);//4th parameter to get text to wrap to new line if wider than canvas
}

function displayPermissionMessage() {
  fill(0);
  let message = "Waiting for motion sensor permission, click the button to allow.";
  text(message, width / 2, height / 2, width);//4th parameter to get text to wrap to new line if wider than canvas
}


// --------------------
// Permission handling
// --------------------

function handlePermissionButtonPressed() {
  DeviceMotionEvent.requestPermission()
    .then((response) => {
      if (response === "granted") {
        //permission granted
        hasPermission = true;

        window.addEventListener(
          "devicemotion",
          deviceMotionHandler,
          true
        );
      }
    })
    .catch(console.error);

  DeviceOrientationEvent.requestPermission()
    .then((response) => {
      if (response === "granted") {
        window.addEventListener(
          "deviceorientation",
          deviceOrientationHandler,
          true
        );
      }
    })
    .catch(console.error);

  askButton.remove();
}


// --------------------
// Socket events
// --------------------

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("motionData", (data) => {
  console.log("Remote device data:", data);
  // Here is where another client could visualise / react
});

// --------------------
// Sensor handlers
// --------------------

function deviceMotionHandler(event) {
  if (!event.acceleration || !event.rotationRate){
    return;
  }

  accX = event.acceleration.x || 0;
  accY = event.acceleration.y || 0;
  accZ = event.acceleration.z || 0;

  rrateZ = event.rotationRate.alpha || 0;
  rrateX = event.rotationRate.beta || 0;
  rrateY = event.rotationRate.gamma || 0;
}

function deviceOrientationHandler(event) {
  rotateDegrees = event.alpha || 0;
  frontToBack = event.beta || 0;
  leftToRight = event.gamma || 0;
}

// Simple mobile device check using the browser's userAgent string
// This is fast and easy, but not 100% reliable for all devices
function checkMobileDevice() {

  // The userAgent is a long string that describes the browser and device
  let userAgent = navigator.userAgent;

  // This regular expression checks for common mobile keywords
  // like Android phones, iPhones, iPads, etc.
  let mobileRegex = /Mobi|Android|iPhone|iPad|iPod/i;

  // test() returns true if the pattern is found, false otherwise
  return mobileRegex.test(userAgent);
}

/*
  Note on device detection for more professional / production-level projects:
  - Modernizr:
    Instead of guessing the device type, Modernizr checks for features
    (like touch support, orientation sensors, WebGL, etc.).
    This is often a better approach for responsive and accessible design.
  - device-detector-js or UAParser.js:
    These libraries properly parse the userAgent and can tell you
    whether the device is a phone, tablet, or desktop with much
    higher accuracy than a simple regex.
*/