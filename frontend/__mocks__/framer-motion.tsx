import React from 'react';

const createMockComponent = (displayName: string) => {
  const component = (props: any) => React.createElement(displayName, props);
  component.displayName = `motion.${displayName}`;
  return component;
};

export const motion = {
  div: createMockComponent('div'),
  button: createMockComponent('button'),
  // Add other components as needed
};

export const AnimatePresence = ({ children }: any) => React.createElement(React.Fragment, null, children);