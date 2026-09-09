import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
} from "@fluentui/react-components";

type PropType = {
    open: boolean;
    handleSubmit:()=>void;
    handleClose:()=>void;
    isLoading?:boolean;
}

export const ConfirmationDialog = (props:PropType) => {
  return (
    <Dialog open={props.open} onOpenChange={(e, data) => {
        if(!data.open){
            props.handleClose();
        }
    }}>
      
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Verify User Details Before Proceeding</DialogTitle>
          <DialogContent>
            The candidate's details have been modified. This update will propagate the candidate's name throughout the system.
          </DialogContent>
          <DialogActions>
            <Button disabled={props.isLoading} appearance="primary" onClick={()=>props.handleSubmit()}>{props.isLoading?"Saving...":"Proceed"}</Button>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" onClick={()=>props.handleClose()}>Close</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};