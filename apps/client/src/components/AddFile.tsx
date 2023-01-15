import {Button, Stack, TextField, Typography} from "@mui/material";
import {Controller, SubmitHandler, useForm} from "react-hook-form";
import {object, string, TypeOf} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import React, {ChangeEvent, useEffect, useState} from "react";
import {VaultService} from "../services/VaultService";
import {QueryService} from "../services/QueryService";
import {FileEncKeyBox, FileProps} from "../includes/FileCompanion";
import {Link} from "react-router-dom";


export default function AddFile() {

  const [file, setFile] = useState<File>();
  const [noFileError, setNoFileError] = useState<boolean>(false);
  const [noFileTobig, setnoFileTobig] = useState<boolean>(false);

  const vaultService = VaultService.getInstance();
  const qsrv = QueryService.getInstane();

  const {
    setValue,
    formState: {isSubmitSuccessful},
    reset,
    handleSubmit,
    control
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fileName: ''
    }
  });

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  const handleFileFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setNoFileError(false);
      setnoFileTobig(false);
      const name = e.target.files[0] ? e.target.files[0].name : '';
      setValue('fileName', name);
    }
  };

  const onSubmitHandler: SubmitHandler<RegisterInput> = async (values) => {
    if (!file) {
      setNoFileError(true);
      return
    } else if (file.size > Math.pow(2, 26)) {
      setnoFileTobig(true);
      return;
    }
    let uuid;
    let encFile: Blob;
    let fileNameBox: FileProps;
    let fileKeyBox: FileEncKeyBox;
    try {
      uuid = await vaultService.createFileCompanion(values.fileName);
      encFile = await vaultService.encryptFile(file, uuid);
      fileNameBox = vaultService.exportFileProps(uuid);
      fileKeyBox = vaultService.exportFileEncKeyBox(uuid);
    } catch (e: any) {
      console.log(e.message);
      return;
    }

    try {
      const res = await qsrv.createFileRequest(fileNameBox!, fileKeyBox!);
      console.log(await res.json());
    } catch (e: any) {
      console.log(e.message);
      return;
    }
    try {
      const res = await qsrv.sendFile(fileNameBox!.uuid, encFile!);
      if (res.ok) {
        alert("File uploaded");
        reset();
        setFile(undefined);
      } else {
        alert("Error");
      }
    } catch (e: any) {
      console.log(e.message);
    }
  };

  return (
    <>
      <Stack>

        <Typography sx={{mb: 1}} variant="h5"> Add file </Typography>

        <Stack sx={{mb: 2}} direction={'row'}>
          <Link to={"/filelist"}>
            <Button>
              File list
            </Button>
          </Link>
          <Link to={"/account"}>
            <Button>
              Home
            </Button>
          </Link>
        </Stack>

        <Controller
          control={control}
          render={({field, formState: {errors}}) => (
            <TextField
              {...field}
              sx={{mb: 2}}
              label="File name"
              required
              multiline
              type="text"
              error={!!errors['fileName']}
              helperText={errors['fileName'] ? errors['fileName'].message : ''}
            />
          )}
          name={'fileName'}
        />

        <Button
          sx={{mb: 1}}
          variant="contained"
          component="label"
        >
          Upload a file
          <input type="file" hidden onChange={handleFileFileChange}/>
        </Button>

        <Typography sx={{mb: 2}}>{file ? `Selected file: ${file.name}` : ""}</Typography>

        <Typography color={"red"} sx={{mb: 2}}>{noFileError ? "Select a file first" : ""}</Typography>
        <Typography color={"red"} sx={{mb: 2}}>{noFileTobig ? "File is to big (max 64mb)" : ""}</Typography>

        <Button onClick={handleSubmit(onSubmitHandler)} variant={"contained"}>
          Submit
        </Button>

      </Stack>

    </>
  );
};

const registerSchema = object({
  fileName: string()
    .min(3, 'File name must not be empty (min 3 characters)')
    .max(64, 'File name must be less than 64 characters'),
})

type RegisterInput = TypeOf<typeof registerSchema>;