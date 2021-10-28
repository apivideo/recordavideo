require('dotenv').config();
const express = require('express');
const app = express();
var server = require('http').createServer(app);
app.use(express.static('public'));

var io = require('socket.io')(server);
var spawn = require('child_process').spawn;
var port =3036;


app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index1.html');
});

spawn('ffmpeg',['-h']).on('error',function(m){

	console.error("FFMpeg not found in system cli; please install ffmpeg properly or make a softlink to ./!");
	process.exit(-1);
});



io.on('connection', function(socket){
	console.log("connection");
    socket.emit('message','Hello from mediarecorder-to-rtmp server!');
	socket.emit('message','Please set rtmp destination before start streaming.');
	
	var ffmpeg_process, feedStream=false;
	//socket._vcodec='libvpx';//from firefox default encode
 

    socket.on('config_rtmpDestination',function(m){
		if(typeof m != 'string'){
			socket.emit('fatal','rtmp destination setup error.');
			return;
		}
		var regexValidator=/^rtmp:\/\/[^\s]*$/;//TODO: should read config
		if(!regexValidator.test(m)){
			socket.emit('fatal','rtmp address rejected.');
			return;
		}
		socket._rtmpDestination=m;
		socket.emit('message','rtmp destination set to:'+m);
        console.log('message','rtmp destination set to:'+m);
	}); 
   // console.log("rtmp: ", rtmpEndpoint);
    socket.on('config_vcodec',function(m){
		if(typeof m != 'string'){
			socket.emit('fatal','input codec setup error.');
			return;
		}
		if(!/^[0-9a-z]{2,}$/.test(m)){
			socket.emit('fatal','input codec contains illegal character?.');
			return;
		}//for safety
		socket._vcodec=m;
        console.group("socket._vcodec",socket._vcodec);
	}); 	

    //console.log('socket',socket);



	socket.on('start',function(m){
        
		if(ffmpeg_process || feedStream){
			
			socket.emit('fatal','stream already started.');
			console.log('fatal','stream already started.');
			return;
		}
		if(!socket._rtmpDestination){
			socket.emit('fatal','no destination given.');
			console.log('fatal','no destination given.');
			return;
		}
		var framerate = 25;
		
		console.log("apivideo server", socket._rtmpDestination);
		//default keyint is 250. but we want 2 for 1fps
		var key = Math.min(250, framerate*2);
		var keyint = "keyint="+key;
		//keyint_min default is 25
		var keyint_min = Math.min(25, framerate*2);
			var ops = [ '-re',
				'-i','-',
				 //'-c:v', 'libx264', 
                 //'-preset', 'ultrafast', 
				// '-tune', 'zerolatency', 
				//'-max_muxing_queue_size', '1000', 
				//'-bufsize', '5000',
				//'-r', '1', '-g', '2', '-keyint_min','2', 
			       '-r', framerate, '-g', framerate*2, '-keyint_min',keyint_min, 
				//	'-x264opts',keyint, '-crf', '25', '-pix_fmt', 'yuv420p',
			    //    '-profile:v', 'baseline', '-level', '3', 
     				'-c:a', 'aac', '-b:a','44k', '-ar', 44100, 
			        '-f', 'flv', socket._rtmpDestination		
		
		];
	
	    console.log("ops", ops);
		console.log("rtmp endpoint", socket._rtmpDestination);
		ffmpeg_process=spawn('ffmpeg', ops);
		console.log("ffmpeg spawned");
		feedStream=function(data){
			
			ffmpeg_process.stdin.write(data);
			//write exception cannot be caught here.	
		}

		ffmpeg_process.stderr.on('data',function(d){
			socket.emit('ffmpeg_stderr',''+d);
			console.log('ffmpeg_stderr',''+d);
		});
		ffmpeg_process.on('error',function(e){
			console.log('child process error'+e);
			socket.emit('fatal','ffmpeg error!'+e);
			feedStream=false;
			socket.disconnect();
		});
		ffmpeg_process.on('exit',function(e){
			console.log('child process exit'+e);
			socket.emit('fatal','ffmpeg exit!'+e);
			socket.disconnect();
		});
	});

	socket.on('binarystream',function(m){
		if(!feedStream){
			socket.emit('fatal','rtmp not set yet.');
			console.log('fatal','rtmp not set yet.');
			ffmpeg_process.stdin.end();
			ffmpeg_process.kill('SIGINT');
			return;
		}
		feedStream(m);
	});
	socket.on('disconnect', function () {
		console.log("socket disconected!");
		feedStream=false;
		if(ffmpeg_process)
		try{
			ffmpeg_process.stdin.end();
			ffmpeg_process.kill('SIGINT');
			console.log("ffmpeg process ended!");
		}catch(e){console.warn('killing ffmpeg process attempt failed...');}
	});
	socket.on('error',function(e){
		
		console.log('socket.io error:'+e);
	});
});

io.on('error',function(e){
	console.log('socket.io error:'+e);
});

server.listen(process.env.PORT || port, () =>
  console.log('Example app listening on port '+port+'!'),
);