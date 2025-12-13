import {Activity} from "lucide-react"

import { LoginForm } from "./_components/login-form"

export default function SignInPage() {
  return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">

          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <Activity className="size-4" />
              </div>
              Pulse
            </a>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <LoginForm />
            </div>
          </div>
        </div>

        <div className="bg-muted relative hidden lg:block">
          <img
              src="/auth-background.jpg"
              alt="293 background"
              className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
  )
}
