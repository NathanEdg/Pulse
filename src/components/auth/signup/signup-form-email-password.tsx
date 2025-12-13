'use client'

import { useState } from 'react'

import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/server/better-auth/client'
import { toast } from 'sonner'

const SignupFormEmailPassword = () => {
  const [isVisible, setIsVisible] = useState(false)
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('userEmail') as string;
    const password = formData.get('password') as string;
    const name = formData.get('userName') as string;

    try {
      const response = await authClient.signUp.email({
        email: email,
        name: name,
        password: password,
        callbackURL: '/check-your-email',
      });

      if (response.error) {
        toast.error("Signup failed, does the email address you provided already exist?");
      }
    } catch (error) {
        console.error('Signup failed:', error);
    }
  }

  return (
    <form className='space-y-4' onSubmit={onSubmit}>
      <div className='space-y-1'>
        <Label htmlFor='userName' className='leading-5'>
          Name*
        </Label>
        <Input name='userName' type='text' id='userName' placeholder='Enter your name' />
      </div>

      <div className='space-y-1'>
        <Label htmlFor='userEmail' className='leading-5'>
          Email address*
        </Label>
        <Input name='userEmail' type='email' id='userEmail' placeholder='Enter your email address' />
      </div>

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

      <Button className='w-full' type='submit'>
        Sign up with Email
      </Button>
    </form>
  )
}

export default SignupFormEmailPassword
