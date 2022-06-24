RTMP_url = 'rtmp://broadcast.api.video/s/cd339b65-f4f9-40bc-afae-d586b3084f44';
live_url = 'https://embed.api.video/live/liqHiqZ8KXIW63tLHHAbRDL';
delegated_token = 'tompBU8ZJcUCEsKGxxoBydh';
//page defaults
//vod by default, but we can make the page default to live.
live = false;
//by default, screensahring
cameraOnly = false;
//adding a comment to change the doc for github

window.onload = function () {
    //this turns on the camera for a second - just to get permissions to populate the form with mics and cameras
    //navigator.getUserMedia = (navigator.mediaDevices.getUserMedia);
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => {
            getCamAndMics().then(() => stream.getTracks().forEach(x => x.stop()));
        })
        .catch(e => console.log(e));



    // is this a mobile device - no screen share - and 2 cameras?
    //see if screen capture is supported
    if ("getDisplayMedia" in navigator.mediaDevices) {
        console.log("screen capture supported");
    } else {
        console.log("screen capture NOT supported");
        cameraOnly = true;
    }

    //but we can change based on URL params
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const liveURLParam = urlParams.get('live');
    const cameraOnlyParam = urlParams.get('cameraOnly');
    if (liveURLParam === "true") {
        live = true;
        console.log("live set from url", live);
    }
    if (cameraOnlyParam === "true") {
        cameraOnly = true;
        console.log("cameraOnly set from url", cameraOnly);
        document.getElementById("screenpicker-select").options[0].disabled = true;
        document.getElementById("screenpicker-select").options[1].disabled = true;
        document.getElementById("screenpicker-select").options[2].disabled = true;
    }


    //set all the variables for the canvas and all the elements
    videoElem = document.getElementById("display");
    cameraElem = document.getElementById("camera");
    startElem = document.getElementById("start");
    stopElem = document.getElementById("stop");



    captionRecord = true;
    screenShared = false;
    //camera
    cameraW = 1280;
    cameraH = 720;
    cameraFR = 30;
    //set up the recording canvas
    canvas = document.getElementById("videoCanvas");

    ctx = canvas.getContext("2d");

    if (cameraOnly) {
        //record in portrait
        console.log("portrait canvas");
        ctx.canvas.width = 1280;
        ctx.canvas.height = 720;
        cameraW = 720;
        cameraH = 1280;

    } else {
        ctx.canvas.width = 1280;
        ctx.canvas.height = 720;
    }
    cw = ctx.width;
    ch = ctx.height;
    //caption font and colour
    ctx.font = "60px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";


    //set xy coordinates for the screen and cameras
    screenX0 = 0;
    screenY0 = 0;
    screenX1 = ctx.canvas.width;
    screenY1 = ctx.canvas.height;

    cameraX0 = 0;
    cameraY0 = 0;
    cameraX1 = ctx.canvas.width / 3;
    cameraY1 = ctx.canvas.height / 3;



    //size of the video view whre the screen is stored
    screenWidth = ctx.canvas.width;
    screenHeight = ctx.canvas.height;
    //set dimensions for captions 
    var captionX = screenWidth / 2;
    var captionY = 100;
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    //captionning
    interim_transcript = '';

    if ('webkitSpeechRecognition' in window) {
        console.log("speech recognition supported");
        recognition = new webkitSpeechRecognition();
    } else {
        console.log("speech recognition not supported");
        captionRecord = false;
    }
    console.log("captionRecord", captionRecord);

    //initialize captioning
    captioning();

    createStream();


    //  click listeners for 'tabs'
    liveButtom = document.getElementById('live');
    vodButton = document.getElementById('vodDiv');
    //set the initial state
    if (!live) {
        vodButton.className = "vodActive";
    } else {
        initializeLiveStream();
        liveButtom.className = "liveActive";
    }
    liveButtom.addEventListener('click', function () {
        initializeLiveStream();

    });
    vodButton.addEventListener('click', function () {
        document.getElementById("vod").checked = "true";
        console.log("checking VOD radio");
        live = false;
        vodButton.className = "vodActive";
        liveButtom.className = "live";
    });

};

