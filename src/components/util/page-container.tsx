import { type ReactNode } from "react";

interface PageContainerProps {
  /**
   * The main title of the page
   */
  title: string;
  /**
   * Optional description text displayed below the title
   */
  description?: string;
  /**
   * The main content of the page
   */
  children: ReactNode;
  /**
   * Optional action elements (buttons, etc.) displayed in the header
   */
  actions?: ReactNode;
  /**
   * Whether to include the header border and backdrop blur effect
   * @default true
   */
  showHeaderBorder?: boolean;
  /**
   * Custom container class names
   */
  containerClassName?: string;
  /**
   * Custom header class names
   */
  headerClassName?: string;
  /**
   * Custom content class names
   */
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
    <div className={`min-h-screen ${containerClassName}`}>
      {/* Page Header */}
      <div
        className={`${
          showHeaderBorder ? "border-border/40 border-b" : ""
        } ${headerClassName}`}
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground mb-1 text-3xl font-bold">
                {title}
              </h1>
              {description && (
                <p className="text-muted-foreground text-sm">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3">{actions}</div>
            )}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className={`container mx-auto px-6 py-8 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}
