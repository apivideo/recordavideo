import { MediaStreamComposer } from '@api.video/media-stream-composer'
import { FormControl, FormControlLabel, FormLabel, Input, MenuItem, Select, Switch } from '@mui/material'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useEffect, useState } from 'react'


export interface UploadSettings {
    videoName: string;
    mimeType?: string;
    downloadVideoFile: boolean;
}

interface UploadSettingsDialogProps {
    open: boolean;
    onSubmit?: (toto: UploadSettings) => void;
    onClose?: () => void;
    uploadSettings: UploadSettings;
}


const UploadSettingsDialog = (props: UploadSettingsDialogProps) => {
    const [videoName, setVideoName] = useState<string>(props.uploadSettings.videoName);
    const [mimeType, setMimeType] = useState<string>("default");
    const [downloadVideoFile, setDownloadVideoFile] = useState<boolean>(false);
    const [mimeTypes, setMimeTypes] = useState<string[]>([]);
    

    useEffect(() => {
        setMimeTypes(MediaStreamComposer.getSupportedMimeTypes());
    }, []);



    return <Dialog fullWidth={true} open={props.open} onClose={() => props.onClose && props.onClose()}>
        <DialogTitle>Upload settings</DialogTitle>

        <DialogContent>
            <FormControl component="fieldset" style={{ width: "100%" }}>
                <FormLabel component="legend">Video name</FormLabel>
                <Input value={videoName} onChange={(e) => setVideoName(e.target.value)} />
            </FormControl>

            <FormControl component="fieldset" fullWidth>

                <FormLabel component="legend">Mimetype</FormLabel>
                <Select
                    labelId="audio-source-select-label"
                    id="audio-source-select"
                    value={mimeType}
                    label="Audio source"
                    onChange={async (a) => {
                        setMimeType(a.target.value as string);
                    }}
                >
                    <MenuItem key={"undefined"} value={"default"}>default</MenuItem>
                    {mimeTypes.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
            </FormControl>

            <FormControl component="fieldset">
                <FormLabel component="legend">Options</FormLabel>
                <FormControlLabel control={<Switch checked={downloadVideoFile} onChange={(e) => setDownloadVideoFile(e.target.checked)} />} label="Download video file" />
            </FormControl>
        </DialogContent>

        <DialogActions>
            <Button onClick={() => props.onClose && props.onClose()}>Cancel</Button>
            <Button onClick={() => props.onSubmit && props.onSubmit({
                videoName,
                mimeType: mimeType === "default" ? undefined : mimeType,
                downloadVideoFile
            })}>Submit</Button>
        </DialogActions>

    </Dialog>
}

export default UploadSettingsDialog;