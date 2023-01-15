import {Box, Button, Stack, TextField, Typography} from "@mui/material";
import {QueryService} from "../services/QueryService";
import {LoginController} from "../controllers/LoginController";
import {LoginInitResponse} from "vault-lib";
import {Navigate, useNavigate} from "react-router-dom";
import React, {useState} from "react";
import {Controller, SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import LoadingButton from "@mui/lab/LoadingButton";
import {zodResolver} from "@hookform/resolvers/zod/dist/zod";
import {array, object, string, TypeOf} from "zod";
import {VaultService} from "../services/VaultService";

const loginController = LoginController.getInstance();
const querySrv = QueryService.getInstane();
const vaultService = VaultService.getInstance();

export function Login() {
  const authenticated = vaultService.isAuthenticated();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    setValue,
    handleSubmit,
    control,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      companyName: '',
      users: [
        {
          username: '',
          password: ''
        },
        {
          username: '',
          password: ''
        }
      ]
    }
  });

  const {fields} = useFieldArray({
    name: 'users',
    control
  })
  const handleChallenge = async (challenge: any) => {
    setLoading(true);
    try {
      const s: string = await loginController.handleResponse(challenge as LoginInitResponse);
      const res = await querySrv.loginChallengeResponse({sig: s}, loginController.loginRequestId!);
      const json = await res.json();
      console.log(json)
      if (res.ok) {
        alert("auth succeeded");
        await loginController.fulfillAuth(json.token);
        navigate('/account');
      } else {
        alert("auth failed");
      }
    } catch (e: any) {
      console.log(e);
      alert("Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  const makeInitRequest: SubmitHandler<LoginInput> = async (values) => {
    loginController.usersAndPass.set(values.users[0].username, values.users[0].password);
    loginController.usersAndPass.set(values.users[1].username, values.users[1].password);
    loginController.company = values.companyName;

    try {
      const response = await querySrv.loginInit(loginController.getInitRequestData());
      if (response.ok) {
        const json: LoginInitResponse = await response.json();
        loginController.loginRequestId = json.login_req_id;
        await handleChallenge(json);
      } else {
        alert("Auth failed");
        return
      }
    } catch (e) {
      console.log("ERROR", e);
    }
  }

  const setMockData = () => {
    setValue('companyName', mockData.companyName);
    setValue('users', mockData.users);
  }

  return (
    <>
      {!authenticated
        ? <>
          <Typography sx={{mb: 2}} variant={'h6'}>
            Login
          </Typography>

          <Box
            component='form'
            noValidate
            autoComplete='off'
            onSubmit={handleSubmit(makeInitRequest)}
          >
            <Controller
              control={control}
              render={({field, formState: {errors}}) => (
                <TextField
                  {...field}
                  fullWidth
                  sx={{mb: 2}}
                  label='Company Name'
                  error={!!errors['companyName']}
                  helperText={errors['companyName'] ? errors['companyName'].message : ''}
                />
              )}
              name={'companyName'}
            />

            {fields.map((field, index) => {
              return (
                <Stack key={field.id} sx={{border: '1px solid grey', padding: 2, mb: 1, borderRadius: 2}}>
                  <Controller
                    control={control}
                    render={({field, formState: {errors}}) => (
                      <TextField
                        label='Username'
                        fullWidth
                        sx={{mb: 2}}
                        {...field}
                        // @ts-ignore
                        error={errors['users'] !== undefined && errors['users'][index] !== undefined && errors['users'][index]?.username !== undefined}
                        // @ts-ignore
                        helperText={(errors['users'] !== undefined && errors['users'][index] !== undefined) ? errors['users'][index].username?.message : ''}
                      />
                    )}
                    name={`users.${index}.username`}
                  />
                  <Controller
                    control={control}
                    render={({field, formState: {errors}}) => (
                      <TextField
                        label='Password'
                        type={'password'}
                        fullWidth
                        sx={{mb: 2}}
                        {...field}
                        // @ts-ignore
                        error={errors['users'] !== undefined && errors['users'][index] !== undefined && errors['users'][index]?.password !== undefined}
                        // @ts-ignore
                        helperText={(errors['users'] !== undefined && errors['users'][index] !== undefined) ? errors['users'][index].password?.message : ''}
                      />
                    )}
                    name={`users.${index}.password`}
                  />
                </Stack>
              );
            })
            }


            <LoadingButton
              variant='contained'
              fullWidth
              type='submit'
              loading={loading}
              sx={{py: '0.8rem', mt: '1rem'}}
            >
              Login
            </LoadingButton>
          </Box>
          <Button sx={{width: "100%", my: 2}} onClick={setMockData}>Mock Data</Button>
        </>
        : <>
          <Navigate to={"/account"} replace={true}></Navigate>
        </>
      }
    </>
  );
}

const userSchema = object({
  username: string()
    .min(3, 'Name must not be empty (min 3 characters)')
    .max(32, 'Name must be less than 32 characters'),
  password: string()
    .min(8, 'Password must be more than 8 characters')
    .max(32, 'Password must be less than 32 characters'),
})

const loginSchema = object({
  companyName: string()
    .min(3, 'Name must not be empty (min 3 characters)')
    .max(32, 'Name must be less than 32 characters'),
  users: array(userSchema).min(2, 'Minimum 2 users are required.')
})

type LoginInput = TypeOf<typeof loginSchema>;

const mockData: LoginInput = {
  companyName: 'my_company',
  users: [
    {
      username: 'usr1',
      password: '12345678',
    },
    {
      username: 'usr2',
      password: '12345678',
    },
  ]
}