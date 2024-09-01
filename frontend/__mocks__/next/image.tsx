import React from 'react';

const NextImage = (props: any) => {
  return React.createElement('img', { ...props, unoptimized: undefined });
};

export default NextImage;