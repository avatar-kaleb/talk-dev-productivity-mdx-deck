import React from 'react';

export default function FullScreenLayout() {
  return (
    <div
      style={{
        width: '50vw',
        height: '50vw',
        fontSize: '12'
      }}
    >
      {children}
    </div>
  );
}
