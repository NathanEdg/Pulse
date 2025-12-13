"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import Logo from '@/components/logo/logo'
import AuthBackgroundShape from '../auth-background-shape'
import LoginFormEmailPassword from './login-form-email-password'
import React from 'react'
import { SlackIcon } from 'lucide-react'

const Login = () => {
  return (
    <div className='relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8'>
      <div className='absolute'>
        <AuthBackgroundShape />
      </div>

      <Card className='z-1 w-full border-none shadow-md sm:max-w-lg'>
        <CardHeader className='gap-6'>
          <Logo className='gap-3' />

          <div>
            <CardTitle className='mb-1.5 text-2xl'>Sign in to Pulse</CardTitle>
            <CardDescription className='text-base'>Access your projects and tasks.</CardDescription>
          </div>
        </CardHeader>

        <CardContent>


          <div className='space-y-4'>
            <LoginFormEmailPassword />
            
            <div className='flex items-center gap-4'>
              <Separator className='flex-1' />
              <p>or</p>
              <Separator className='flex-1' />
            </div>

            <Button variant='ghost' className='w-full' asChild>
              <div><SlackIcon /><a href='#'>Sign in with Slack</a></div>
            </Button>

            <p className='text-muted-foreground text-center'>
              New on our platform?{' '}
              <a href='/auth/signup' className='text-card-foreground hover:underline'>
                Create an account
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
