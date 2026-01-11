"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants> & {
      required?: boolean;
      requiredIndicator?: string; // Custom symbol override
    }
>(({ className, required, requiredIndicator, children, ...props }, ref) => {
  const { t } = useTranslation();
  const indicator = requiredIndicator ?? t('common.requiredIndicator', { defaultValue: '*' });
  
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      aria-required={required}
      {...props}
    >
      {children}
      {required && (
        <span className="text-destructive ml-1 font-semibold" aria-label="required">
          {indicator}
        </span>
      )}
    </LabelPrimitive.Root>
  );
})
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
