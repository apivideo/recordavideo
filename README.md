

[![badge](https://img.shields.io/twitter/follow/api_video?style=social)](https://twitter.com/intent/follow?screen_name=api_video)

[![badge](https://img.shields.io/github/stars/apivideo/recordavideo?style=social)](https://github.com/apivideo/recordavideo)

[![badge](https://img.shields.io/discourse/topics?server=https%3A%2F%2Fcommunity.api.video)](https://community.api.video)

![](https://github.com/apivideo/API_OAS_file/blob/master/apivideo_banner.png)

[api.video](https://api.video) provides video APIs for building, scaling and operating on-demand and live streaming videos in your app, software or platform. 

# recordavideo

[Record.a.video](https://record.a.video) uses web APIs to capture video inputs from the camera and the screen. This is then combined and can be shared in 2 different ways: as a live stream, or as a recording that is uploaded after the recording is completed.


To build your own, you'll need an api.video API key.  The first 3 lines of /public/index.js have the variables you must change to get your own version of duet a video up and running. The RTMP and live URLS are generated when you [create a livestream](https://docs.api.video/reference/post_live-streams), and the delegated_token is created from the [Generate an uplaod token](https://docs.api.video/reference/post_upload-tokens) endpoint at api.video.  (There are links to tutorials in the documentation for each endpoint).

Once you update these, you can run the Node server (NPM start), and the app will be up and running!

## record a video

There are 2 options:  Record & share & GO LIVE


### record and share

this will record your screen & camera.  when you stop your recording, it will upload the video to api.video, and give you a "share" url that you can share to anyone you want to see the video

## GO LIVE

This setting will livestream to the RTMP url saved in the index.js.  IT is set to a live stream at api.video.

## How does it work?

### GetUserMedia

The getUserMedia API will select your microphone, screen and camera. The video displays weill be placed on the screen, and then merged into a Canvas (based on the screen layout choice).  No audio is used in the video displays to avoid really loud and annoying feedback.  Trust me, you don't want to add audio to the video tags.

The canvas is read 60x/s and fed into a stream.  We append the audio to this stream - so it is connected to the final video. This stream is either recorded or streamed (based on users selection).

### Captions

the web speech api only works in chrome and Edge:
https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
but it is pretty cool - real time captioning of your video - and then applied to the canvas (and saved to the recording).


### Uploading

We use api.video delegated tokens  to uplad the video (JS basically copied from https://upload.a.video)

### Streaming

There is a NodeJS server that accepts the socket from the webpage.  This server uses FFMPEG to convert the webRTC mediaRecrding from the browser canvas into RTMP.  Then the RTMP is fed to the api.video RTMP endpoint.

### use your own!

Copy this repo- and simply change the RTMP (the streaming URL), live (the player url for your livestream) and delegated token (for upload) variables at the top of the index.js.

