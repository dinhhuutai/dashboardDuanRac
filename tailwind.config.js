/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['./public/**/*.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        md: '0px 8px 12px #221a2d;',
      },
      keyframes: {
        infoBigSmall: {
          '0%': { transform: 'scale(.8)' },
          '30%': { transform: 'scale(.9)' },
          '40%': { transform: 'scale(1.01)' },
          '50%': { transform: 'scale(.8)' },
          '60%': { transform: 'scale(.8)' },
          '70%': { transform: 'scale(.89)' },
          '80%': { transform: 'scale(.85)' },
          '100%': { transform: 'scale(.8)' },
        },
        downSlide: {
          '0%': { height: '0px', display: 'hidden' },
          '100%': { height: '75px', display: 'block' },
        },
        upSlide: {
          '0%': { height: '75px', display: 'block' },
          '100%': { height: '0px', display: 'hidden' },
        },
        downSlide1: {
          '0%': { height: '0px', display: 'hidden' },
          '100%': { height: '110.5px', display: 'block' },
        },
        upSlide1: {
          '0%': { height: '110.5px', display: 'block' },
          '100%': { height: '0px', display: 'hidden' },
        },
        downSlide2: {
          '0%': { height: '0px', display: 'hidden' },
          '100%': { height: '146px', display: 'block' },
        },
        upSlide2: {
          '0%': { height: '146px', display: 'block' },
          '100%': { height: '0px', display: 'hidden' },
        },
        downSlide3: {
          '0%': { height: '0px', display: 'hidden' },
          '100%': { height: '181.5px', display: 'block' },
        },
        upSlide3: {
          '0%': { height: '181.5px', display: 'block' },
          '100%': { height: '0px', display: 'hidden' },
        },
        loading: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        noticeSlideLeft: {
          '0%': { transform: 'translateX(calc(100% + 30px))' },
          '40%': { transform: 'translateX(-30px)' },
          '80%': { transform: 'translateX(30px)' },
          '100%': { transform: 'translateX(0px)' },
        },
        noticeSlideRight: {
          '0%': { transform: 'translateX(0px)' },
          '40%': { transform: 'translateX(-30px)' },
          '60%': { transform: 'translateX(-30px)' },
          '100%': { transform: 'translateX(calc(100% + 30px))' },
        },
        noticeSlideTime: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
        fade: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        fade: 'fade 0.3s ease-in-out',
        infoBigSmall: 'infoBigSmall 1s ease-in-out infinite',
        downSlide: 'downSlide .2s ease-in-out forwards',
        upSlide: 'upSlide .2s ease-in-out forwards',
        downSlide1: 'downSlide1 .2s ease-in-out forwards',
        upSlide1: 'upSlide1 .2s ease-in-out forwards',
        downSlide2: 'downSlide2 .2s ease-in-out forwards',
        upSlide2: 'upSlide2 .2s ease-in-out forwards',
        downSlide3: 'downSlide3 .2s ease-in-out forwards',
        upSlide3: 'upSlide3 .2s ease-in-out forwards',
        loading: 'loading .8s linear infinite',
        noticeSlideLeft: 'noticeSlideLeft .6s linear forwards',
        noticeSlideRight: 'noticeSlideRight .6s linear forwards',
        noticeSlideTime: 'noticeSlideTime 10s linear forwards',
      },
    },
  },
  plugins: [],
};
