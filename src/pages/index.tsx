import { MediaStreamComposer, MouseTool, StreamDetails } from '@api.video/media-stream-composer'
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import StartRecordingIcon from '@mui/icons-material/FiberManualRecord'
import GestureIcon from '@mui/icons-material/Gesture'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import SettingsIcon from '@mui/icons-material/Settings'
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Alert, Box, FormControl, FormGroup, FormLabel, Menu, MenuItem, Paper, Select, Snackbar, Step, StepContent, StepLabel, Stepper, ThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import { createTheme } from '@mui/material/styles'
import PopupState from 'material-ui-popup-state'
import {
  bindMenu, bindTrigger
} from 'material-ui-popup-state/hooks'
import type { NextPage } from 'next'
import Head from 'next/head'
import NextImage from 'next/image'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { CirclePicker } from 'react-color'
import styles from '../../styles/Home.module.css'
import StreamDialog, { StreamFormValues } from '../components/StreamDialog'
import UploadSettingsDialog, { UploadSettings } from '../components/UploadSettingsDialog'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';

const theme = createTheme({
  palette: {
    primary: {
      light: '#757ce8',
      main: '#FA5B30',
      dark: '#FF6B40',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },

  },
});

const WIDTH = 1600;
const HEIGHT = 1000;
const DEFAULT_UPLOAD_TOKEN = process.env.NEXT_PUBLIC_UPLOAD_TOKEN!;

const composer = (() => {
  const mediaStreamComposer = new MediaStreamComposer({
    resolution: {
      width: WIDTH,
      height: HEIGHT
    },
  });
  mediaStreamComposer.setMouseTool("move-resize");
  mediaStreamComposer.setDrawingSettings({
    color: "#ff0000",
    lineWidth: 6,
    autoEraseDelay: 2
  });
  mediaStreamComposer.addEventListener("recordingStopped", (e: any) => {
    if (e.data.file) {
      const a = document.createElement("a");
      console.log(e.data.file);
      let extension = "mp4";
      try {
        extension = (e.data.file.type.split("/")[1]).split(";")[0];
      } catch (e) {
        console.error(e);
      }
      a.href = URL.createObjectURL(e.data.file);
      a.download = `video.${extension}`;
      a.click();
    }
  });
  return mediaStreamComposer;
})();



