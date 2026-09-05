import React from 'react';

interface HorizontalActionRowProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Isolated horizontal scroll container for button/action rows.
 * Allows smooth touch/swipe navigation on small screens when content overflows,
 * while preventing the entire page from having horizontal scrollbars.
 */
export const HorizontalActionRow: React.FC<HorizontalActionRowProps> = ({
  children,
  className = '',
  id,
}) => {
  return (
    <div
      id={id}
      className={`w-full max-w-full overflow-x-auto overflow-y-hidden touch-pan-x scroll-smooth no-scrollbar flex items-center flex-nowrap shrink-0 ${className}`}
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorX: 'contain',
      }}
    >
      {children}
    </div>
  );
};
