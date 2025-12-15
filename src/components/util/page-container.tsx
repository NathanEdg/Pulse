import { type ReactNode } from "react";

interface PageContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  showHeaderBorder?: boolean;
  containerClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function PageContainer({
  title,
  description,
  children,
  actions,
  showHeaderBorder = true,
  containerClassName = "",
  headerClassName = "",
  contentClassName = "",
}: PageContainerProps) {
  return (
    // ROOT: strictly constrains width/height.
    // 'overflow-hidden' here prevents the browser window from scrolling.
    <div
      className={`flex h-full w-full flex-col overflow-hidden ${containerClassName}`}
    >
      {/* HEADER: sits OUTSIDE the scroll area. */}
      {/* It effectively sits on top of the content structure. */}
      <div
        className={`z-10 w-full flex-none ${
          showHeaderBorder ? "border-border/40 border-b" : ""
        } ${headerClassName}`}
      >
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-foreground mb-1 truncate text-3xl font-bold">
                {title}
              </h1>
              {description && (
                <p className="text-muted-foreground truncate text-sm">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex shrink-0 items-center gap-3">{actions}</div>
            )}
          </div>
        </div>
      </div>

      {/* WRAPPER: Takes up remaining vertical space. */}
      {/* 'relative' and 'min-h-0' are crucial for the inner absolute div to work. */}
      <div className="relative min-h-0 w-full min-w-0 flex-1">
        {/* SCROLL AREA: Absolute positioning forces this div to match the wrapper size,
            IGNORING the size of the massive Kanban board inside.
            This is the only element that scrolls. */}
        <div
          className={`absolute inset-0 overflow-auto px-6 py-8 ${contentClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