function initializeLiveStream() {
    document.getElementById("liveStream").checked = "true";
    console.log("checking live stream radio");
    live = true;
    vodButton.className = "vod";
    liveButtom.className = "liveActive";
    connect_server();

}



function getCamAndMics() {
    // List cameras and microphones. in the menu
    var audioSelect = document.getElementById("audioPicker-select");
    var cameraSelect = document.getElementById("cameraPicker-select");

    return navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            audioSelect.innerHTML = "";
            cameraSelect.innerHTML = "";
            devices.forEach(function (device) {
                console.log("device", device);
                deviceName = device.label;
                if (deviceName == "") {
                    deviceName = device.deviceId;
                }
                console.log(device.kind + ": named: " + deviceName + " id = " + device.deviceId);
                if (device.kind == "audioinput") {
                    //add a select to the audio dropdown list
                    var option = document.createElement("option");
                    option.value = device.deviceId;
                    option.text = deviceName;
                    audioSelect.appendChild(option);
                } else if (device.kind == "videoinput") {
                    //add a select to the camera dropdown list
                    var option = document.createElement("option");
                    option.value = device.deviceId;
                    option.text = deviceName;
                    cameraSelect.appendChild(option);

                }
            });
        })
        .catch(function (err) {
            console.log(err.name + ": " + err.message);
        });


}

function captioning() {


    //captioning function
    //captionning
    interim_transcript = '';
    var final_transcript = '';
    var recognizing = false;
    var ignore_onend;
    var start_timestamp;
    if (!captionRecord) {
        console.log("captions not supported in this browser!");
    } else {

        console.log("setting caption recognitions");
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = function () {
            recognizing = true;
        };

        recognition.onerror = function (event) {
            console.log("there was a caotioing error");
        };

        recognition.onend = function () {
            console.log("captioning stopped");
            recognizing = false;

        };

        recognition.onresult = function (event) {
            //heres where I'd put where stuff goes in my app....

            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    interim_transcript = "";
                } else {
                    //append the words
                    interim_transcript = event.results[i][0].transcript;
                    console.log(interim_transcript);
                }
            }
        };
    }
}

