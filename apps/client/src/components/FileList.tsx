import {
  Avatar,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import React, {useCallback, useEffect, useState} from "react";
import {FileCompanion, FileProps} from "../includes/FileCompanion";
import {Delete, FileDownload, Folder} from "@mui/icons-material"
import {QueryService} from "../services/QueryService";
import {VaultService} from "../services/VaultService";
import {Link, Navigate} from "react-router-dom";

export default function FileList() {
  const qsrv = QueryService.getInstane();
  const vaultService = VaultService.getInstance();

  const [list, setList] = useState<Array<FileCompanion>>([]);
  const [authFailure, setAuthFailure] = useState(false);

  const fetchFn = useCallback(async () => {
    try {

      const res = await qsrv.getFileList();
      if (res.ok) {
        vaultService.clearFileList();
        const data: Array<FileProps> = await res.json();
        console.log(data);
        for (const f of data) {
          await vaultService.importFileMetadata(f);
        }
        setList(vaultService.getFileCompanions());
      } else if (res.status === 403) {
        alert("Authentication failure. Please log in.")
        setAuthFailure(true);
      } else {
        alert("Unexpected Error");
      }
    } catch (e: any) {
      console.log(e.message);

    }

  }, [qsrv, vaultService])


  useEffect(() => {
    fetchFn();
  }, [fetchFn])

  const onClickDownload = async (uuid: string) => {
    try {
      const dataReq = await qsrv.getFile(uuid);
      const keyReq = await qsrv.getFileKey(uuid);
      console.log(dataReq);
      console.log(keyReq);
      if (!dataReq.ok || !keyReq.ok) {
        alert("The request failed.");
        return;
      }

      const dataBuff = await dataReq.arrayBuffer();
      const dataKeyReq = await keyReq.json();
      console.log(dataKeyReq);
      const fc = await vaultService.importFileKey(dataKeyReq, uuid);
      let f: ArrayBuffer;
      try {
        f = await fc.decryptFile(dataBuff);
      } catch (e) {
        console.log("Error while decrypting", e);
        console.log(fc.getUuid())
        return;
      }
      console.log(f);
      // Code snippet from https://dev.to/nombrekeff/download-file-from-blob-21ho
      const blobUrl = URL.createObjectURL(new Blob([f]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fc.getClearName();
      link.hidden = true;
      document.body.appendChild(link);
      link.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        })
      )
      document.body.removeChild(link);
    } catch (e: any) {
      console.log(e);
      alert(e.message);
    }
  }

  const onClickDelete = async (uuid: string) => {
    try {
      const res = await qsrv.deleteFile(uuid);
      if (res.ok) {
        await fetchFn();
      }
    } catch (e) {
      console.log(e);
    }
  }
  return (
    <> {authFailure
      ? <Navigate to={"/login"} replace={true}></Navigate>
      : <>
        <Typography sx={{mb: 1}} variant={"h5"}>
          File List
        </Typography>
        <Stack sx={{mb: 2}} direction={'row'}>
          <Link to={"/addfile"}>
            <Button>
              Add file
            </Button>
          </Link>
          <Link to={"/account"}>
            <Button>
              Home
            </Button>
          </Link>
        </Stack>
        <List sx={{overflowX: 'scroll'}}>
          {list.map<any>((item: FileCompanion) => {
            return (
              <ListItem
                secondaryAction={
                  <></>
                }
                key={item.getUuid()}
              >
                <ListItemAvatar>
                  <Avatar>
                    <Folder/>
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  secondary={item.getClearName()}
                />
                <Box sx={{alignSelf: "flex-end"}}>
                  <IconButton onClick={() => onClickDownload(item.getUuid())} aria-label="download">
                    <FileDownload/>
                  </IconButton>
                  <IconButton onClick={() => onClickDelete(item.getUuid())}>
                    <Delete/>
                  </IconButton>
                </Box>

              </ListItem>
            )
          })
          }
        </List>
      </>
    }
    </>
  );
}