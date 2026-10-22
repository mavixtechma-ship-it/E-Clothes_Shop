import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/**
 * Loomline PrimeNG preset: deep navy primary on warm sand neutrals.
 * Dark mode swaps the sand surfaces for ink-navy ones.
 */
export const LoomlinePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f2f5fa',
      100: '#e1e7f2',
      200: '#c4d0e5',
      300: '#9cafd1',
      400: '#7b93c2',
      500: '#4d6699',
      600: '#3b5080',
      700: '#2f4068',
      800: '#233150',
      900: '#19233a',
      950: '#0f1626',
    },
    focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '2px' },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#faf8f4',
          100: '#f3efe7',
          200: '#e8e1d4',
          300: '#d8cebc',
          400: '#b8ab93',
          500: '#8f8370',
          600: '#6e6556',
          700: '#534c41',
          800: '#39342d',
          900: '#24211c',
          950: '#161411',
        },
        primary: {
          color: '{primary.800}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.900}',
          activeColor: '{primary.950}',
        },
        highlight: {
          background: '{primary.100}',
          focusBackground: '{primary.200}',
          color: '{primary.900}',
          focusColor: '{primary.950}',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#eef0f5',
          100: '#d5dae4',
          200: '#b3bccc',
          300: '#8e99ad',
          400: '#6b778d',
          500: '#4e596d',
          600: '#3a4354',
          700: '#2a3141',
          800: '#1c2230',
          900: '#131824',
          950: '#0c1019',
        },
        primary: {
          color: '{primary.300}',
          contrastColor: '{primary.950}',
          hoverColor: '{primary.200}',
          activeColor: '{primary.100}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 80%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 70%)',
          color: 'rgba(255,255,255,.9)',
          focusColor: 'rgba(255,255,255,.95)',
        },
      },
    },
  },
});