function createStream() {
    //now lets capture the stream:
    var mediaSource = new MediaSource();

    var mediaRecorder;
    var recordedBlobs;
    var sourceBuffer;
    //capture stream at 25 fps
    stream = canvas.captureStream(35);
    console.log("stream tracks", stream.getTracks());
    console.log("stream tracks", stream.getVideoTracks());
    console.log("stream tracks", stream.getAudioTracks());
    // console.log("stream", stream);

    console.log("stream", stream);
    console.log('Got stream from canvas');
    var options = { mimeType: 'video/webm;codecs=vp9', bitsPerSecond: 100000 };

    //once the cameras and viewas are picked this will draw them on th canvas
    //the timeout is for 20ms, so ~50 FPS updates on the canvas
    function drawCanvas(screenIn, cameraIn, canvas) {
        var textLength = 60;
        canvas.drawImage(screenIn, screenX0, screenY0, screenX1, screenY1);
        canvas.drawImage(cameraIn, cameraX0, cameraY0, cameraX1, cameraY1);
        //write transcript on the screen
        if (interim_transcript.length < textLength) {
            ctx.fillText(interim_transcript, captionX, captionY);
        }
        else {
            ctx.fillText("no captions", captionX, captionY);

        }
        setTimeout(drawCanvas, 15, screenIn, cameraIn, canvas);

    }



    videoElem.addEventListener('play', function () {
        console.log('video playing');
        //draw the 2 streams to the canvas
        drawCanvas(videoElem, cameraElem, ctx);
    }, false);

    // Set event listeners for the start and stop buttons
    startElem.addEventListener("click", function (evt) {
        startCapture();
    }, false);

    stopElem.addEventListener("click", function (evt) {
        stopCapture();

    }, false);
}
async function startCapture() {
    try {
        //change buttons
        if (live) {
            stopElem.className = "stopLive";
            stopElem.style.display = "inline";
            startElem.style.display = "none";
        }
        else {
            stopElem.style.display = "inline";
            startElem.className = "modifyScreens";
            startElem.innerHTML = "Change layout";
        }

        //cedric wants to hide the canvas
        canvasShow = document.getElementById("canvasDisplay-checkbox").checked;
        console.log("canvasShow", canvasShow);
        //hide the canvas if canvasShow is not checked
        if (!canvasShow) {
            //hide the canvas
            canvas.style.display = "none";
        }


        //add text for the 2 screens
        document.getElementById("videoInputText").innerHTML = "Screen and camera inputs";

        //arrange the cameras/screens with CSS
        var screenLayout = document.getElementById("screenpicker-select").value;
        if (cameraOnly) {
            screenLayout = 'cameraOnly';
        }
        console.log("screenLayout", screenLayout);

        if (screenLayout === 'screenOnly') {
            //no camera
            //big screen
            screenX0 = 0;
            screenY0 = 0;
            screenX1 = ctx.canvas.width;
            screenY1 = ctx.canvas.height;

            cameraX0 = 0;
            cameraY0 = 0;
            cameraX1 = 0;
            cameraY1 = 0;

        } else if (screenLayout === 'cameraOnly') {
            //big camera 
            //no screen
            screenX0 = 0;
            screenY0 = 0;
            screenX1 = 0;
            screenY1 = 0;

            cameraX0 = 0;
            cameraY0 = 0;
            cameraX1 = ctx.canvas.width;
            cameraY1 = ctx.canvas.height;

        } else if (screenLayout === 'bottomRight') {
            //bottom right camera
            //big screen
            screenX0 = 0;
            screenY0 = 0;
            screenX1 = ctx.canvas.width;
            screenY1 = ctx.canvas.height;

            cameraX0 = .625 * ctx.canvas.width;
            cameraY0 = .625 * ctx.canvas.height;
            cameraX1 = ctx.canvas.width / 3;
            cameraY1 = ctx.canvas.height / 3;

        } else {
            //default bottom left camera
            //big screen
            screenX0 = 0;
            screenY0 = 0;
            screenX1 = ctx.canvas.width;
            screenY1 = ctx.canvas.height;

            cameraX0 = 20;
            cameraY0 = .625 * ctx.canvas.height;
            cameraX1 = ctx.canvas.width / 3;
            cameraY1 = ctx.canvas.height / 3;

        }

        //where do captions go?
        var captionLocation = document.getElementById("captionspicker-select").value;
        captionX = 0;
        captionY = 0;
        if (!captionRecord) {
            //if captions are not supported - turn 'em off
            captionLocation = "noCaptions";
        }
        console.log("captions", captionLocation);
        if (captionLocation === "captionsTop") {
            //captions at the top
            captionX = screenWidth / 2;
            captionY = 50;
            startCaptions();

        } else if (captionLocation === "captionsBottom") {
            //captions at bottom
            captionX = screenWidth / 2;
            //this will allow for 3 lines to appear
            captionY = screenHeight - 90;
            startCaptions();
        }
        //if no captions, we dont start captions.

        function startCaptions() {
            //start captioning

            final_transcript = '';
            //english, but change as desired.
            //recognition.lang = "en-GB";
            recognition.start();
        }

        //rebuild the screen options
        //only thing is muting the audio
        //this prevents awful feedback..
        displayMediaOptions = {
            video: {
                frameRate: { ideal: cameraFR }
            },
            audio: false
        };
        console.log(JSON.stringify(displayMediaOptions));



        //select the camera and the micrphone: 
        var cameras = document.getElementById("cameraPicker-select");
        var cameraId = cameras.options[cameras.selectedIndex].value;
        var mics = document.getElementById("audioPicker-select");
        var micId = mics.options[mics.selectedIndex].value;

        //camera
        console.log("frameRate", cameraFR);
        navigator.getUserMedia = (navigator.mediaDevices.getUserMedia ||
            navigator.mediaDevices.mozGetUserMedia ||
            navigator.mediaDevices.msGetUserMedia ||
            navigator.mediaDevices.webkitGetUserMedia);
        var videoOptions = {
            deviceId: cameraId,
            width: { min: 100, ideal: cameraW, max: 1920 },
            height: { min: 100, ideal: cameraH, max: 1080 },
            frameRate: { ideal: cameraFR }
        };
        if (cameraOnly) {
            videoOptions = {
                facingMode: "user",
                width: { min: 100, ideal: cameraW, max: 1920 },
                height: { min: 100, ideal: cameraH, max: 1080 },
                frameRate: { ideal: cameraFR }
            };
        }
        cameraMediaOptions = {
            audio: false,
            video: videoOptions
        };
        rearCameraMediaOptions = {
            audio: false,
            video: {
                facingMode: "environment",
                width: { min: 100, ideal: cameraW, max: 1920 },
                height: { min: 100, ideal: cameraH, max: 1080 }
            }
        };
        console.log(JSON.stringify(cameraMediaOptions));

        //all settings in  - start the cameras screenshare
        if (!screenShared) {

            if (!cameraOnly) {
                //share the screen - it has not been shared yet!
                videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
                screenShared = true;
            } else {
                //screen cannot be shared, so grab the front facing camera.
                videoElem.srcObject = await navigator.mediaDevices.getUserMedia(rearCameraMediaOptions);
                screenShared = true;

            }
        }
        cameraStream = await navigator.mediaDevices.getUserMedia(cameraMediaOptions);
        cameraElem.srcObject = cameraStream;

        audioStreamOptions = {
            mimeType: "video/webm;codecs=vp8,opus",
            // mimeType: "video/mp4",
            audio: {
                deviceId: micId
            }
        };




        //grab the audio and add it to the stream coming from the canvas
        audioStream = await navigator.mediaDevices.getUserMedia(audioStreamOptions);


        for (const track of audioStream.getTracks()) {
            console.log("adding audio track");
            stream.addTrack(track);
            console.log("stream added audio", stream);
        }

        console.log("stream tracks", stream.getTracks());
        console.log("stream tracks", stream.getVideoTracks());
        console.log("stream tracks", stream.getAudioTracks());

        //JUST START RECORDING
        startRecording(live);

    } catch (err) {
        console.error("Error: " + err);
    }
}
function stopCapture(evt) {
    //FIX BUTTONS
    //change buttons
    if (live) {

        startElem.className = "start";
        startElem.innerHTML = "Reload to stream again";
        startElem.disabled = true;
        socket.close();
    } else {
        startElem.className = "start";
        startElem.innerHTML = "Start";
    }
    startElem.style.display = "inline";
    stopElem.style.display = "none";
    document.getElementById("videoInputText").innerHTML = "";
    //screen stop
    stopRecording();
    let tracks = videoElem.srcObject.getTracks();
    console.log(JSON.stringify(tracks));
    tracks.forEach(track => track.stop());
    videoElem.srcObject = null;
    screenShared = false;

    //camera stop
    let cameraTracks = cameraElem.srcObject.getTracks();
    console.log(JSON.stringify(tracks));
    tracks.forEach(cameraTracks => cameraTracks.stop());
    cameraElem.srcObject = null;

    //captions stop
    if (captionRecord) {
        recognition.stop();
    }
    if (!live) {
        //stop blob recording
        //uploadTheVideo();
        // download();
    }


}

