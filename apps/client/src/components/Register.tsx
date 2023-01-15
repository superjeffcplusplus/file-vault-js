import {RegisterController} from "../controllers/RegisterController";
import {Button, Stack, TextField, Typography} from "@mui/material";
import {QueryService} from "../services/QueryService";
import {array, object, string, TypeOf} from "zod";
import {Controller, SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod/dist/zod";
import {useState} from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import {RegisterRequest} from "vault-lib";
import {UserAndPass} from "../lib/model";
import {VaultService} from "../services/VaultService";
import {useNavigate} from "react-router-dom";

export function Register() {
  const controller = RegisterController.getInstance();
  const qsrv = QueryService.getInstane();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    setValue,
    formState: {errors},
    reset,
    handleSubmit,
    control
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
    }
  });

  const {fields, append, remove} = useFieldArray({
    name: 'users',
    control
  })
  const setMockValues = async () => {
    setValue('companyName', 'my_company', {shouldTouch: true, shouldDirty: true})
    setValue('users', [
      {
        username: 'usr1',
        password: '12345678',
        passwordConfirm: '12345678',
      },
      {
        username: 'usr2',
        password: '12345678',
        passwordConfirm: '12345678',
      },
    ])
  }

  const onSubmitHandler: SubmitHandler<RegisterInput> = async (values) => {
    setLoading(true);
    const users: UserAndPass[] = values.users.map((u) => {
      return {
        name: u.username,
        pass: u.password,
      }
    });
    try {
      await controller.createCompany(
        values.companyName,
        users
      )
      const data: RegisterRequest = await controller.createRegisterRequest();
      const res = await qsrv.register(data)
      if (res.ok) {
        alert('Successful registration. You can now log in.');
        VaultService.reset();
        reset();
        remove();
        navigate('/login');
      } else {
        alert('Registration failed.')
      }
    } catch (e) {
      console.log(e);
      alert('Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography sx={{mb: 2}} variant={'h6'}>
        Register
      </Typography>
      <Stack
        sx={{height: "100%", overflow: "scroll"}}
        component='form'
        noValidate
        autoComplete='off'
        onSubmit={handleSubmit(onSubmitHandler)}
      >
        <Controller
          control={control}
          render={({field, formState: {errors}}) => (
            <TextField
              {...field}
              fullWidth
              sx={{mb: 2, mt: 2}}
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
              <Controller
                control={control}
                render={({field, formState: {errors}}) => (
                  <TextField
                    label='Password Confirm'
                    type={'password'}
                    fullWidth
                    sx={{mb: 2}}
                    {...field}
                    // @ts-ignore
                    error={errors['users'] !== undefined && errors['users'][index] !== undefined && errors['users'][index]?.passwordConfirm !== undefined}
                    // @ts-ignore
                    helperText={(errors['users'] !== undefined && errors['users'][index] !== undefined) ? errors['users'][index].passwordConfirm?.message : ''}
                  />
                )}
                name={`users.${index}.passwordConfirm`}
              />
              <Button
                sx={{mb: 2}}
                type={'button'}
                onClick={() => remove(index)}
              >Remove</Button>
            </Stack>
          );
        })
        }
        <Button
          type={'button'}
          onClick={() => {
            append({
              username: '',
              password: '',
              passwordConfirm: ''
            });
          }}
        >
          Add User
        </Button>
        {errors['users']?.message && <Typography color={'red'}>{errors['users']?.message}</Typography>}

        <LoadingButton
          variant='contained'
          fullWidth
          type='submit'
          loading={loading}
          sx={{py: '0.8rem', mt: '1rem'}}
        >
          Register
        </LoadingButton>
      </Stack>
      <Button onClick={setMockValues}>Set mock values</Button>
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
  passwordConfirm: string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.passwordConfirm, {
  path: ['passwordConfirm'],
  message: 'Passwords do not match',
})

const registerSchema = object({
  companyName: string()
    .min(3, 'Name must not be empty (min 3 characters)')
    .max(32, 'Name must be less than 32 characters'),
  users: array(userSchema).min(2, 'Minimum 2 users are required.')
})

type RegisterInput = TypeOf<typeof registerSchema>;
