import {Button, Stack, Typography} from "@mui/material";
import {Link} from "react-router-dom";

export default function Home() {
  return (
    <>
      <Typography variant={'h4'}>
        Secure storage.
      </Typography>
      <Typography variant={'caption'}>
        Powered by Javascript & NodeJs.
      </Typography>
      <Stack direction='row' justifyContent='space-evenly' alignItems='center' sx={{flex: 1}}>
        <Button variant={'outlined'}>
          <Link to={'/login'}>
            <Typography>Login</Typography>
          </Link>
        </Button>
        <Button variant={'outlined'}>
          <Link to={'/register'}>
            <Typography>Register</Typography>
          </Link>
        </Button>
      </Stack>
    </>
  );
}