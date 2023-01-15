import {Stack, Typography} from "@mui/material";
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
        <Link to={'/login'}>
          <Typography>Login</Typography>
        </Link>
        <Link to={'/register'}>
          <Typography>Register</Typography>
        </Link>
      </Stack>
    </>
  );
}