const Home: NextPage = () => {
  const [addStreamDialogIsOpen, setAddStreamDialogOpen] = useState(false);
  const [uploadSettingsDialogIsOpen, setUploadSettingsDialogOpen] = useState(false);

  const [streams, setStreams] = useState<StreamDetails[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [mouseTool, setMouseTool] = useState<MouseTool>("move-resize");
  const [videoDevices, setVideoDevices] = useState<InputDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<InputDeviceInfo[]>([]);
  const [uploadToken, setUploadToken] = useState<string>(DEFAULT_UPLOAD_TOKEN);
  const [videoName, setVideoName] = useState<string>('')

  const [drawingColor, setDrawingColor] = useState("#ff6900");
  const [drawingAutoEraseDelay, setDrawingAutoEraseDelay] = useState(0);

  const [firstStreamAddedAlertOpen, setFirstStreamAddedAlertOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [audioSource, setAudioSource] = useState<string>("none");
  const [audioStreamId, setAudioStreamId] = useState<string | undefined>();
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>({
    videoName: "My record.a.video composition",
    downloadVideoFile: false,
  });
  const [videoStatus, setVideoStatus] = useState<"recording" | "encoding" | "playable" | undefined>();

  const router = useRouter()

  useEffect(() => {
    if (streams.length === 0 && document.querySelector("canvas")) {
      document.getElementById('canvas-container')!.removeChild(document.querySelector("canvas")!)
    }
  }, [streams])

  useEffect(() => {
    (window as any).composer = composer;
    if (router.query.uploadToken) {
      setUploadToken(router.query.uploadToken as string);
    }
  }, [router.query])

  // update the drawing settings when related states are changed
  useEffect(() => {
    if (composer) {
      composer.setDrawingSettings({
        color: drawingColor,
        lineWidth: 6,
        autoEraseDelay: drawingAutoEraseDelay,
      });
    }
  }, [drawingColor, drawingAutoEraseDelay]);


  // handle the record duration timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      const interval = setInterval(() => {
        setRecordingDuration(recordingDuration => recordingDuration + 1);
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isRecording])

  // retrieve the list of webcam on init
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        navigator.mediaDevices.enumerateDevices()
          .then((devices) => {
            setVideoDevices(devices.filter(d => d.kind === "videoinput"));
            setAudioDevices(devices.filter(d => d.kind === "audioinput"));
            stream.getTracks().forEach(x => x.stop());
          })
      })
      .catch(e => console.log(e));
  }, []);

  function onDragEnd({ destination, source }: DropResult) {
    if (!destination || source.index === destination.index) return
    const streamId = composer.getStreams().at(source.index)?.id
    if (!streamId) return
    let newIndex = source.index
    if (source.index > destination.index) {
      do {
        composer.moveDown(streamId)
        newIndex--;
      } while (newIndex !== destination.index);
    } else {
      do {
        composer.moveUp(streamId)
        newIndex++;
      } while (newIndex !== destination.index);
    }

    const newStreams = Array.from(streams);
    const [removed] = newStreams.splice(source.index, 1);
    newStreams.splice(destination.index, 0, removed);
    setStreams(newStreams);
  };

  async function addStream(opts: StreamFormValues) {
    setAddStreamDialogOpen(false);
    let stream: MediaStream | HTMLImageElement;
    switch (opts.type) {
      case "screen":
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        break;
      case "webcam":
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { deviceId: opts.deviceId } })
        break;
      case "image":
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = opts.imageUrl!;
        stream = image;
    }
    /*opts.type === "webcam"
      ? await navigator.mediaDevices.getUserMedia({ audio: true, video: { deviceId: opts.deviceId } })
      : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });*/

    setTimeout(() => {
      composer.addStream(stream, {
        position: opts.position,
        width: opts.width ? parseInt(opts.width, 10) * WIDTH / 100 : undefined,
        height: opts.height ? parseInt(opts.height, 10) * HEIGHT / 100 : undefined,
        x: opts.left ? parseInt(opts.left, 10) * WIDTH / 100 : undefined,
        y: opts.top ? parseInt(opts.top, 10) * HEIGHT / 100 : undefined,
        resizable: opts.resizable,
        draggable: opts.draggable,
        opacity: opts.opacity,
        mask: opts.mask,
        mute: true,
        name: `${opts.type}`,
      });
      composer.appendCanvasTo("#canvas-container");
      const canvas = composer.getCanvas();
      canvas!.style.width = "100%";
      canvas!.style.height = "100%";
      canvas!.style.boxSizing = "unset";
      setStreams([...streams, composer.getStreams()[composer.getStreams().length - 1]]);
    }, 100);
  }

  function toggleStreamVisibility(stream: StreamDetails) {
    if (!composer.getStream(stream.id)) return;
    composer.updateStream(stream.id, { hidden: !composer.getStream(stream.id)!.options.hidden });
    setStreams(streams.map(s => s.id === stream.id ? { ...s, options: { ...s.options, hidden: !s.options.hidden } } : s));
  }

  function removeStream(stream: StreamDetails) {
    composer.removeStream(stream.id);
    setStreams(streams.filter(s => s.id !== stream.id));
  }

  let stepNum = 0;
  if (videoStatus === "encoding") {
    stepNum = 1;
  }
  if (videoStatus === "playable") {
    stepNum = 2;
  }

  return (
    <div className={styles.container}>
      <ThemeProvider theme={theme}>
        <Head>
          <title>@api.video/media-stream-composer library sample application</title>
          <meta name="description" content="Next.js application showing the features offered by the @api.video/media-stream-composer library." />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className={styles.columnsContainer} style={{ paddingBottom: videoStatus ? 150 : undefined }}>

          <Paper className={styles.settingsPaper} elevation={4}>
            <div className={styles.header}><NextImage src="/logo.svg" alt="api.video logo" width={65} height={15} /></div>
            <h2>
              <p>Video streams</p>
              <PopupState variant="popover" popupId="addStreamMenu">
                {(popupState) => (
                  <React.Fragment>
                    <Tooltip title="Add" arrow><Button variant="text" {...bindTrigger(popupState)}><AddIcon fontSize='medium' sx={{ mr: 1 }} /></Button></Tooltip>
                    <Menu {...bindMenu(popupState)}>
                      <MenuItem onClick={async () => { popupState.close(); setAddStreamDialogOpen(true); }}>Add a custom stream ...</MenuItem>
                      <MenuItem onClick={async () => {
                        popupState.close();
                        addStream({
                          type: "image",
                          imageUrl: "/Logo_white_text.svg",
                          position: "fixed",
                          width: "38%",
                          top: "88%",
                          left: "60%",
                          mask: "none",
                          draggable: true,
                          resizable: true,
                        });
                      }}>Add api.video logo :)</MenuItem>

                      {videoDevices.map(d =>
                      ([
                        <MenuItem key={d.deviceId + "_screen"} onClick={async () => {
                          popupState.close();
                          addStream({
                            type: "screen",
                            position: "contain",
                            mask: "none",
                            draggable: true,
                            resizable: true,
                          });
                          addStream({
                            type: "webcam",
                            deviceId: d.deviceId,
                            position: "fixed",
                            height: "30%",
                            top: "68%",
                            left: "2%",
                            mask: "circle",
                            draggable: true,
                            resizable: true,
                          });
                        }}>Add screencast + rounded webcam ({d.label})</MenuItem>,
                        <MenuItem key={d.deviceId} onClick={async () => {
                          popupState.close();
                          addStream({
                            type: "webcam",
                            deviceId: d.deviceId,
                            position: "fixed",
                            height: "30%",
                            top: "68%",
                            left: "2%",
                            mask: "circle",
                            draggable: true,
                            resizable: true,
                          });
                        }}>Add rounded webcam only ({d.label})</MenuItem>,]))
                      }

                      <MenuItem onClick={async () => {
                        popupState.close();
                        addStream({
                          type: "screen",
                          position: "contain",
                          mask: "none",
                          draggable: false,
                          resizable: false,
                        });
                      }}>Add screencast only</MenuItem>

                    </Menu>
                  </React.Fragment>
                )}
              </PopupState>
            </h2>

            {streams.length === 0
              ? (
                <>
                  <NextImage className={styles.videoOff} src="/video-off.svg" alt='No stream' width={22} height={22} />
                  <p className={styles.noStream}><AddIcon fontSize='small' color='primary' /> to add video streams</p>
                </>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="streams">
                    {provided => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className={styles.droppable}>
                        {streams.map((stream, i) => (
                          <Draggable key={`${stream.id}_${i}`} draggableId={`${stream.id}_${i}`} index={i}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${styles.stream} ${snapshot.isDragging ? styles.dragged : ''}`}
                              >
                                <DragIndicatorRoundedIcon />
                                <p>
                                  {stream.id}
                                </p>
                                <DeleteOutlineOutlinedIcon onClick={() => removeStream(stream)} />
                                {stream.options.hidden 
                                  ? <VisibilityOffOutlinedIcon onClick={() => toggleStreamVisibility(stream)} /> 
                                  : <VisibilityOutlinedIcon onClick={() => toggleStreamVisibility(stream)} />
                                }
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )
            }

            <h2>Audio source</h2>
            <FormControl className={styles.formControl} fullWidth>
              <NextImage src="/mic.svg" alt="Microphone" width={16} height={16} />
              <Select
                className={styles.audioSelect}
                id="audio-source-select"
                value={audioSource}
                IconComponent={ExpandMoreIcon}
                onChange={async (a) => {
                  if (audioStreamId) {
                    composer.removeAudioSource(audioStreamId);
                  }
                  const selectedAudioSource = a.target.value;
                  let newAudioStreamId;
                  if (selectedAudioSource !== "none") {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedAudioSource } });
                    newAudioStreamId = await composer.addAudioSource(stream);
                  }
                  setAudioStreamId(newAudioStreamId);
                  setAudioSource(selectedAudioSource);
                }}
              >
                <MenuItem key={"undefined"} value={"none"}>None</MenuItem>
                {audioDevices.map(d => <MenuItem key={d.deviceId} value={d.deviceId}>{d.label}</MenuItem>)}
              </Select>
            </FormControl>

            <h2>Tool</h2>
            <FormControl component="fieldset">
              <FormGroup>
                <ToggleButtonGroup
                  fullWidth
                  size="small"
                  color="primary"
                  value={mouseTool}
                  className={styles.toolButtonGroup}
                  exclusive
                  onChange={(v, w) => {
                    composer.setMouseTool(w);
                    setMouseTool(w);
                  }
                  }
                >
                  <ToggleButton className={styles.toggleButton} disabled={streams.length === 0} value="move-resize">
                    <FullscreenExitIcon className={styles.toggleButtonIcon} />
                    Move / Resize
                  </ToggleButton>
                  <ToggleButton className={styles.toggleButton} disabled={streams.length === 0} value="draw">
                    <GestureIcon className={styles.toggleButtonIcon} />
                    Draw
                  </ToggleButton>
                </ToggleButtonGroup>
                {mouseTool === "draw" && <>
                  <FormLabel component="legend">Line color</FormLabel>
                  <CirclePicker
                    color={drawingColor}
                    colors={['#FF6900', '#FCB900', '#9900EF', '#00D084', '#8ED1FC', '#0693E3']}
                    onChange={(color: any) => { setDrawingColor(color.hex) }}
                  />
                  <FormControl variant="standard">
                    <FormLabel component="legend">Auto erase delay</FormLabel>
                    <Select
                      labelId="width-select-standard-label"
                      id="width-select-standard"
                      value={drawingAutoEraseDelay}
                      onChange={(v, w) => { setDrawingAutoEraseDelay(parseInt(v.target.value as string)) }}
                      label="Auto erase delay"
                    >
                      <MenuItem value={0}>disabled</MenuItem>
                      <MenuItem value={3}>3 seconds</MenuItem>
                      <MenuItem value={5}>5 seconds</MenuItem>
                      <MenuItem value={10}>10 seconds</MenuItem>
                    </Select>
                  </FormControl>

                  <Button variant="outlined" style={{ marginTop: "1em" }} onClick={() => composer.clearDrawing()}>clear drawings</Button>

                </>}
              </FormGroup>
            </FormControl>

            <SettingsIcon color='primary' onClick={() => setUploadSettingsDialogOpen(true)} className={styles.settingsButton} />

            <Tooltip style={{ fontSize: 22 }} title={<p style={{ fontSize: 16, padding: 0, margin: 0 }}>Start by adding one or more streams by clicking on the &quot;+&quot; icon above.</p>} placement='bottom' arrow disableHoverListener={streams.length > 0}>
              <span className={styles.recordContainer}>
                <Button className={styles.record} disabled={streams.length === 0} variant="contained" fullWidth onClick={async () => {
                  if (!isRecording) {
                    composer.startRecording({
                      uploadToken,
                      videoName: uploadSettings.videoName,
                      generateFileOnStop: uploadSettings.downloadVideoFile,
                      mimeType: uploadSettings.mimeType,
                      origin: {
                        application: {
                          name: "record-a-video",
                          version: "1.0.0",
                        }
                      }
                    });
                    setVideoStatus("recording");
                    composer.addEventListener("error", (e) => {
                      setErrorMessage((e as any).data.title || "An unknown error occurred");
                      setIsRecording(false);
                    });
                    composer.addEventListener("videoPlayable", (e) => {
                      setVideoStatus("playable");
                      setPlayerUrl((e as any).data.assets.player);
                    });

                    setPlayerUrl(null);
                    setIsRecording(true);
                  } else {
                    composer.stopRecording().then(e => setVideoStatus("encoding"));
                    setIsRecording(false);
                  }
                }}>{!isRecording
                  ? <div><StartRecordingIcon fontSize="large" className={styles.toggleButtonIcon} />Start recording</div>
                  : <div><StopRoundedIcon style={{ color: '#DC3A3A' }} fontSize="large" className={styles.toggleButtonIcon} />Stop recording ({recordingDuration} sec)</div>}
                </Button>
              </span>
            </Tooltip>
          </Paper>

          <section className={styles.previewPaper}>
            <div id="canvas-container" className={styles.canvasContainer} style={{ width: "100%", aspectRatio: `${WIDTH}/${HEIGHT}` }}>
              {streams.length === 0 && <><NextImage src="/video-off.svg" alt='No stream' width={48} height={48} /><p>No video stream yet</p></>}
            </div>
            {videoStatus && (
              <Box className={styles.stepperContainer}>
                <Stepper activeStep={stepNum} connector={null} className={styles.stepper}>

                  <Step completed={stepNum > 0} className={styles.step}>
                    <StepLabel style={{ fontWeight: "bold" }}>Uploading</StepLabel>
                      <Typography variant="caption" className={styles.stepContent}>
                        The video is currently being recorded and uploaded simultaneously thanks to api.video&apos;s <a target="_blank" rel="noreferrer" href="https://api.video/blog/tutorials/progressively-upload-large-video-files-without-compromising-on-speed">progressive upload</a> feature.
                      </Typography>
                  </Step>

                  <Step completed={stepNum > 1} className={styles.step}>
                    <StepLabel>Encoding</StepLabel>
                      <Typography variant="caption">Your recording is currently being encoded in HLS for optimal streaming. It will be available soon. Please wait.</Typography>
                  </Step>

                  <Step completed={stepNum > 1} className={styles.step}>
                    <StepLabel>Done</StepLabel>
                      <Typography variant="caption">
                        You can watch the recording <a href={playerUrl!} rel="noreferrer" target="_blank">by clicking here</a>. Higher qualities are still being processed. The viewing experience will be even better if you refresh the player in a few seconds.
                      </Typography><br />
                  </Step>
                </Stepper>
              </Box>
            )}
          </section>

          <Snackbar
            open={firstStreamAddedAlertOpen}
            onClose={() => setFirstStreamAddedAlertOpen(false)}
            autoHideDuration={4000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setFirstStreamAddedAlertOpen(false)} severity="success" sx={{ width: '100%' }}>
              You have added your first stream. You can now add more to create your composition!
            </Alert>
          </Snackbar>
          <Snackbar
            open={!!errorMessage}
            onClose={() => setErrorMessage(undefined)}
            autoHideDuration={4000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setErrorMessage(undefined)} severity="error" sx={{ width: '100%' }}>
              {errorMessage}
            </Alert>
          </Snackbar>

          <StreamDialog
            open={addStreamDialogIsOpen}
            devices={videoDevices}
            onClose={() => setAddStreamDialogOpen(false)}
            onSubmit={(values) => {
              addStream(values);
              setAddStreamDialogOpen(false);
            }} />

          <UploadSettingsDialog
            open={uploadSettingsDialogIsOpen}
            onClose={() => setUploadSettingsDialogOpen(false)}
            uploadSettings={uploadSettings}
            onSubmit={(values) => { setUploadSettings(values); setUploadSettingsDialogOpen(false) }} />

        </div>

        <p>This Next.js application aims to show the features offered by the <a target="_blank" rel="noreferrer" href="https://github.com/apivideo/api.video-typescript-media-stream-composer">@api.video/media-stream-composer</a> library. </p>
        <p>The code of the application is available on GitHub here: <a target="_blank" rel="noreferrer" href="https://github.com/apivideo/api.video-typescript-media-stream-composer/tree/main/examples/record.a.video">record.a.video</a>.</p>
      </ThemeProvider>
    </div>
  )
}

export default Home




{/* <TableContainer className={styles.table}>
                  <Table size="small" aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Streams</TableCell>
                        <TableCell align="right"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {streams.map((val, index, array) => array[array.length - 1 - index]).map((stream, i) => (
                        <TableRow
                          key={i}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            #{stream.id} ({stream.options.name} {stream.options.index})
                          </TableCell>
                          <TableCell className={styles.tableActions} align="right">
                            <Button disabled={i === 0} onClick={() => { composer.moveUp(stream.id); setStreams(composer.getStreams()); }}><KeyboardDoubleArrowUpIcon /></Button>
                            <Button disabled={i === streams.length - 1} onClick={() => { composer.moveDown(stream.id); setStreams(composer.getStreams()); }}><KeyboardDoubleArrowDownIcon /></Button>
                            {stream.options.hidden
                              ? <Button onClick={() => { composer.updateStream(stream.id, { hidden: false }); setStreams(composer.getStreams()); }}><VisibilityOnIcon></VisibilityOnIcon></Button>
                              : <Button onClick={() => { composer.updateStream(stream.id, { hidden: true }); setStreams(composer.getStreams()); }}><VisibilityOffIcon></VisibilityOffIcon></Button>}

                            <Button onClick={() => { composer.removeStream(stream.id); setStreams(composer.getStreams()); }}><DeleteIcon></DeleteIcon></Button>
                          </TableCell>

                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer> */}
