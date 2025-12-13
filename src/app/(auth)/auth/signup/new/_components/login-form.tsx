import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
      <form className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Login to your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Enter your email below to login to your account
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" placeholder="john.doe@example.com" required />
          </Field>

          <Field>
            <Button type="submit">Continue with Magic Link</Button>
          </Field>

          <FieldSeparator>Or</FieldSeparator>

          <Field>
            <Button
                variant="outline"
                type="button"
                className="flex items-center gap-1 px-3 py-2"
            >
              <Image
                  src="/slack.svg"
                  alt="Slack logo"
                  width={32}
                  height={32}
                  className="-mr-1"
              />
              <span className="text-sm font-medium">Continue with Slack</span>
            </Button>

            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
  )
}
