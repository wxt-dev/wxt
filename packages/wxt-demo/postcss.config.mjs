import postcssRemToResponsivePx from 'postcss-rem-to-responsive-pixel';

export default {
  plugins: [
    postcssRemToResponsivePx({
      rootValue: 16,
      propList: ['*'],
      transformUnit: 'px',
    }),
  ],
};
