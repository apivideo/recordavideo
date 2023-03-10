import CircleIcon from '@mui/icons-material/AccountCircle';
import ImageIcon from '@mui/icons-material/Image';
import PhotoCameraFrontIcon from '@mui/icons-material/PhotoCameraFront';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import { FormControl, FormControlLabel, FormGroup, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, Slider, Switch, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { createRef, useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';
import { ContainDimentionIcon, CoverDimentionIcon, FixedDimensionIcon } from './Icons';

export interface StreamFormValues {
    type: StreamType;
    position: "contain" | "cover" | "fixed"; 
    mask: "none" | "circle";
    width?: string;
    height?: string;
    top?: string;
    left?: string;
    draggable: boolean;
    resizable: boolean;
    deviceId?: string;
    opacity?: number;
    imageUrl?: string;
}

interface StreamDialogProps {
    devices: MediaDeviceInfo[];
    open: boolean;
    onSubmit?: (values: StreamFormValues) => void;
    onClose?: () => void;
}

type StreamType = "screen" | "webcam" | "image";


const StreamDialog = (props: StreamDialogProps) => {
    const [type, setType] = useState<StreamType>("screen");
    const [position, setPosition] = useState< "contain" | "cover" | "fixed">();
    const [mask, setMask] = useState< "none" | "circle">();
    const [width, setWidth] = useState<string>();
    const [opacity, setOpacity] = useState<number>(100);
    const [height, setHeight] = useState<string>();
    const [top, setTop] = useState<string>();
    const [left, setLeft] = useState<string>();
    const [draggable, setDraggable] = useState(false);
    const [resizable, setResizable] = useState(false);
    const [deviceId, setDeviceId] = useState<string>();
    const [imageUrl, setImageUrl] = useState<string>("");
    const [screencastAvailable, setScreencastAvailable] = useState(typeof navigator !== "undefined" && !!navigator.mediaDevices.getDisplayMedia)
    const fileInputRef = createRef<HTMLInputElement>();

    // select the first device when the devices are loaded
    useEffect(() => {
        if (!deviceId && props.devices.length > 0) {
            setDeviceId(props.devices[0].deviceId);
        }
    }, [deviceId, props.devices]);

    // reinitialize the form when the dialog is opened
    useEffect(() => {
        if (props.open) {
            setType(screencastAvailable ? "screen" : "webcam");
            setPosition("contain");
            setMask("none");
            setWidth("");
            setHeight("25%");
            setTop("0");
            setLeft("0");
            setDraggable(false);
            setResizable(false);
            setDeviceId("");
            setOpacity(100);
        }
    }, [props.open]);

    return <Dialog fullWidth={true} open={props.open} onClose={() => props.onClose && props.onClose()}>
        <DialogTitle>Add a stream</DialogTitle>
        <DialogContent>
            {!screencastAvailable && props.devices.length == 0
                ? <div>You&apos;re browser doesn&apos;t have screen sharing feature and no camera device was found. Please try with another browser.</div>
                : <div style={{ display: "flex", flexDirection: "column" }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Stream type</FormLabel>
                        <FormGroup>
                            <ToggleButtonGroup
                                fullWidth
                                size="small"
                                color="primary"
                                value={type}
                                exclusive
                                onChange={(v, w) => w && setType(w)}>
                                <ToggleButton disabled={!screencastAvailable} value="screen"><ScreenshotMonitorIcon className={styles.toogleButtonIcon} /> Screencast</ToggleButton>
                                <ToggleButton disabled={props.devices.length === 0} value="webcam"><PhotoCameraFrontIcon className={styles.toogleButtonIcon} /> Webcam</ToggleButton>
                                <ToggleButton value="image"><ImageIcon className={styles.toogleButtonIcon} /> Image</ToggleButton>
                            </ToggleButtonGroup>
                        </FormGroup>
                    </FormControl>
                    {type === "image" && <div>
                    <FormControl style={{width: "100%"}}>
                            <FormLabel component="legend" id="device-radio-buttons-group-label">Image</FormLabel>
                            <Button variant="contained" onClick={() => fileInputRef.current && fileInputRef.current.click()}>Select an image</Button>
                            <input style={{display: "none"}} ref={fileInputRef} type="file" accept="image/*" onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                        if (e.target && e.target.result) {
                                            setImageUrl(e.target.result as string);
                                        }
                                    }
                                    reader.readAsDataURL(file);
                                }
                            }} />
                            <img src={imageUrl} style={{width: "100%", marginTop: "10px"}} />
                        </FormControl>
                    </div>
                    }
                    {type === "webcam" && <div>
                        <FormControl>
                            <FormLabel component="legend" id="device-radio-buttons-group-label">Device</FormLabel>
                            <RadioGroup
                                aria-labelledby="device-radio-buttons-group-label"
                                value={deviceId}
                                onChange={(a) => setDeviceId(a.target.value)}
                                name="radio-buttons-group"
                            >
                                {props.devices
                                    .filter(d => d.kind === "videoinput")
                                    .map(d => <FormControlLabel key={d.deviceId} value={d.deviceId} control={<Radio />} label={d.label} />)}

                            </RadioGroup>
                        </FormControl>
                    </div>
                    }
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Stream position</FormLabel>
                        <FormGroup>
                            <ToggleButtonGroup
                                fullWidth
                                size="small"
                                color="primary"
                                value={position}
                                exclusive
                                onChange={(v, w) => w && setPosition(w)}>
                                <ToggleButton value="cover"><CoverDimentionIcon className={styles.toogleButtonIcon} /> cover</ToggleButton>
                                <ToggleButton value="contain"><ContainDimentionIcon className={styles.toogleButtonIcon} />contain</ToggleButton>
                                <ToggleButton value="fixed"><FixedDimensionIcon className={styles.toogleButtonIcon} />fixed</ToggleButton>
                            </ToggleButtonGroup>
                        </FormGroup>
                    </FormControl>
                    {position === "fixed" &&
                        <>
                            <div>
                                <FormLabel component="legend">Fixed dimensions</FormLabel>
                                <FormControl variant="standard" sx={{ m: 1, minWidth: "46%" }}>
                                    <InputLabel id="width-select-standard-label">Width</InputLabel>
                                    <Select
                                        labelId="width-select-standard-label"
                                        id="width-select-standard"
                                        value={width}
                                        onChange={(v, w) => { setWidth(v.target.value); setHeight(""); }}
                                        label="Age"
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        <MenuItem value={"10%"}>10%</MenuItem>
                                        <MenuItem value={"25%"}>25%</MenuItem>
                                        <MenuItem value={"50%"}>50%</MenuItem>
                                        <MenuItem value={"75%"}>75%</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl variant="standard" sx={{ m: 1, minWidth: "46%" }}>
                                    <InputLabel id="height-select-standard-label">Height</InputLabel>
                                    <Select
                                        labelId="height-select-standard-label"
                                        id="height-select-standard"
                                        value={height}
                                        onChange={(v, w) => { setHeight(v.target.value); setWidth(""); }}
                                        label="Age"
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        <MenuItem value={"10%"}>10%</MenuItem>
                                        <MenuItem value={"25%"}>25%</MenuItem>
                                        <MenuItem value={"50%"}>50%</MenuItem>
                                        <MenuItem value={"75%"}>75%</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                            <div>
                                <FormLabel component="legend">Fixed position</FormLabel>
                                <FormControl variant="standard" sx={{ m: 1, minWidth: "46%" }}>
                                    <InputLabel id="top-select-standard-label">Top</InputLabel>
                                    <Select
                                        labelId="top-select-standard-label"
                                        id="top-select-standard"
                                        value={top}
                                        onChange={(v, w) => setTop(v.target.value)}
                                        label="Age"
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        <MenuItem value={"0"}>0</MenuItem>
                                        <MenuItem value={"10%"}>10%</MenuItem>
                                        <MenuItem value={"25%"}>25%</MenuItem>
                                        <MenuItem value={"50%"}>50%</MenuItem>
                                        <MenuItem value={"75%"}>75%</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl variant="standard" sx={{ m: 1, minWidth: "46%" }}>
                                    <InputLabel id="left-select-standard-label">Left</InputLabel>
                                    <Select
                                        labelId="left-select-standard-label"
                                        id="left-select-standard"
                                        value={left}
                                        onChange={(v, w) => setLeft(v.target.value)}
                                        label="Age"
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        <MenuItem value={"0"}>0</MenuItem>
                                        <MenuItem value={"10%"}>10%</MenuItem>
                                        <MenuItem value={"25%"}>25%</MenuItem>
                                        <MenuItem value={"50%"}>50%</MenuItem>
                                        <MenuItem value={"75%"}>75%</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                        </>}
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Stream mask</FormLabel>
                        <FormGroup>
                            <ToggleButtonGroup
                                fullWidth
                                size="small"
                                color="primary"
                                value={mask}
                                exclusive
                                onChange={(v, w) => w && setMask(w)}
                            >
                                <ToggleButton value="none">none</ToggleButton>
                                <ToggleButton value="circle"><CircleIcon className={styles.toogleButtonIcon} /> circle</ToggleButton>
                            </ToggleButtonGroup>
                        </FormGroup>
                    </FormControl>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Stream opacity</FormLabel>
                        <Slider
                            aria-label="Opacity"
                            value={opacity}
                            defaultValue={opacity}
                            valueLabelDisplay="auto"
                            step={10}
                            marks
                            min={10}
                            max={100}
                            onChange={(e) => setOpacity((e.target as any)?.value || 100)}
                        />
                    </FormControl>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Options</FormLabel>
                        <FormControlLabel control={<Switch checked={draggable} onChange={(e) => setDraggable(e.target.checked)} />} label="Draggable" />
                        <FormControlLabel control={<Switch checked={resizable} onChange={(e) => setResizable(e.target.checked)} />} label="Resizable" />
                    </FormControl>
                </div>
            }

        </DialogContent>
        <DialogActions>
            <Button onClick={() => props.onClose && props.onClose()}>Cancel</Button>
            <Button disabled={!screencastAvailable && props.devices.length === 0 || (type === "image" && imageUrl === "")} onClick={() => props.onSubmit && props.onSubmit({
                type,
                imageUrl,
                position: position!,
                mask: mask!,
                width,
                height,
                top,
                left,
                draggable,
                resizable,
                deviceId,
                opacity
            })}>Add stream</Button>
        </DialogActions>
    </Dialog>
}

export default StreamDialog;