import {Button, Stack, Typography} from "@mui/material";
import {VaultService} from "../services/VaultService";
import {Link, Navigate, useNavigate} from "react-router-dom";
import {useCallback, useEffect, useState} from "react";


export default function Account() {
  const [authenticated, setAuthenticated] = useState<boolean>(true);
  const vaultService = VaultService.getInstance();
  const navigate = useNavigate();

  useEffect(() => {
    setAuthenticated(vaultService.isAuthenticated())
  }, [setAuthenticated, vaultService])

  const logOut = useCallback(() => {
    VaultService.reset();
    setAuthenticated(false);
    navigate(0);
  }, [navigate, setAuthenticated])


  return (
    <>
      {authenticated
        ? <Stack>
          <Typography sx={{mb: 3}} variant={'h5'}>
            Company account
          </Typography>
          <Link to="/addfile">
            <Button>Add file</Button>
          </Link>
          <Link to={"/filelist"}>
            <Button>File List</Button>
          </Link>
          <Button onClick={logOut}>
            Logout
          </Button>
        </Stack>
        : <>
          <Navigate to={"/login"} replace={true}></Navigate>
        </>
      }
    </>
  )
}
