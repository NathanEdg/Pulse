'use client'

import { useState } from 'react'

import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/server/better-auth/client'
import { toast } from 'sonner'

const LoginFormEmailPassword = () => {
  const [isVisible, setIsVisible] = useState(false)
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('userEmail') as string;
    const password = formData.get('password') as string;

    try {
      const response = await authClient.signIn.email({
        email: email,
        password: password,
        callbackURL: '/',
        rememberMe: formData.get('rememberMe') === 'on',
      });

      if (response.error) {
        if (response.error.code === "INVALID_EMAIL_OR_PASSWORD") {
          toast.error("Invalid email or password. Please try again.");
        }
      }
    } catch (error) {
        console.error('Login failed:', error);
    }
  }

  return (
    <form className='space-y-4' onSubmit={onSubmit}>
      {/* Email */}
      <div className='space-y-1'>
        <Label htmlFor='userEmail' className='leading-5'>
          Email address*
        </Label>
        <Input name='userEmail' type='email' id='userEmail' placeholder='Enter your email address' />
      </div>

      {/* Password */}
      <div className='w-full space-y-1'>
        <Label htmlFor='password' className='leading-5'>
          Password*
        </Label>
        <div className='relative'>
          <Input name='password' id='password' type={isVisible ? 'text' : 'password'} placeholder='••••••••••••••••' className='pr-9' />
          <Button
            variant='ghost'
            size='icon'
            type='button'
            onClick={() => setIsVisible(prevState => !prevState)}
            className='text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent'
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
          </Button>
        </div>
      </div>

      {/* Remember Me and Forgot Password */}
      <div className='flex items-center justify-between gap-y-2'>
        <div className='flex items-center gap-3'>
          <Checkbox name='rememberMe' id='rememberMe' className='size-6' />
          <Label htmlFor='rememberMe' className='text-muted-foreground'>
            {' '}
            Remember Me
          </Label>
        </div>

        <a href='#' className='hover:underline'>
          Forgot Password?
        </a>
      </div>

      <Button className='w-full' type='submit'>
        Sign in with Email
      </Button>
    </form>
  )
}

export default LoginFormEmailPassword
