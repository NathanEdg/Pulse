import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams } from "next/navigation"

export interface SettingItem {
  id: string
  content: React.ReactNode
}

export interface SettingsSection {
  title: string
  description?:  string
  settings:  SettingItem[]
}

interface SettingsContainerProps {
  title?: string
  description?:  string
  sections: SettingsSection[]
  className?: string
  defaultSection?: string
}

export function SettingsContainer({ 
  title, 
  description, 
  sections, 
  className = "",
  defaultSection
}: SettingsContainerProps) {
  const searchParams = useSearchParams()
  const defaultValue = defaultSection ??  sections[0]?. title. toLowerCase().replace(/\s+/g, '-')
  
  // Initialize with URL param if present, otherwise use default
  const initialTab = searchParams.get('tab') ?? defaultValue
  const [activeTab, setActiveTab] = React.useState(initialTab)
  const [direction, setDirection] = React.useState(0)

  const handleTabChange = (newValue: string) => {
    const currentIndex = sections.findIndex(s => s.title.toLowerCase().replace(/\s+/g, '-') === activeTab)
    const newIndex = sections.findIndex(s => s. title. toLowerCase().replace(/\s+/g, '-') === newValue)
    
    setDirection(newIndex > currentIndex ?  1 : -1)
    setActiveTab(newValue)
    
    // Update URL with the new tab value
    const url = new URL(window.location.href)
    url.searchParams.set('tab', newValue)
    window.history.pushState({}, '', url.toString())
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity:  1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -20 :  20,
      opacity: 0,
    }),
  }

  return (
    <div className={`mx-auto max-w-4xl space-y-8 ${className}`}>
      {(title ?? description) && (
        <div className="space-y-2">
          {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          {sections. map((section) => {
            const tabValue = section.title. toLowerCase().replace(/\s+/g, '-')
            return (
              <TabsTrigger key={tabValue} value={tabValue}>
                {section.title}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="relative">
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            {sections.map((section) => {
              const tabValue = section. title.toLowerCase().replace(/\s+/g, '-')
              if (activeTab !== tabValue) return null
              
              return (
                <TabsContent 
                  key={tabValue} 
                  value={tabValue} 
                  forceMount 
                  className="data-[state=inactive]:hidden"
                >
                  <motion. div
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ 
                      duration: 0.15,
                      ease: "easeOut"
                    }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>{section.title}</CardTitle>
                        {section.description && <CardDescription>{section.description}</CardDescription>}
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {section.settings.map((setting, settingIndex) => (
                          <div key={setting. id}>
                            {setting. content}
                            {settingIndex < section.settings.length - 1 && <Separator className="mt-6" />}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              )
            })}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  )
}