function startRecording(live) {
    //if I omit the MIMEtype, MediaRecorder works in Safari 14.0.3.  If I add a Mime.... it fails.
    //i had a mimetype in the options and it would not record properly.
    var options = { audioBitsPerSecond: 100000, videoBitsPerSecond: 4000000 };
    //var options = {};
    // var options = 'video/webm';
    recordedBlobs = [];
    try {
        if (live) {
            mediaRecorder = new MediaRecorder(stream, options);
        } else {
            //instatiate the apivideo meida recorder upload function
            console.log("create apivideo media recorder!");
            mediaRecorder = new ApiVideoMediaRecorder(stream, {
                uploadToken: delegated_token
            });
        }
        console.log("options", options);
        console.log("mediaRecorder mime", mediaRecorder.mimeType);
    } catch (e2) {
        alert('MediaRecorder is not supported by this browser.');
        console.error('Exception while creating MediaRecorder:', e2);
        return;
    }
    console.log('Created video MediaRecorder', mediaRecorder, 'with options', options);
    console.log(",ediacrecorder stream info", mediaRecorder.stream);
    // console.log(",ediacrecorder stream trackinfo", mediaRecorder.stream.getTracks());
    mediaRecorder.onstop = handleStop;
    if (live) {
        console.log("live mime", mediaRecorder.mimeType);
        socket.emit("config_vcodec", mediaRecorder.mimeType);
        mediaRecorder.ondataavailable = function (e) {
            // console.log("e", e.data);
            socket.emit("binarystream", e.data);
            state = "start";
            //chunks.push(e.data);
        }
        document.getElementById("video-information").innerHTML = "Live Stream available after 20s <a href=" + live_url + ">here</a>";
    }
    mediaRecorder.start(10); // collect 10ms of data
    console.log('MediaRecorder started', mediaRecorder);
}

