import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('px-6 py-4 border-b border-slate-200 dark:border-slate-800', className)}
      {...props}
    >
      {children}
    </div>
  );
};

const CardContent: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};

const CardFooter: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('px-6 py-4 border-t border-slate-200 dark:border-slate-800', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardContent, CardFooter };