function handleStop(event) {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
}

function stopRecording() {


    document.getElementById("video-information").innerHTML = "Uploading the last bit of the video.  Please wait a second."
    mediaRecorder.stop()//;
        .then(function (video) {

            console.log(video);
            //the video is fully uploaded. there will now be a url in the response
            playerUrl = video.assets.player;
            console.log("all uploaded! Watch here: ", playerUrl);
            document.getElementById("video-information").innerHTML = "all uploaded! Watch the video <a href=\'" + playerUrl + "\' target=\'_blank\'>here</a>";

        });

    //  recordedVideo.controls = true;
    // download();
}

function play() {
    var type = (recordedBlobs[0] || {}).type;
    var superBuffer = new Blob(recordedBlobs, { type });
    recordedVideo.src = window.URL.createObjectURL(superBuffer);
}

function download() {
    var blob = new Blob(recordedBlobs, { type: 'video/webm' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

function connect_server() {

    if (!stream) { fail('No getUserMedia() available.'); }
    if (!MediaRecorder) { fail('No MediaRecorder available.'); }


    var socketOptions = { secure: true, reconnection: true, reconnectionDelay: 1000, timeout: 10000, pingTimeout: 10000, pingInterval: 2000 };

    //start socket connection
    socket = io.connect("/", socketOptions);
    // console.log("ping interval =", socket.pingInterval, " ping TimeOut" = socket.pingTimeout);
    //output_message.innerHTML=socket;

    socket.on('connect_timeout', (timeout) => {
        console.log("state on connection timeout= " + timeout);
        // output_message.innerHTML="Connection timed out";
        // recordingCircle.style.fill='gray';

    });
    socket.on('error', (error) => {
        console.log("state on connection error= " + error);
        //   output_message.innerHTML="Connection error";
        //    recordingCircle.style.fill='gray';
    });

    socket.on('connect_error', function () {
        console.log("state on connection error= " + state);
        //   output_message.innerHTML="Connection Failed";
        //   recordingCircle.style.fill='gray';
    });

    socket.on('message', function (m) {
        console.log("state on message= " + state);
        console.log('recv server message', m);
        //  show_output('SERVER:'+m);

    });

    socket.on('fatal', function (m) {

        // show_output('Fatal ERROR: unexpected:'+m);
        //alert('Error:'+m);
        console.log("fatal socket error!!", m);
        console.log("state on fatal error= " + state);
        //already stopped and inactive
        console.log('media recorder restarted');
        // recordingCircle.style.fill='gray';



    });

    socket.on('ffmpeg_stderr', function (m) {
        //this is the ffmpeg output for each frame
        console.log('FFMPEG:' + m);


    });

    socket.on('disconnect', function (reason) {
        console.log("state disconec= " + state);
        // show_output('ERROR: server disconnected!');
        console.log('ERROR: server disconnected!' + reason);
        //  recordingCircle.style.fill='gray';
        //reconnect the server
        // connect_server();



    });

    state = "ready";
    console.log("state = " + state);
    console.log('config_rtmpDestination', RTMP_url);
    socket.emit('config_rtmpDestination', RTMP_url);
    socket.emit('start', 'start');

}
